const supabase = require('../config/supabase');

const DEFAULT_TYPE = 'info';

const createNotification = async ({ userId, message, type = DEFAULT_TYPE }) => {
  if (!userId || !message) return null;

  const payload = {
    user_id: userId,
    message,
    is_read: false,
    type,
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

module.exports = {
  createNotification,
};
