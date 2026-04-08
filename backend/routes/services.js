const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapService } = require('./helpers');


router.use(auth);

const requireProfessional = (req, res, next) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ error: 'Accès réservé aux professionnels' });
  }
  next();
};

router.get('/', requireProfessional, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Service')
      .select('*')
      .eq('professional_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapService));
  } catch (err) {
    console.error('GET /api/pro/services error', err);
    res.status(500).json({ error: 'Impossible de récupérer les services' });
  }
});

router.post('/', requireProfessional, async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ error: 'Nom et durée du service requis' });
    }

    const { data, error } = await supabase.from('Service').insert([{ 
      nom: name,
      description: description || null,
      duree_minutes: parseInt(duration, 10) || 30,
      prix: parseFloat(price) || 0,
      professional_id: req.user.id,
    }]).select().single();

    if (error) throw error;
    res.status(201).json(mapService(data));
  } catch (err) {
    console.error('POST /api/pro/services error', err);
    res.status(500).json({ error: 'Impossible de créer le service' });
  }
});

router.put('/:id', requireProfessional, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, price } = req.body;
    const updates = {};
    if (name) updates.nom = name;
    if (description !== undefined) updates.description = description;
    if (duration !== undefined) updates.duree_minutes = parseInt(duration, 10);
    if (price !== undefined) updates.prix = parseFloat(price);

    const { data, error } = await supabase
      .from('Service')
      .update(updates)
      .eq('id', id)
      .eq('professional_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapService(data));
  } catch (err) {
    console.error('PUT /api/pro/services/:id error', err);
    res.status(500).json({ error: 'Impossible de mettre à jour le service' });
  }
});

router.delete('/:id', requireProfessional, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('Service')
      .delete()
      .eq('id', id)
      .eq('professional_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Service supprimé' });
  } catch (err) {
    console.error('DELETE /api/pro/services/:id error', err);
    res.status(500).json({ error: 'Impossible de supprimer le service' });
  }
});

module.exports = router;
