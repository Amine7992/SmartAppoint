const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapProfessional, mapService, mapAppointment } = require('./helpers');

router.use(auth);

const fetchServicesByIds = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('Service').select('*').in('id', ids);
  if (error) throw error;
  return data;
};

const fetchUsersByIds = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('utilisateur').select('*').in('id', ids);
  if (error) throw error;
  return data;
};

router.get('/professionals', async (req, res) => {
  try {
    const { data, error } = await supabase.from('utilisateur').select('*').eq('role', 'professional');
    if (error) throw error;
    res.json((data || []).map(mapProfessional));
  } catch (err) {
    console.error('GET /professionals error', err);
    res.status(500).json({ error: 'Impossible de récupérer les professionnels' });
  }
});

router.get('/professionals/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('Service').select('*').eq('professional_id', id);
    if (error) throw error;
    res.json((data || []).map(mapService));
  } catch (err) {
    console.error('GET /professionals/:id/services error', err);
    res.status(500).json({ error: 'Impossible de récupérer les services du professionnel' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('client_id', req.user.id)
      .order('date_heure', { ascending: false }); // ✅ trié par date réelle du RDV

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const proIds     = [...new Set((appts || []).map((a) => a.professional_id).filter(Boolean))];
    const serviceRows = await fetchServicesByIds(serviceIds);
    const proRows     = await fetchUsersByIds(proIds);
    const clientRows  = await fetchUsersByIds([req.user.id]);
    const client      = clientRows[0] || { nom: '' };

    const servicesById = Object.fromEntries((serviceRows || []).map((svc) => [svc.id, svc]));
    const prosById     = Object.fromEntries((proRows     || []).map((pro) => [pro.id, pro]));

    res.json((appts || []).map((appt) =>
      mapAppointment(appt, servicesById[appt.service_id], prosById[appt.professional_id], client)
    ));
  } catch (err) {
    console.error('GET /appointments error', err);
    res.status(500).json({ error: 'Impossible de récupérer vos rendez-vous' });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { professional_id, service_id, date, time } = req.body;
    if (!professional_id || !service_id || !date || !time) {
      return res.status(400).json({ error: 'Données de rendez-vous incomplètes' });
    }

    const dateHeureSaisie = new Date(`${date}T${time}:00`).toISOString();
    const payload = {
      client_id:       req.user.id,
      professional_id,
      service_id,
      date_heure:      dateHeureSaisie,
      status:          'pending',
    };

    const { data, error } = await supabase.from('Appointment').insert([payload]).select().single();
    if (error) {
      console.error('Erreur Supabase détaillée:', error);
      throw error;
    }
    res.status(201).json({ message: 'Rendez-vous créé', appointment: data });
  } catch (err) {
    console.error('POST /appointments error', err);
    res.status(500).json({ error: 'Impossible de créer le rendez-vous' });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Statut requis' });

    const { data: appointment, error: fetchError } = await supabase
      .from('Appointment').select('*').eq('id', id).single();
    if (fetchError) throw fetchError;
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous introuvable' });

    const allowed = [appointment.client_id, appointment.professional_id].includes(req.user.id);
    if (!allowed) return res.status(403).json({ error: 'Accès non autorisé' });

    const { data, error } = await supabase
      .from('Appointment').update({ status }).eq('id', id).select().single();
    if (error) throw error;

    res.json({ message: 'Statut du rendez-vous mis à jour', appointment: data });
  } catch (err) {
    console.error('PUT /appointments/:id error', err);
    res.status(500).json({ error: 'Impossible de mettre à jour le rendez-vous' });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('Appointment')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('client_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ message: 'Rendez-vous annulé', appointment: data });
  } catch (err) {
    console.error('DELETE /appointments/:id error', err);
    // ✅ CORRIGÉ — apostrophe échappée
    res.status(500).json({ error: `Impossible d'annuler le rendez-vous` });
  }
});

module.exports = router;