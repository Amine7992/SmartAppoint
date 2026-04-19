const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { enrichProfileWithCoordinates } = require('../API/gecorder');
const { readAdminConfig } = require('../services/adminConfigStore');

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