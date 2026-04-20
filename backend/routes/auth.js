const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const supabase = require('../config/supabase');
const { enrichProfileWithCoordinates } = require('../API/gecorder');
const { readAdminConfig } = require('../services/adminConfigStore');

const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const STORAGE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

const getStorageAdminClient = () =>
  createClient(process.env.SUPABASE_URL, STORAGE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

const getExtensionFromMimeType = (mimeType) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}[mimeType] || null);

const ensureLocalAvatarDir = (userId) => {
  const userDir = path.join(LOCAL_UPLOADS_DIR, userId);
  fs.mkdirSync(userDir, { recursive: true });
  return userDir;
};

const saveAvatarLocally = ({ userId, extension, fileBuffer }) => {
  const userDir = ensureLocalAvatarDir(userId);
  const filename = `profile.${extension}`;
  const absolutePath = path.join(userDir, filename);
  fs.writeFileSync(absolutePath, fileBuffer);
  return `/uploads/avatars/${userId}/${filename}`;
};

const uploadRegistrationAvatar = async ({ userId, imageBase64, contentType }) => {
  const extension = getExtensionFromMimeType(contentType);
  if (!extension) {
    throw new Error('Format image non supporte. Utilisez JPG, PNG ou WEBP.');
  }

  const base64Payload = String(imageBase64).includes(',') ? String(imageBase64).split(',').pop() : String(imageBase64);
  const fileBuffer = Buffer.from(base64Payload, 'base64');

  if (!fileBuffer.length) {
    throw new Error('Image invalide');
  }

  if (fileBuffer.length > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('Image trop volumineuse. Maximum 2 Mo.');
  }

  const avatarPath = `${userId}/profile.${extension}`;

  try {
    const storageClient = getStorageAdminClient();
    const { error: uploadError } = await storageClient.storage
      .from(AVATAR_BUCKET)
      .upload(avatarPath, fileBuffer, { contentType, upsert: true });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = storageClient.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
    return publicUrlData?.publicUrl || null;
  } catch (uploadError) {
    console.warn('Supabase avatar upload failed during registration, using local fallback:', uploadError.message);
    return saveAvatarLocally({ userId, extension, fileBuffer });
  }
};

const mapUser = (userData) => ({
  ...userData,
  name: [userData.prenom, userData.nom].filter(Boolean).join(' ').trim() || userData.nom || '',
  specialty: userData.specialite || '',
});

const mapSession = (session) => ({
  token: session.access_token,
  refreshToken: session.refresh_token,
  expiresAt: session.expires_at || null,
  expiresIn: session.expires_in || null,
});

router.post('/register', async (req, res) => {
  const {
    name, prenom, email, password, role, phone,
    cin, adresse, city,
    specialite, description,
    avatar_base64, avatar_content_type,
  } = req.body;

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  console.log('Register request:', { email, role, phone, ip: clientIp });

  const adminConfig = readAdminConfig();
  if (adminConfig.registration_open === false) {
    return res.status(403).json({ error: 'Les inscriptions sont temporairement fermées.' });
  }

  // Validation basique avant d'appeler Supabase
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Les champs email, mot de passe, nom et rôle sont obligatoires.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      // Traduire les erreurs Supabase en français
      let message = authError.message;
      if (message.includes('already registered') || message.includes('already been registered')) {
        message = 'Cet email est déjà utilisé. Veuillez vous connecter.';
      } else if (message.includes('invalid email')) {
        message = 'Adresse email invalide.';
      } else if (message.includes('password')) {
        message = 'Le mot de passe doit contenir au moins 6 caractères.';
      }
      return res.status(400).json({ error: message });
    }

    const baseUserRow = {
      id: authData.user.id,
      nom: name,
      prenom,
      email,
      phone: phone || null,
      cin: cin || null,
      adresse: adresse || null,
      city: city || null,
      role,
      last_login_ip: clientIp,
    };

    if (avatar_base64 && avatar_content_type) {
      baseUserRow.avatar_url = await uploadRegistrationAvatar({
        userId: authData.user.id,
        imageBase64: avatar_base64,
        contentType: avatar_content_type,
      });
    }

    if (role === 'professional') {
      baseUserRow.specialite = specialite || null;
      baseUserRow.description = description || null;
    }

    // Géocodage optionnel : si ça échoue, l'inscription continue quand même
    let userRow = baseUserRow;
    try {
      userRow = await enrichProfileWithCoordinates(baseUserRow);
    } catch (geoError) {
      console.warn('Géocodage ignoré (non bloquant) :', geoError.message);
      // On garde baseUserRow sans coordonnées, ce n'est pas critique
    }

    const { error: dbError } = await supabase.from('utilisateur').insert([userRow]);
    if (dbError) {
      // Si l'utilisateur Supabase Auth a été créé mais l'insert DB échoue,
      // on log l'erreur avec un message clair
      console.error('Erreur insertion utilisateur:', dbError);
      return res.status(400).json({ error: 'Erreur lors de la création du profil : ' + dbError.message });
    }

    res.status(201).json({ message: 'Compte créé avec succès ! Vous pouvez vous connecter.' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message || 'Une erreur est survenue lors de l\'inscription.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email, passwordProvided: !!password });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!data?.user?.id) {
      console.error('Supabase login returned no user:', data);
      return res.status(500).json({ error: "Impossible de recuperer l'utilisateur Supabase" });
    }

    const { data: userData, error: userError } = await supabase.from('utilisateur').select('*').eq('id', data.user.id).single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      return res.status(500).json({ error: 'Profil introuvable dans la table utilisateur' });
    }

    res.status(200).json({
      message: 'Connexion reussie',
      ...mapSession(data.session),
      user: mapUser(userData),
    });
  } catch (err) {
    console.error('Login exception:', err);
    res.status(500).json({ error: err.message || 'Une erreur serveur est survenue' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token manquant' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session?.user?.id) {
      console.error('Supabase refresh error:', error);
      return res.status(401).json({ error: 'Session expiree, veuillez vous reconnecter' });
    }

    const { data: userData, error: userError } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    if (userError) {
      console.error('Supabase user fetch after refresh error:', userError);
      return res.status(500).json({ error: 'Profil introuvable dans la table utilisateur' });
    }

    res.status(200).json({
      message: 'Session rafraichie',
      ...mapSession(data.session),
      user: mapUser(userData),
    });
  } catch (err) {
    console.error('Refresh exception:', err);
    res.status(500).json({ error: err.message || 'Une erreur serveur est survenue' });
  }
});

module.exports = router;
