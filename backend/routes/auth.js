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

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

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

    const userRow = await enrichProfileWithCoordinates(baseUserRow);

    const { error: dbError } = await supabase.from('utilisateur').insert([userRow]);
    if (dbError) throw dbError;

    res.status(201).json({ message: 'Utilisateur cree avec succes !' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message });
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
      token: data.session.access_token,
      user: mapUser(userData),
    });
  } catch (err) {
    console.error('Login exception:', err);
    res.status(500).json({ error: err.message || 'Une erreur serveur est survenue' });
  }
});

module.exports = router;
