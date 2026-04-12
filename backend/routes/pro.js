const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapService, mapAppointment } = require('./helpers');
const { createNotification } = require('../services/notificationService');

router.use(auth);

const requireProfessional = (req, res, next) => {
  if (req.user.role !== 'professional') {
    return res.status(403).json({ error: 'Acces reserve aux professionnels' });
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

const fetchAppointmentsByClientIds = async (ids) => {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('Appointment')
    .select('*')
    .in('client_id', ids)
    .order('date_heure', { ascending: false });
  if (error) throw error;
  return data;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const diffInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
};

const getDistanceScore = (client, professional) => {
  const clientLat = Number(client?.lat);
  const clientLon = Number(client?.lon);
  const proLat = Number(professional?.lat);
  const proLon = Number(professional?.lon);

  if ([clientLat, clientLon, proLat, proLon].every((value) => Number.isFinite(value))) {
    const earthRadiusKm = 6371;
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latDelta = toRadians(proLat - clientLat);
    const lonDelta = toRadians(proLon - clientLon);
    const a =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(toRadians(clientLat)) *
        Math.cos(toRadians(proLat)) *
        Math.sin(lonDelta / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((earthRadiusKm * c).toFixed(4));
  }

  if (
    client?.city &&
    professional?.city &&
    String(client.city).trim().toLowerCase() === String(professional.city).trim().toLowerCase()
  ) {
    return 0;
  }

  return 10;
};

const buildModelFeatures = ({ appointment, client, professional, history }) => {
  const totalAppointments = history.length;
  const noShowCount = history.filter((item) => String(item.status || '').toLowerCase() === 'cancelled').length;
  const completedCount = Math.max(0, totalAppointments - noShowCount);
  const reliabilityScore = totalAppointments ? completedCount / totalAppointments : 0.5;

  const ratings = history
    .map((item) => Number(item.rating))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageRating = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 0;

  const normalizedReliabilityScore = Number(clamp(reliabilityScore, 0, 1).toFixed(4));
  const normalizedTotalAppointments = Math.max(0, totalAppointments);

  return {
    delai_reservation_jours: diffInDays(appointment.created_at || appointment.date_heure, appointment.date_heure),
    score_fiabilite_client: normalizedReliabilityScore,
    moyenne_notes_donnees: Number(clamp(averageRating, 0, 5).toFixed(2)),
    anciennete_compte_jours: diffInDays(client?.created_at || appointment.created_at, new Date().toISOString()),
    nombre_total_rdv_client: normalizedTotalAppointments,
    score_distance_geo: getDistanceScore(client, professional),
    poids_fidelite: Number((normalizedReliabilityScore * Math.log1p(normalizedTotalAppointments)).toFixed(6)),
  };
};

const predictRiskScore = async (features) => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001/predict';
  const response = await fetch(aiServiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Service IA indisponible: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  if (payload.status !== 'success') {
    throw new Error(payload.message || 'Prediction IA invalide');
  }

  return {
    ai_score: Number(clamp(payload.risk_score ?? 0, 0, 1).toFixed(4)),
    ai_prediction: payload.prediction,
    ai_confidence: payload.confiance ?? null,
    ai_attendance_score: payload.attendance_score ?? null,
    ai_features: features,
    ai_generated_at: new Date().toISOString(),
  };
};

router.get('/appointments', requireProfessional, async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .order('date_heure', { ascending: true });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const services = await fetchServicesByIds(serviceIds);
    const clients = await fetchClientsByIds(clientIds);

    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));

    const formatted = (appts || []).map((appt) => {
      const dt = new Date(appt.date_heure);
      return {
        ...mapAppointment(appt, servicesById[appt.service_id], null, clientsById[appt.client_id]),
        date: appt.date_heure.split('T')[0],
        time: dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace('h', ':'),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('GET /pro/appointments error', err);
    res.status(500).json({ error: 'Impossible de recuperer les rendez-vous' });
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
      .gte('date_heure', start)
      .lt('date_heure', end)
      .order('date_heure', { ascending: true });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const services = await fetchServicesByIds(serviceIds);
    const clients = await fetchClientsByIds(clientIds);
    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));

    res.json((appts || []).map((appt) => {
      const dt = new Date(appt.date_heure);
      return {
        ...mapAppointment(appt, servicesById[appt.service_id], null, clientsById[appt.client_id]),
        date: appt.date_heure.split('T')[0],
        time: dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace('h', ':'),
      };
    }));
  } catch (err) {
    console.error('GET /pro/appointments/today error', err);
    res.status(500).json({ error: "Impossible de recuperer les rendez-vous d'aujourd'hui" });
  }
});

router.get('/appointments/risks', requireProfessional, async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });

    const now = new Date().toISOString();
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('professional_id', req.user.id)
      .gte('date_heure', now)
      .order('date_heure', { ascending: true });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const clientIds = [...new Set((appts || []).map((a) => a.client_id).filter(Boolean))];

    const [services, clients, clientAppointments, professionalRows] = await Promise.all([
      fetchServicesByIds(serviceIds),
      fetchClientsByIds(clientIds),
      fetchAppointmentsByClientIds(clientIds),
      fetchClientsByIds([req.user.id]),
    ]);

    const servicesById = Object.fromEntries((services || []).map((svc) => [svc.id, svc]));
    const clientsById = Object.fromEntries((clients || []).map((cli) => [cli.id, cli]));
    const historyByClientId = {};

    for (const item of clientAppointments || []) {
      if (!item.client_id) continue;
      historyByClientId[item.client_id] = historyByClientId[item.client_id] || [];
      historyByClientId[item.client_id].push(item);
    }

    const professional = professionalRows[0] || null;
    const riskAppointments = await Promise.all((appts || []).map(async (appt) => {
      const client = clientsById[appt.client_id];
      const features = buildModelFeatures({
        appointment: appt,
        client,
        professional,
        history: historyByClientId[appt.client_id] || [],
      });
      const prediction = await predictRiskScore(features);

      return {
        ...mapAppointment(appt, servicesById[appt.service_id], null, client),
        ...prediction,
      };
    }));

    res.json(riskAppointments);
  } catch (err) {
    console.error('GET /pro/appointments/risks error', err);
    res.status(500).json({ error: 'Impossible de recuperer les risques' });
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
        date: new Date(appt.date_heure).toISOString().split('T')[0],
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
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        phone: client.phone || '',
        avatar_url: client.avatar_url || '',
        appointments_count: appointmentsCount,
        no_show_count: noShowCount,
        last_visit: lastVisit,
        history,
      };
    });

    res.json(clientsMapped);
  } catch (err) {
    console.error('GET /pro/clients error', err);
    res.status(500).json({ error: 'Impossible de recuperer les clients' });
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
    res.status(500).json({ error: 'Impossible de recuperer les services' });
  }
});

router.post('/services', requireProfessional, async (req, res) => {
  try {
    const { name, description, duration, price } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ error: 'Nom et duree du service requis' });
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
    res.status(500).json({ error: 'Impossible de creer le service' });
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
    res.status(500).json({ error: 'Impossible de mettre a jour le service' });
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
    res.json({ message: 'Service supprime' });
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
      .gte('date_heure', monthStart);
    if (monthError) throw monthError;

    const cancelled = (appts || []).filter((a) => a.status === 'cancelled').length;
    const total = (appts || []).length;
    const absenceRate = total ? Math.round((cancelled / total) * 100) : 0;

    const { data: proRow } = await supabase.from('utilisateur').select('*').eq('id', req.user.id).single();

    res.json({
      today: (currentMonthAppts || []).filter((a) => {
        const d = new Date(a.date_heure);
        return d.toDateString() === today.toDateString();
      }).length,
      month: (currentMonthAppts || []).length,
      absence_rate: absenceRate,
      rating: proRow?.rating || 0,
    });
  } catch (err) {
    console.error('GET /pro/stats error', err);
    res.status(500).json({ error: 'Impossible de recuperer les statistiques' });
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
      const d = new Date(appt.date_heure);
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
    res.status(500).json({ error: 'Impossible de recuperer les statistiques detaillees' });
  }
});

// Mark appointment as completed
router.put('/appointments/:id/complete', requireProfessional, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appt, error: fetchError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .eq('professional_id', req.user.id)
      .single();

    if (fetchError || !appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
    if (appt.status !== 'confirmed') return res.status(400).json({ error: 'Le rendez-vous doit etre confirme' });

    const apptTime = new Date(appt.date_heure);
    if (apptTime > new Date()) return res.status(400).json({ error: 'Le rendez-vous n\'est pas encore passe' });

    const { data, error } = await supabase
      .from('Appointment')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await createNotification({
      userId: appt.client_id,
      type: 'appointment',
      message: `Votre rendez-vous du ${apptTime.toLocaleDateString('fr-FR')} a ete marque comme termine par le professionnel.`,
    });

    res.json({ message: 'Rendez-vous termine', appointment: data });
  } catch (err) {
    console.error('PUT /pro/appointments/:id/complete error', err);
    res.status(500).json({ error: 'Impossible de terminer le rendez-vous' });
  }
});

module.exports = router;
