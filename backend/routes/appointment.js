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
  if (!professional_id)
    return res.status(400).json({ error: 'professional_id manquant.' });

  try {
    // ── Étape 1 : Récupérer le RDV ──
    const { data: appt, error: apptError } = await supabase
      .from('Appointment')
      .select('id, client_id, status, rating')
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
    const allowedStatuses = ['past', 'no_show', 'cancelled'];
    if (!allowedStatuses.includes(appt.status?.toLowerCase())) {
      return res.status(400).json({ 
        error: `Ce rendez-vous (statut: ${appt.status}) ne peut pas encore être noté.` 
      });
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
      .eq('professional_id', professional_id)
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
      .eq('id', professional_id);
    
    if (updateProError) {
        console.error("Erreur mise à jour Utilisateur (Pro):", updateProError);
        // Note: On ne throw pas forcément ici pour ne pas annuler l'étape 2 si seule la moyenne échoue
    }

    await Promise.all([
      createNotification({
        userId: req.user.id,
        type: 'info',
        message: 'Votre avis a bien ete enregistre. Merci pour votre retour.',
      }),
      createNotification({
        userId: professional_id,
        type: 'info',
        message: `Vous avez recu une nouvelle note de ${rating}/5.`,
      }),
    ]);

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

module.exports = router;
