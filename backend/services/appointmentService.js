const supabase = require('../config/supabase');
const { createNotification } = require('./notificationService');

// ─────────────────────────────────────────────────────────────
//  Annuler les RDVs expirés (fonction existante — inchangée)
// ─────────────────────────────────────────────────────────────
const cancelExpiredAppointments = async () => {
  try {
    const now = new Date().toISOString();

    // On n'annule QUE les 'confirmed' et 'past' — jamais les 'pending'
    // car les 'pending' doivent attendre la validation du professionnel
    const { data: expiredAppointments, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, client_id, professional_id, date_heure, status')
      .in('status', ['confirmed', 'past'])
      .lt('date_heure', now);

    if (fetchError) {
      console.error('Error fetching expired appointments:', fetchError);
      return;
    }

    if (!expiredAppointments || expiredAppointments.length === 0) {
      console.log('No expired appointments to cancel');
      return;
    }

    console.log(`Found ${expiredAppointments.length} expired appointments to cancel`);

    const appointmentIds = expiredAppointments.map(appt => appt.id);
    const { error: updateError } = await supabase
      .from('Appointment')
      .update({ status: 'cancelled' })
      .in('id', appointmentIds);

    if (updateError) {
      console.error('Error updating expired appointments:', updateError);
      return;
    }

    const notifications = [];
    for (const appt of expiredAppointments) {
      const appointmentDate = new Date(appt.date_heure).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      notifications.push(
        createNotification({
          userId: appt.client_id,
          type: 'appointment',
          message: `Votre rendez-vous du ${appointmentDate} a été annulé automatiquement car l'heure est dépassée.`,
        }),
        createNotification({
          userId: appt.professional_id,
          type: 'appointment',
          message: `Le rendez-vous du ${appointmentDate} a été annulé automatiquement car l'heure est dépassée.`,
        })
      );
    }

    await Promise.all(notifications);
    console.log(`Successfully cancelled ${expiredAppointments.length} expired appointments`);
  } catch (error) {
    console.error('Error in cancelExpiredAppointments:', error);
  }
};

// ─────────────────────────────────────────────────────────────
//  NOUVELLE FONCTION : Envoyer un rappel 2h avant le RDV
//
//  Fonctionnement :
//  1. On calcule la fenêtre : [maintenant + 1h55, maintenant + 2h05]
//     → cela représente les RDVs qui auront lieu dans ~2 heures
//     → la fenêtre de 10 minutes compense le fait que le cron
//       tourne toutes les 15 minutes (on évite les doublons
//       grâce à la colonne reminder_sent)
//  2. On filtre uniquement les RDVs 'confirmed' sans rappel déjà envoyé
//  3. On envoie une notification à chaque client concerné
//  4. On marque le RDV avec reminder_sent = true pour ne pas
//     renvoyer le rappel au prochain passage du cron
// ─────────────────────────────────────────────────────────────
const sendAppointmentReminders = async () => {
  try {
    const now = new Date();

    // Fenêtre : RDVs entre 1h55 et 2h05 à partir de maintenant
    const windowStart = new Date(now.getTime() + (1 * 60 + 55) * 60 * 1000); // +1h55
    const windowEnd   = new Date(now.getTime() + (2 * 60 + 5)  * 60 * 1000); // +2h05

    console.log(`REMINDER CHECK: cherche les RDVs entre ${windowStart.toISOString()} et ${windowEnd.toISOString()}`);

    // Chercher les RDVs confirmés dans cette fenêtre, pas encore rappelés
    const { data: upcomingAppointments, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, client_id, professional_id, date_heure')
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)           // pas encore rappelé
      .gte('date_heure', windowStart.toISOString())
      .lte('date_heure', windowEnd.toISOString());

    if (fetchError) {
      // Si la colonne reminder_sent n'existe pas encore en DB,
      // on log un avertissement sans planter le serveur
      if (fetchError.message?.includes('reminder_sent')) {
        console.warn('REMINDER: La colonne reminder_sent n\'existe pas encore. Ajoutez-la dans Supabase.');
      } else {
        console.error('REMINDER: Erreur fetch:', fetchError.message);
      }
      return;
    }

    if (!upcomingAppointments || upcomingAppointments.length === 0) {
      console.log('REMINDER: Aucun RDV à rappeler dans les 2 prochaines heures.');
      return;
    }

    console.log(`REMINDER: ${upcomingAppointments.length} rappel(s) à envoyer.`);

    const notifications = [];
    const reminderIds   = [];

    for (const appt of upcomingAppointments) {
      // Formater l'heure du RDV en heure locale (Tunisie UTC+1)
      const apptDate = new Date(appt.date_heure);
      const heureLabel = apptDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Tunis',
      });
      const dateLabel = apptDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        timeZone: 'Africa/Tunis',
      });

      // Notification au client
      notifications.push(
        createNotification({
          userId:  appt.client_id,
          type:    'appointment',
          message: `⏰ Rappel : vous avez un rendez-vous aujourd'hui (${dateLabel}) à ${heureLabel}. Pensez à vous préparer !`,
        })
      );

      reminderIds.push(appt.id);
    }

    // Envoyer toutes les notifications en parallèle
    await Promise.allSettled(notifications);

    // Marquer les RDVs comme "rappel envoyé" pour éviter les doublons
    if (reminderIds.length > 0) {
      const { error: updateError } = await supabase
        .from('Appointment')
        .update({ reminder_sent: true })
        .in('id', reminderIds);

      if (updateError) {
        console.error('REMINDER: Erreur lors de la mise à jour reminder_sent:', updateError.message);
      } else {
        console.log(`REMINDER: ${reminderIds.length} rappel(s) envoyé(s) avec succès.`);
      }
    }

  } catch (error) {
    console.error('REMINDER: Erreur inattendue:', error.message);
  }
};

module.exports = {
  cancelExpiredAppointments,
  sendAppointmentReminders,   // ← exportée pour server.js
};