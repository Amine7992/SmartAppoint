const supabase = require('../config/supabase');

const DEFAULT_TYPE = 'info';

const createNotification = async ({
  userId,
  message,
  type = DEFAULT_TYPE,
  freed_appointment_id = null,
  freed_slot_time = null,
  freed_slot_date = null,
  target_appointment_id = null,
}) => {
  if (!userId || !message) return null;

  const payload = {
    user_id: userId,
    message,
    is_read: false,
    type,
    freed_appointment_id,
    freed_slot_time,
    freed_slot_date,
    target_appointment_id,
  };

  const { data, error } = await supabase
    .from('Notification')
    .insert([payload])
    .select()
    .maybeSingle();

  if (error) {
    if (String(error.message || '').toLowerCase().includes('type')) {
      const fallbackPayload = {
        user_id: userId,
        message,
        is_read: false,
      };

      const fallbackResult = await supabase
        .from('Notification')
        .insert([fallbackPayload])
        .select()
        .maybeSingle();

      if (fallbackResult.error) throw fallbackResult.error;
      return fallbackResult.data;
    }

    throw error;
  }

  return data;
};

/**
 * Sends a tax summary notification to all professionals for the current month
 */
const notifyAllProsOfTax = async () => {
  const { data: pros, error: proError } = await supabase
    .from(USER_TABLE)
    .select('id, nom, prenom')
    .eq('role', 'professional');

  if (proError) throw proError;

  const now = new Date();
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  
  // We call our stats logic to get current figures
  const fullStats = await getDetailedStats(); 
  const breakdown = fullStats.pro_taxation_breakdown;

  const results = [];

  for (const pro of pros) {
    const proData = breakdown.find(b => b.id === pro.id);
    if (!proData || proData.totalRevenue === 0) continue;

    const message = `Bilan Fiscal (${monthName}) : ` +
      `Revenu Brut: ${proData.totalRevenue.toFixed(2)} DT | ` +
      `Taxe (${proData.rateLabel}): ${proData.taxAmount.toFixed(2)} DT | ` +
      `Net: ${proData.netRevenue.toFixed(2)} DT.`;

    await createNotification({
      userId: pro.id,
      type: 'info', // Uses your DEFAULT_TYPE
      message: message
    });
    
    results.push({ id: pro.id, status: 'sent' });
  }

  return { notifiedCount: results.length };
};

module.exports = {
  createNotification,
  notifyAllProsOfTax,
};
