const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapNotification } = require('./helpers');

router.use(auth);

router.get('/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Notification')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapNotification));
  } catch (err) {
    console.error('GET /notifications error', err);
    res.status(500).json({ error: 'Impossible de récupérer les notifications' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const { error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (err) {
    console.error('PUT /notifications/read-all error', err);
    res.status(500).json({ error: 'Impossible de marquer toutes les notifications comme lues' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('Notification')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json(mapNotification(data));
  } catch (err) {
    console.error('PUT /notifications/:id/read error', err);
    res.status(500).json({ error: 'Impossible de marquer la notification comme lue' });
  }
});

module.exports = router;