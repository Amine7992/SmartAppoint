const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// --- INSCRIPTION (REGISTER) ---
router.post('/register', async (req, res) => {
  const {
    name, prenom, email, password, role, phone,
    cin, adresse, city,
    specialite, description,   // champs pro
  } = req.body;

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  console.log('Register request:', { email, role, phone, ip: clientIp });

  try {
    // 1. Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    // 2. Construire la ligne à insérer dans "utilisateur"
    const userRow = {
      id:            authData.user.id,
      nom:           name,
      prenom:        prenom,
      email:         email,
      phone:         phone        || null,
      cin:           cin          || null,
      adresse:       adresse      || null,
      city:          city         || null,
      role:          role,
      last_login_ip: clientIp,
    };

    // 3. Ajouter les champs pro uniquement si le rôle est 'professional'
    if (role === 'professional') {
      userRow.specialite  = specialite   || null;
      userRow.description = description  || null;
    }

    const { error: dbError } = await supabase
      .from('utilisateur')
      .insert([userRow]);

    if (dbError) throw dbError;

    res.status(201).json({ message: 'Utilisateur créé avec succès !' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error.message });
  }
});

// --- CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email, passwordProvided: !!password });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!data?.user?.id) {
      console.error('Supabase login returned no user:', data);
      return res.status(500).json({ error: `Impossible de récupérer l'utilisateur Supabase` });
    }

    const { data: userData, error: userError } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      return res.status(500).json({ error: 'Profil introuvable dans la table utilisateur' });
    }

    const mappedUser = {
      ...userData,
      name: userData.nom || userData.name || '',
    };

    res.status(200).json({
      message: 'Connexion réussie',
      token:   data.session.access_token,
      user:    mappedUser,
    });

  } catch (err) {
    console.error('Login exception:', err);
    res.status(500).json({ error: err.message || 'Une erreur serveur est survenue' });
  }
});

module.exports = router;