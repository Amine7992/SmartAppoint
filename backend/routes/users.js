const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

const getAuthClientWithToken = (token) => {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  client.auth.setSession({ access_token: token });
  return client;
};

router.use(auth);

router.put('/users/profile', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updates = {};
    if (name) updates.nom = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    const { data, error } = await supabase
      .from('utilisateur')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;

    if (email) {
      const authClient = getAuthClientWithToken(req.supabaseAuthToken);
      const { error: emailError } = await authClient.auth.updateUser({ email });
      if (emailError) {
        console.warn('Failed to update Supabase auth email:', emailError.message);
      }
    }

    res.json(data);
  } catch (err) {
    console.error('PUT /users/profile error', err);
    res.status(500).json({ error: 'Impossible de mettre à jour le profil' });
  }
});

router.put('/users/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Les deux mots de passe sont requis' });
    }

    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'Email utilisateur introuvable dans le token' });
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: current_password,
    });
    if (signInError) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const authClient = getAuthClientWithToken(req.supabaseAuthToken);
    const { data: updateData, error: updateError } = await authClient.auth.updateUser({ password: new_password });
    if (updateError) {
      console.error('Password update error', updateError);
      return res.status(500).json({ error: 'Impossible de mettre à jour le mot de passe' });
    }

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('PUT /users/password error', err);
    res.status(500).json({ error: 'Impossible de mettre à jour le mot de passe' });
  }
});

module.exports = router;
