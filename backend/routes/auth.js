const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    const { error: dbError } = await supabase
      .from('utilisateur')
      .insert([{
        id: authData.user.id,
        nom: name,
        email: email,
        phone: phone,
        role: role,
        derniere_ip: clientIp 
      }]);

    if (dbError) throw dbError;

    res.status(201).json({ message: 'Utilisateur créé avec succès !' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;