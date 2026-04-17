const supabase = require('../config/supabase');
const { createNotification } = require('./notificationService');

const cancelExpiredAppointments = async () => {
  try {
    const now = new Date().toISOString();

    // Find appointments that are pending or confirmed and have passed their time
    const { data: expiredAppointments, error: fetchError } = await supabase
      .from('Appointment')
      .select('id, client_id, professional_id, date_heure, status')
      .in('status', ['pending', 'confirmed', 'past'])
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

    console.log(`Found ${expiredAppointments.length} expired appointments to cancel`);

    // Update status to cancelled
    const appointmentIds = expiredAppointments.map(appt => appt.id);
    const { error: updateError } = await supabase
      .from('Appointment')
      .update({ status: 'cancelled' })
      .in('id', appointmentIds);

    if (updateError) {
      console.error('Error updating expired appointments:', updateError);
      return;
    }

    // Send notifications to clients and professionals
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

module.exports = {
  cancelExpiredAppointments,
};