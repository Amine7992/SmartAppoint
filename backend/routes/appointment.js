const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

router.use(auth);

// POST /api/appointments/:id/rating
router.post('/:id/rating', async (req, res) => {
  const { id } = req.params;
  const { rating, comment, professional_id } = req.body;

  // 1. Validation de base
  if (!rating || rating < 1 || rating > 5)
    return res.status(400).json({ error: 'La note doit être comprise entre 1 et 5.' });

  try {
    // ── Étape 1 : Récupérer le RDV ──
    const { data: appt, error: apptError } = await supabase
      .from('Appointment')
      .select('id, client_id, professional_id, status, rating')
      .eq('id', id)
      .maybeSingle();

    if (apptError) throw apptError;
    if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });

    // Vérification de propriété
    if (appt.client_id !== req.user.id)
      return res.status(403).json({ error: 'Ce rendez-vous ne vous appartient pas.' });

    // Vérification si déjà noté
    if (appt.rating !== null && appt.rating !== undefined)
      return res.status(409).json({ error: 'Vous avez déjà noté ce rendez-vous.' });

    // ✅ CORRECTION ICI : Ajout de 'cancelled' dans les statuts autorisés
    const allowedStatuses = ['past', 'no_show', 'cancelled', 'completed'];
    const normalizedStatus = String(appt.status || '').trim().toLowerCase();
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ 
        error: `Ce rendez-vous (statut: ${appt.status}) ne peut pas encore être noté.` 
      });
    }

    const targetProfessionalId = appt.professional_id || professional_id;
    if (!targetProfessionalId) {
      return res.status(400).json({ error: 'professional_id introuvable pour ce rendez-vous.' });
    }

    // ── Étape 2 : Enregistrer la note ──
    const { error: updateApptError } = await supabase
      .from('Appointment')
      .update({ rating, comment: comment || null })
      .eq('id', id);
    
    if (updateApptError) {
        console.error("Erreur mise à jour Appointment:", updateApptError);
        throw updateApptError;
    }

    // ── Étape 3 : Recalculer la moyenne du professionnel ──
    const { data: ratedAppts, error: ratedError } = await supabase
      .from('Appointment')
      .select('rating')
      .eq('professional_id', targetProfessionalId)
      .not('rating', 'is', null);
    
    if (ratedError) throw ratedError;

    const allRatings = (ratedAppts || []).map(a => a.rating);
    const avg = allRatings.length > 0
      ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10
      : rating;

    // ── Étape 4 : Mettre à jour le rating du professionnel dans 'utilisateur' ──
    const { error: updateProError } = await supabase
      .from('utilisateur')
      .update({ rating: avg })
      .eq('id', targetProfessionalId);
    
    if (updateProError) {
        console.error("Erreur mise à jour Utilisateur (Pro):", updateProError);
        // Note: On ne throw pas forcément ici pour ne pas annuler l'étape 2 si seule la moyenne échoue
    }

    try {
      await Promise.all([
        createNotification({
          userId: req.user.id,
          type: 'info',
          message: 'Votre avis a bien ete enregistre. Merci pour votre retour.',
        }),
        createNotification({
          userId: targetProfessionalId,
          type: 'info',
          message: `Vous avez recu une nouvelle note de ${rating}/5.`,
        }),
      ]);
    } catch (notificationError) {
      console.error('Notification rating warning:', notificationError);
    }

    res.status(200).json({
      message: 'Note enregistrée avec succès.',
      new_rating: rating,
      avg_rating: avg,
    });

  } catch (err) {
    console.error('ERREUR SERVEUR :', err);
    res.status(500).json({ 
        error: `Erreur technique lors de l'enregistrement`, 
        details: err.message 
    });
  }
});

// ====================== CLIENT REQUESTS RESCHEDULE ======================
router.put('/:id/reschedule', async (req, res) => {
  const { date, time } = req.body;
  const now = new Date();
  const requestedDate = new Date(`${date}T${time}`);

  if (requestedDate < now) {
    return res.status(400).json({ error: "On ne peut pas prendre un rendez-vous dans le passé !" });
  }
  const { id } = req.params;

  if (!date || !time) {
    return res.status(400).json({ error: 'Date et heure sont obligatoires.' });
  }

  try {
    // Force it as Tunisia time (UTC+1) without timezone conversion issues
    const newDateHeure = `${date}T${time}:00+01:00`;

    const { data: appt, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, client_id, professional_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !appt) {
      console.error("Fetch error:", fetchError);
      return res.status(404).json({ error: 'Rendez-vous introuvable.' });
    }

    if (appt.client_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });
    if (appt.status !== 'confirmed') return res.status(400).json({ error: 'Seul un RDV confirmé peut être modifié.' });

    const { error: updateError } = await supabase
      .from('Appointment')
      .update({ 
        date_heure: newDateHeure, 
        status: 'reschedule_requested' 
      })
      .eq('id', id);

    if (updateError) throw updateError;

    await createNotification({
      userId: appt.professional_id,
      type: 'appointment',
      message: `Un client a demandé une modification pour le ${date} à ${time}.`,
      appointment_id: id
    });

    res.json({ message: 'Demande de modification envoyée avec succès.' });
  } catch (err) {
    console.error("Reschedule Error:", err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ====================== PROFESSIONAL ACCEPTS RESCHEDULE ======================
router.put('/:id/accept-reschedule', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: appt, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, professional_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
    if (appt.professional_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });
    if (appt.status !== 'reschedule_requested') return res.status(400).json({ error: 'Aucune demande de modification en cours.' });

    const { error: updateError } = await supabase
      .from('Appointment')
      .update({ status: 'confirmed' })
      .eq('id', id);

    if (updateError) throw updateError;

    await createNotification({
      userId: appt.client_id,  // Notify client
      type: 'appointment',
      message: 'Votre demande de modification a été acceptée.',
      appointment_id: id
    });

    res.json({ message: 'Modification acceptée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// ====================== PROFESSIONAL REJECTS RESCHEDULE ======================
router.put('/:id/reject-reschedule', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: appt, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, professional_id, status, date, time') // We can keep old date/time if needed
      .eq('id', id)
      .single();

    if (fetchError || !appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });
    if (appt.professional_id !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });
    if (appt.status !== 'reschedule_requested') return res.status(400).json({ error: 'Aucune demande de modification en cours.' });

    const { error: updateError } = await supabase
      .from('Appointment')
      .update({ status: 'confirmed' })   // Keep old date/time
      .eq('id', id);

    if (updateError) throw updateError;

    await createNotification({
      userId: appt.client_id,
      type: 'appointment',
      message: 'Votre demande de modification a été refusée.',
      appointment_id: id
    });

    res.json({ message: 'Modification refusée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Inside your reschedule route (backend)


module.exports = router;
