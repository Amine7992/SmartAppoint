const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { enrichProfileWithCoordinates } = require('../API/gecorder');
const { getProfessionalReviewStatus } = require('../services/adminProfessionalReviewStore');
const { getCategoryFromSpecialite } = require('./specialites');
const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const STORAGE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

const getAuthClientWithToken = (token) => {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  client.auth.setSession({ access_token: token });
  return client;
};

const getStorageClientWithToken = (token) =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

const getStorageAdminClient = () =>
  createClient(process.env.SUPABASE_URL, STORAGE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

const getExtensionFromMimeType = (mimeType) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}[mimeType] || null);

const mapUser = (userData) => {
  const reviewedStatus = userData?.role === 'professional' ? getProfessionalReviewStatus(userData?.id) : null;
  const validation = String(userData.validation || '').trim().toLowerCase();
  const status = reviewedStatus || (
    ['valide', 'validé', 'validated'].includes(validation)
      ? 'validated'
      : (['suspendu', 'suspended', 'rejete', 'rejeté', 'refuse', 'refusé'].includes(validation)
        ? 'suspended'
        : 'pending')
  );

  return {
    ...userData,
    name: [userData.prenom, userData.nom].filter(Boolean).join(' ').trim() || userData.nom || '',
    specialty: userData.specialite || '',
    verified: status === 'validated',
    status,
  };
};

const ensureLocalAvatarDir = (userId) => {
  const userDir = path.join(LOCAL_UPLOADS_DIR, userId);
  fs.mkdirSync(userDir, { recursive: true });
  return userDir;
};

const saveAvatarLocally = ({ userId, extension, fileBuffer, req }) => {
  const userDir = ensureLocalAvatarDir(userId);
  const filename = `profile.${extension}`;
  const absolutePath = path.join(userDir, filename);
  fs.writeFileSync(absolutePath, fileBuffer);
  return `/uploads/avatars/${userId}/${filename}`;
};

const removeLocalAvatar = (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.includes('/uploads/avatars/')) return;
  try {
    const relativePath = avatarUrl.split('/uploads/').pop();
    if (!relativePath) return;
    const absolutePath = path.join(__dirname, '..', relativePath.replace(/\//g, path.sep));
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
  } catch (error) {
    console.warn('Local avatar cleanup failed:', error.message);
  }
};

router.use(auth);

router.get('/users/profile', async (req, res) => {
  try {
    const { data, error } = await supabase.from('utilisateur').select('*').eq('id', req.user.id).single();
    if (error) throw error;
    res.json(mapUser(data));
  } catch (err) {
    console.error('GET /users/profile error', err);
    res.status(500).json({ error: 'Impossible de recuperer le profil utilisateur' });
  }
});

router.put('/users/profile', async (req, res) => {
  try {
    const { nom, prenom, email, phone, name, specialite, city, adresse, description } = req.body;
    const updates = {};
    if (nom !== undefined) updates.nom = nom || null;
    if (prenom !== undefined) updates.prenom = prenom || null;
    if (name !== undefined && nom === undefined) updates.nom = name || null;
    if (email !== undefined) updates.email = email || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (specialite !== undefined) {updates.categorie = getCategoryFromSpecialite(specialite) || null;}
    if (city !== undefined) updates.city = city || null;
    if (adresse !== undefined) updates.adresse = adresse || null;
    if (description !== undefined) updates.description = description || null;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
    }

    if (city !== undefined || adresse !== undefined) {
      const { data: currentUser, error: currentUserError } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id', req.user.id)
        .single();
      if (currentUserError) throw currentUserError;

      const enrichedProfile = await enrichProfileWithCoordinates({
        ...currentUser,
        ...updates,
      });

      updates.city = enrichedProfile.city ?? updates.city ?? null;
      updates.lat = enrichedProfile.lat ?? 0;
      updates.lon = enrichedProfile.lon ?? 0;
    }

    const { data, error } = await supabase.from('utilisateur').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;

    if (email !== undefined) {
      const authClient = getAuthClientWithToken(req.supabaseAuthToken);
      const { error: emailError } = await authClient.auth.updateUser({ email });
      if (emailError) console.warn('Failed to update Supabase auth email:', emailError.message);
    }

    res.json(mapUser(data));
  } catch (err) {
    console.error('PUT /users/profile error', err);
    res.status(500).json({ error: 'Impossible de mettre a jour le profil' });
  }
});

router.post('/users/avatar', async (req, res) => {
  try {
    const { image_base64, content_type } = req.body || {};
    if (!image_base64 || !content_type) return res.status(400).json({ error: 'Image et type requis' });

    const extension = getExtensionFromMimeType(content_type);
    if (!extension) return res.status(400).json({ error: 'Format image non supporte. Utilisez JPG, PNG ou WEBP.' });

    const base64Payload = String(image_base64).includes(',') ? String(image_base64).split(',').pop() : String(image_base64);
    const fileBuffer = Buffer.from(base64Payload, 'base64');
    if (!fileBuffer.length) return res.status(400).json({ error: 'Image invalide' });
    if (fileBuffer.length > MAX_AVATAR_SIZE_BYTES) return res.status(400).json({ error: 'Image trop volumineuse. Maximum 2 Mo.' });

    const avatarPath = `${req.user.id}/profile.${extension}`;
    let avatarUrl = null;

    try {
      const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? getStorageAdminClient() : getStorageClientWithToken(req.supabaseAuthToken);
      const { error: uploadError } = await storageClient.storage.from(AVATAR_BUCKET).upload(avatarPath, fileBuffer, { contentType: content_type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = storageClient.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
      avatarUrl = publicUrlData?.publicUrl || null;
    } catch (uploadError) {
      console.warn('Supabase avatar upload failed, using local fallback:', uploadError.message);
      avatarUrl = saveAvatarLocally({ userId: req.user.id, extension, fileBuffer, req });
    }

    const { data, error } = await supabase.from('utilisateur').update({ avatar_url: avatarUrl }).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json(mapUser(data));
  } catch (err) {
    console.error('POST /users/avatar error', err);
    res.status(500).json({ error: 'Impossible de mettre a jour la photo de profil' });
  }
});

router.delete('/users/avatar', async (req, res) => {
  try {
    const { data: currentUser, error: fetchError } = await supabase.from('utilisateur').select('*').eq('id', req.user.id).single();
    if (fetchError) throw fetchError;

    const avatarUrl = currentUser?.avatar_url || '';
    if (avatarUrl.includes('/storage/v1/object/')) {
      const objectPath = avatarUrl.split(`/${AVATAR_BUCKET}/`).pop();
      if (objectPath) {
        try {
          const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? getStorageAdminClient() : getStorageClientWithToken(req.supabaseAuthToken);
          await storageClient.storage.from(AVATAR_BUCKET).remove([objectPath]);
        } catch (error) {
          console.warn('Remote avatar cleanup failed:', error.message);
        }
      }
    } else {
      removeLocalAvatar(avatarUrl);
    }

    const { data, error } = await supabase.from('utilisateur').update({ avatar_url: null }).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json(mapUser(data));
  } catch (err) {
    console.error('DELETE /users/avatar error', err);
    res.status(500).json({ error: 'Impossible de supprimer la photo de profil' });
  }
});

router.put('/users/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Les deux mots de passe sont requis' });

    const userEmail = req.user.email;
    if (!userEmail) return res.status(400).json({ error: 'Email utilisateur introuvable dans le token' });

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: current_password });
    if (signInError) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const authClient = getAuthClientWithToken(req.supabaseAuthToken);
    const { error: updateError } = await authClient.auth.updateUser({ password: new_password });
    if (updateError) return res.status(500).json({ error: 'Impossible de mettre a jour le mot de passe' });

    res.json({ message: 'Mot de passe mis a jour' });
  } catch (err) {
    console.error('PUT /users/password error', err);
    res.status(500).json({ error: 'Impossible de mettre a jour le mot de passe' });
  }
});

module.exports = router;
