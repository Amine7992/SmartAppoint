const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { mapProfessional, mapService, mapAppointment } = require('./helpers');
const { createNotification } = require('../services/notificationService');
const { getProfessionalReviewStatus } = require('../services/adminProfessionalReviewStore');
const {
  getProfessionalSchedule,
  getAvailableSlotsForDate,
  isSlotAllowedBySchedule,
} = require('../services/proScheduleStore');

const BOOKABLE_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

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

const buildAppointmentDateTime = (date, time) => {
  const nextDateTime = new Date(`${date}T${time}:00`);
  if (Number.isNaN(nextDateTime.getTime())) return null;
  return nextDateTime.toISOString();
};

const normalizeProfessionalStatus = (pro) => {
  const reviewedStatus = getProfessionalReviewStatus(pro?.id);
  if (reviewedStatus) return reviewedStatus;

  const validation = String(pro?.validation || '').trim().toLowerCase();
  if (['valide', 'validé', 'validated'].includes(validation)) return 'validated';
  if (['suspendu', 'suspended', 'rejete', 'rejeté', 'refuse', 'refusé'].includes(validation)) return 'suspended';
  return 'pending';
};

router.get('/professionals', async (req, res) => {
  try {
    const { data, error } = await supabase.from('utilisateur').select('*').eq('role', 'professional');
    if (error) throw error;
    res.json((data || []).map((pro) => ({
      ...mapProfessional(pro),
      validation: pro.validation || '',
      status: normalizeProfessionalStatus(pro),
    })));
  } catch (err) {
    console.error('GET /professionals error', err);
    res.status(500).json({ error: 'Impossible de recuperer les professionnels' });
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
    res.status(500).json({ error: 'Impossible de recuperer les services du professionnel' });
  }
});

// Returns taken time slots for a pro on a given date
router.get('/professionals/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date requise' });

    const start = new Date(`${date}T00:00:00`).toISOString();
    const end = new Date(`${date}T23:59:59`).toISOString();

    const { data, error } = await supabase
      .from('Appointment')
      .select('date_heure')
      .eq('professional_id', id)
      .in('status', ['pending', 'confirmed'])
      .gte('date_heure', start)
      .lte('date_heure', end);

    if (error) throw error;

    const takenSlots = (data || []).map((a) => {
      const d = new Date(a.date_heure);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    const schedule = getProfessionalSchedule(id);
    const availableSlots = getAvailableSlotsForDate(schedule, date, BOOKABLE_SLOTS);

    res.json({
      takenSlots,
      availableSlots,
      dayOff: schedule.daysOff.includes(date),
      workingDay: availableSlots.length > 0,
    });
  } catch (err) {
    console.error('GET /professionals/:id/slots error', err);
    res.status(500).json({ error: 'Impossible de recuperer les creneaux' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('client_id', req.user.id)
      .order('date_heure', { ascending: false });

    if (error) throw error;

    const serviceIds = [...new Set((appts || []).map((a) => a.service_id).filter(Boolean))];
    const proIds = [...new Set((appts || []).map((a) => a.professional_id).filter(Boolean))];
    const serviceRows = await fetchServicesByIds(serviceIds);
    const proRows = await fetchUsersByIds(proIds);
    const clientRows = await fetchUsersByIds([req.user.id]);
    const client = clientRows[0] || { nom: '' };

    const servicesById = Object.fromEntries((serviceRows || []).map((svc) => [svc.id, svc]));
    const prosById = Object.fromEntries((proRows || []).map((pro) => [pro.id, pro]));

    res.json((appts || []).map((appt) =>
      mapAppointment(appt, servicesById[appt.service_id], prosById[appt.professional_id], client)
    ));
  } catch (err) {
    console.error('GET /appointments error', err);
    res.status(500).json({ error: 'Impossible de recuperer vos rendez-vous' });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { professional_id, service_id, date, time } = req.body;
    if (!professional_id || !service_id || !date || !time) {
      return res.status(400).json({ error: 'Donnees de rendez-vous incompletes' });
    }

    const dateHeure = buildAppointmentDateTime(date, time);
    if (!dateHeure) {
      return res.status(400).json({ error: 'Date ou heure invalide' });
    }

    const schedule = getProfessionalSchedule(professional_id);
    if (!isSlotAllowedBySchedule(schedule, date, time)) {
      return res.status(400).json({ error: 'Ce creneau est en dehors des horaires du professionnel' });
    }

    const payload = {
      client_id: req.user.id,
      professional_id,
      service_id,
      date_heure: dateHeure,
      status: 'pending',
    };

    const { data, error } = await supabase.from('Appointment').insert([payload]).select().single();
    if (error) throw error;

    const [service] = await fetchServicesByIds([service_id]);
    const appointmentDate = new Date(dateHeure).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    await Promise.all([
      createNotification({
        userId: req.user.id,
        type: 'appointment',
        message: `Votre rendez-vous a bien ete cree pour le ${appointmentDate}.`,
      }),
      createNotification({
        userId: professional_id,
        type: 'appointment',
        message: `Nouveau rendez-vous reserve pour ${service?.nom || 'un service'} le ${appointmentDate}.`,
      }),
    ]);

    res.status(201).json({ message: 'Rendez-vous cree', appointment: data });
  } catch (err) {
    console.error('POST /appointments error', err);
    res.status(500).json({ error: 'Impossible de creer le rendez-vous' });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time } = req.body;
    if (!status && !(date && time)) {
      return res.status(400).json({ error: 'Statut ou nouvelle date/heure requis' });
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    if (!appointment) return res.status(404).json({ error: 'Rendez-vous introuvable' });

    const allowed = [appointment.client_id, appointment.professional_id].includes(req.user.id);
    if (!allowed) return res.status(403).json({ error: 'Acces non autorise' });

    const updates = {};
    if (status) updates.status = status;

    if (date && time) {
      if (appointment.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Seul le client peut modifier ce rendez-vous' });
      }
      if (!['pending', 'confirmed'].includes(String(appointment.status || '').toLowerCase())) {
        return res.status(400).json({ error: 'Ce rendez-vous ne peut pas etre modifie' });
      }

      const dateHeure = buildAppointmentDateTime(date, time);
      if (!dateHeure) {
        return res.status(400).json({ error: 'Date ou heure invalide' });
      }

      const schedule = getProfessionalSchedule(appointment.professional_id);
      if (!isSlotAllowedBySchedule(schedule, date, time)) {
        return res.status(400).json({ error: 'Ce creneau est en dehors des horaires du professionnel' });
      }

      updates.date_heure = dateHeure;
    }

    const { data, error } = await supabase
      .from('Appointment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const [service] = await fetchServicesByIds(data.service_id ? [data.service_id] : []);
    const [professional] = await fetchUsersByIds(data.professional_id ? [data.professional_id] : []);
    const [client] = await fetchUsersByIds(data.client_id ? [data.client_id] : []);
    const actorIsClient = appointment.client_id === req.user.id;
    const updatedDateTime = data.date_heure
      ? new Date(data.date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
      : null;

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      const clientMessage = actorIsClient
        ? `Vous avez mis a jour votre rendez-vous (${normalizedStatus}).`
        : `Le professionnel a mis a jour votre rendez-vous (${normalizedStatus}).`;
      const professionalMessage = actorIsClient
        ? `Le client a mis a jour le rendez-vous (${normalizedStatus}).`
        : `Vous avez mis a jour le rendez-vous du client (${normalizedStatus}).`;

      await Promise.all([
        createNotification({
          userId: data.client_id,
          type: normalizedStatus === 'cancelled' ? 'alert' : 'appointment',
          message: clientMessage,
        }),
        createNotification({
          userId: data.professional_id,
          type: normalizedStatus === 'cancelled' ? 'alert' : 'appointment',
          message: professionalMessage,
        }),
      ]);
    }

    if (date && time && updatedDateTime) {
      await Promise.all([
        createNotification({
          userId: data.client_id,
          type: 'appointment',
          message: `Votre rendez-vous a ete reprogramme au ${updatedDateTime}.`,
        }),
        createNotification({
          userId: data.professional_id,
          type: 'appointment',
          message: `Le rendez-vous de ${client?.nom || 'votre client'} a ete reprogramme au ${updatedDateTime}.`,
        }),
      ]);
    }

    res.json({
      message: 'Rendez-vous mis a jour',
      appointment: mapAppointment(data, service, professional, client),
    });
  } catch (err) {
    console.error('PUT /appointments/:id error', err);
    res.status(500).json({ error: err?.message || 'Impossible de mettre a jour le rendez-vous' });
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

    await Promise.all([
      createNotification({
        userId: req.user.id,
        type: 'alert',
        message: 'Votre rendez-vous a ete annule.',
      }),
      createNotification({
        userId: data.professional_id,
        type: 'alert',
        message: 'Un client a annule un rendez-vous.',
      }),
    ]);

    res.json({ message: 'Rendez-vous annule', appointment: data });
  } catch (err) {
    console.error('DELETE /appointments/:id error', err);
    res.status(500).json({ error: "Impossible d'annuler le rendez-vous" });
  }
});

// ---------------- STRIPE ----------------
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/appointments/:id/create-checkout-session', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appt, error } = await supabase
      .from('Appointment')
      .select('*, Service(*)')
      .eq('id', id)
      .eq('client_id', req.user.id)
      .single();

    if (error || !appt) return res.status(404).json({ error: 'Rendez-vous introuvable' });
    if (appt.status !== 'confirmed') return res.status(400).json({ error: 'Le rendez-vous doit etre confirme' });
    if (appt.payment_status === 'paid') return res.status(400).json({ error: 'Deja paye' });

    const price = appt.Service?.prix || 10;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: appt.Service?.nom || 'Consultation',
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:3000/client/payment-success?appointment_id=${id}`,
      cancel_url: `http://localhost:3000/client/appointments`,
      metadata: { appointment_id: id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error', err);
    res.status(500).json({ error: 'Impossible de creer la session de paiement' });
  }
});

router.post('/appointments/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: appt, error: fetchError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .eq('client_id', req.user.id)
      .single();
    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('Appointment')
      .update({ payment_status: 'paid' })
      .eq('id', id)
      .eq('client_id', req.user.id)
      .select()
      .single();
    if (error) throw error;

    await createNotification({
      userId: appt.professional_id,
      type: 'appointment',
      message: `Un client a effectue le paiement pour son rendez-vous du ${appt.date_heure?.split('T')[0]}.`,
    });

    res.json({ message: 'Paiement confirme', appointment: data });
  } catch (err) {
    console.error('confirm-payment error', err);
    res.status(500).json({ error: 'Impossible de confirmer le paiement' });
  }
});

module.exports = router;
