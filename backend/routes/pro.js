const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapService, mapAppointment, mapProfessional } = require('./helpers');

router.use(auth);

const requireProfessional = (req, res, next) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ error: 'Accès réservé aux professionnels' });
  }
  next();
};

const fetchServicesByIds = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('Service').select('*').in('id', ids);
  if (error) throw error;
  return data;
};

const fetchClientsByIds = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('utilisateur').select('*').in('id', ids);
  if (error) throw error;
  return data;
};

router.get('/appointments', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const services = await fetchServicesByIds(serviceIds);
    const clients = await fetchClientsByIds(clientIds);

    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));

    res.json((appts || []).map((appt) =>
      mapAppointment(appt, servicesById[appt.service_id], null, clientsById[appt.client_id])
    ));
  } catch (err) {
    console.error('GET /pro/appointments error', err);
    res.status(500).json({ error: 'Impossible de récupérer les rendez-vous professionnels' });
  }
});

router.get('/appointments/today', requireProfessional, async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const services = await fetchServicesByIds(serviceIds);
    const clients = await fetchClientsByIds(clientIds);
    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));

    res.json((appts || []).map((appt) =>
      mapAppointment(appt, servicesById[appt.service_id], null, clientsById[appt.client_id])
    ));
  } catch (err) {
    console.error('GET /pro/appointments/today error', err);
    res.status(500).json({ error: 'Impossible de récupérer les rendez-vous d’aujourd’hui' });
  }
});

router.get('/appointments/risks', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const services = await fetchServicesByIds(serviceIds);
    const clients = await fetchClientsByIds(clientIds);
    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));

    res.json((appts || []).map((appt) => ({
      ...mapAppointment(appt, servicesById[appt.service_id], null, clientsById[appt.client_id]),
      ai_score: 0,
    })));
  } catch (err) {
    console.error('GET /pro/appointments/risks error', err);
    res.status(500).json({ error: 'Impossible de récupérer les risques' });
  }
});

router.get('/clients', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id);
    if (error) throw error;

    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];
    const clients = await fetchClientsByIds(clientIds);
    const historyByClient = {};

    (appts || []).forEach((appt) => {
      if (!appt.client_id) return;
      historyByClient[appt.client_id] = historyByClient[appt.client_id] || [];
      historyByClient[appt.client_id].push({
        id: appt.id,
        date: new Date(appt.created_at).toISOString().split('T')[0],
        service: appt.service_id || '',
        status: appt.status || 'pending',
      });
    });

    const clientsMapped = (clients || []).map((client) => {
      const history = historyByClient[client.id] || [];
      const appointmentsCount = history.length;
      const noShowCount = history.filter((h) => h.status === 'cancelled').length;
      const lastVisit = history
        .map((h) => h.date)
        .sort((a, b) => (a < b ? 1 : -1))[0] || null;

      return {
        id: client.id,
        name: client.nom || '',
        email: client.email || '',
        phone: client.phone || '',
        appointments_count: appointmentsCount,
        no_show_count: noShowCount,
        last_visit: lastVisit,
        history,
      };
    });

    res.json(clientsMapped);
  } catch (err) {
    console.error('GET /pro/clients error', err);
    res.status(500).json({ error: 'Impossible de récupérer les clients' });
  }
});

router.get('/services', requireProfessional, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Service')
      .select('*')
      .eq('professional_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(mapService));
  } catch (err) {
    console.error('GET /pro/services error', err);
    res.status(500).json({ error: 'Impossible de récupérer les services' });
  }
});

router.post('/services', requireProfessional, async (req, res) => {
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
    console.error('POST /pro/services error', err);
    res.status(500).json({ error: 'Impossible de créer le service' });
  }
});

router.put('/services/:id', requireProfessional, async (req, res) => {
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
    console.error('PUT /pro/services/:id error', err);
    res.status(500).json({ error: 'Impossible de mettre à jour le service' });
  }
});

router.delete('/services/:id', requireProfessional, async (req, res) => {
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
    console.error('DELETE /pro/services/:id error', err);
    res.status(500).json({ error: 'Impossible de supprimer le service' });
  }
});

router.get('/stats', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id);
    if (error) throw error;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { data: currentMonthAppts, error: monthError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .gte('created_at', monthStart);
    if (monthError) throw monthError;

    const cancelled = (appts || []).filter((a) => a.status === 'cancelled').length;
    const total = (appts || []).length;
    const absenceRate = total ? Math.round((cancelled / total) * 100) : 0;

    const { data: proRow } = await supabase.from('utilisateur').select('*').eq('id', req.user.id).single();

    res.json({
      today: (currentMonthAppts || []).filter((a) => {
        const d = new Date(a.created_at);
        return d.toDateString() === today.toDateString();
      }).length,
      month: (currentMonthAppts || []).length,
      absence_rate: absenceRate,
      rating: proRow?.rating || 0,
    });
  } catch (err) {
    console.error('GET /pro/stats error', err);
    res.status(500).json({ error: 'Impossible de récupérer les statistiques' });
  }
});

router.get('/stats/detailed', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id);
    if (error) throw error;

    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];
    const { data: clients } = await supabase.from('utilisateur').select('id').in('id', clientIds);
    const { data: services } = await supabase.from('Service').select('nom, id').eq('professional_id', req.user.id);

    const total = (appts || []).length;
    const months = {};
    (appts || []).forEach((appt) => {
      const d = new Date(appt.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });

    const monthly = Object.entries(months)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => (a.month < b.month ? 1 : -1));

    const { data: proRow } = await supabase.from('utilisateur').select('rating').eq('id', req.user.id).single();

    res.json({
      total_appointments: total,
      unique_clients: (clients || []).length,
      noshow_rate: total ? Math.round(((appts || []).filter((a) => a.status === 'cancelled').length / total) * 100) : 0,
      avg_rating: proRow?.rating || 0,
      monthly,
      services: (services || []).map((svc) => ({ name: svc.nom || '', count: 0 })),
    });
  } catch (err) {
    console.error('GET /pro/stats/detailed error', err);
    res.status(500).json({ error: 'Impossible de récupérer les statistiques détaillées' });
  }
});

module.exports = router;