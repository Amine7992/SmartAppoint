const supabase = require('../config/supabase');
const { mapAppointment } = require('../routes/helpers');
const { readAdminConfig, writeAdminConfig } = require('./adminConfigStore');
const { getProfessionalReviewStatus, setProfessionalReviewStatus } = require('./adminProfessionalReviewStore');

const USER_TABLE = 'utilisateur';
const APPOINTMENT_TABLE = 'Appointment';
const SERVICE_TABLE = 'Service';
const NOTIFICATION_TABLE = 'Notification';

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toProfessionalStatus = (user) => {
  const reviewedStatus = getProfessionalReviewStatus(user?.id);
  if (reviewedStatus) return reviewedStatus;

  if (!user?.is_active) return 'suspended';

  const validation = String(user?.validation || '').trim().toLowerCase();
  if (['valide', 'validé', 'validated'].includes(validation)) return 'validated';
  if (['suspendu', 'suspended', 'rejete', 'rejeté', 'refuse', 'refusé'].includes(validation)) return 'suspended';

  return 'pending';
};

const toUserStatus = (user) => (user?.is_active ? 'active' : 'suspended');

const formatProfessional = (user, appointmentsCount = 0) => ({
  id: user.id,
  name: user.nom || '',
  nom: user.nom || '',
  prenom: user.prenom || '',
  specialty: user.specialite || '',
  email: user.email || '',
  avatar_url: user.avatar_url || '',
  status: toProfessionalStatus(user),
  appointments_count: appointmentsCount,
  created_at: user.created_at,
});

const mapUsersById = (rows = []) =>
  new Map(rows.map((row) => [row.id, row]));

const mapServicesById = (rows = []) =>
  new Map(rows.map((row) => [String(row.id), row]));

const fetchUsers = async () => {
  const { data, error } = await supabase
    .from(USER_TABLE)
    .select('*');

  if (error) throw error;
  return data || [];
};

const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from(APPOINTMENT_TABLE)
    .select('*')
    .order('date_heure', { ascending: false });

  if (error) throw error;
  return data || [];
};

const fetchServices = async () => {
  const { data, error } = await supabase
    .from(SERVICE_TABLE)
    .select('*');

  if (error) throw error;
  return data || [];
};

const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from(NOTIFICATION_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};

const countAppointmentsByProfessional = (appointments = []) => {
  const counts = new Map();

  for (const appointment of appointments) {
    const key = appointment.professional_id;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return counts;
};

const getAdminStats = async () => {
  const [users, appointments, config] = await Promise.all([
    fetchUsers(),
    fetchAppointments(),
    Promise.resolve(readAdminConfig()),
  ]);

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 7);

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const clientsCount = users.filter((u) => u.role === 'client').length;
  const pros = users.filter((u) => u.role === 'professional');
  const adminsCount = users.filter((u) => u.role === 'admin').length;
  const activePros = pros.filter((u) => toProfessionalStatus(u) === 'validated').length;
  const pendingPros = pros.filter((u) => toProfessionalStatus(u) === 'pending').length;
  const weeklyNewUsers = users.filter((u) => u.created_at && new Date(u.created_at) >= startOfThisWeek).length;

  const appointmentsThisMonth = appointments.filter((a) => a.date_heure && new Date(a.date_heure) >= startOfThisMonth);
  const appointmentsLastMonth = appointments.filter((a) => {
    if (!a.date_heure) return false;
    const date = new Date(a.date_heure);
    return date >= startOfLastMonth && date < endOfLastMonth;
  });

  const noShowStatuses = new Set(['no_show', 'noshow', 'absent']);
  const noShowCount = appointments.filter((a) => noShowStatuses.has(String(a.status || '').toLowerCase())).length;
  const noshowRate = appointments.length ? Math.round((noShowCount / appointments.length) * 100) : 0;

  let monthlyGrowthPct = 0;
  if (appointmentsLastMonth.length > 0) {
    monthlyGrowthPct = Math.round(((appointmentsThisMonth.length - appointmentsLastMonth.length) / appointmentsLastMonth.length) * 100);
  } else if (appointmentsThisMonth.length > 0) {
    monthlyGrowthPct = 100;
  }

  return {
    total_users: users.length,
    weekly_new_users: weeklyNewUsers,
    active_pros: activePros,
    pending_pros: pendingPros,
    monthly_appts: appointmentsThisMonth.length,
    monthly_growth_pct: monthlyGrowthPct,
    noshow_rate: noshowRate,
    noshow_target: Number(config.noshow_threshold) || 10,
    clients_count: clientsCount,
    pros_count: pros.length,
    admins_count: adminsCount,
  };
};

const groupCountByMonth = (rows = [], dateField) => {
  const counts = new Map();

  for (const row of rows) {
    if (!row[dateField]) continue;
    const date = new Date(row[dateField]);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        month: monthFormatter.format(date),
        count,
      };
    });
};

const getDetailedStats = async () => {
  const [users, appointments] = await Promise.all([
    fetchUsers(),
    fetchAppointments(),
  ]);

  return {
    monthly: groupCountByMonth(appointments, 'date_heure'),
    registrations: groupCountByMonth(users, 'created_at'),
  };
};

const getProfessionals = async (statusFilter = null) => {
  const [users, appointments] = await Promise.all([
    fetchUsers(),
    fetchAppointments(),
  ]);

  const appointmentCounts = countAppointmentsByProfessional(appointments);

  return users
    .filter((user) => user.role === 'professional')
    .map((user) => formatProfessional(user, appointmentCounts.get(user.id) || 0))
    .filter((pro) => !statusFilter || pro.status === statusFilter)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
};

const updateProfessionalStatus = async (id, action) => {
  let updates;
  let nextStatus;

  if (action === 'validate') {
    updates = { is_active: true };
    nextStatus = 'validated';
  } else if (action === 'reject') {
    updates = { is_active: false };
    nextStatus = 'suspended';
  } else if (action === 'reactivate') {
    updates = { is_active: true };
    nextStatus = 'validated';
  } else {
    throw new Error('Action administrateur inconnue');
  }

  const { data, error } = await supabase
    .from(USER_TABLE)
    .update(updates)
    .eq('id', id)
    .eq('role', 'professional')
    .select('*')
    .single();

  if (error) throw error;
  setProfessionalReviewStatus(id, nextStatus);
  return { ...formatProfessional(data, 0), status: nextStatus };
};

const getAdminUsers = async () => {
  const users = await fetchUsers();

  return users
    .map((user) => ({
      id: user.id,
      name: user.nom || '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      avatar_url: user.avatar_url || '',
      role: user.role || 'client',
      status: toUserStatus(user),
      created_at: user.created_at,
    }))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
};

const suspendUser = async (id) => {
  const { data, error } = await supabase
    .from(USER_TABLE)
    .update({ is_active: false })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    status: toUserStatus(data),
  };
};

const deleteUser = async (id) => {
  const { error } = await supabase
    .from(USER_TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;

  return { success: true };
};

const getAdminAppointments = async () => {
  const [appointments, users, services] = await Promise.all([
    fetchAppointments(),
    fetchUsers(),
    fetchServices(),
  ]);

  const usersById = mapUsersById(users);
  const servicesById = mapServicesById(services);

  return appointments.map((appointment) => {
    const normalized = mapAppointment(
      appointment,
      servicesById.get(String(appointment.service_id)),
      usersById.get(appointment.professional_id),
      usersById.get(appointment.client_id)
    );

    return {
      id: normalized.id,
      client_name: normalized.client_name || 'Client inconnu',
      professional_name: normalized.professional_name || 'Professionnel inconnu',
      service: normalized.service || 'Service inconnu',
      date: normalized.date || null,
      time: normalized.time || '',
      status: normalized.status || 'pending',
      created_at: normalized.created_at,
    };
  });
};

const getAdminActivity = async () => {
  const [users, appointments, notifications] = await Promise.all([
    fetchUsers(),
    fetchAppointments(),
    fetchNotifications(),
  ]);

  const recentUsers = users
    .filter((user) => user.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map((user) => ({
      type: 'user',
      created_at: user.created_at,
      tag: user.role === 'professional' ? 'Nouveau pro' : 'Nouvel utilisateur',
      tag_type: 'info',
      message: `<b>${escapeHtml(user.nom || 'Utilisateur')}</b> a rejoint la plateforme.`,
    }));

  const recentAppointments = appointments
    .slice(0, 5)
    .map((appointment) => ({
      type: 'appointment',
      created_at: appointment.created_at || appointment.date_heure,
      tag: String(appointment.status || '').toLowerCase() === 'cancelled' ? 'Annulé' : 'RDV',
      tag_type: String(appointment.status || '').toLowerCase() === 'cancelled' ? 'alert' : 'normal',
      message: `Rendez-vous <b>${escapeHtml(String(appointment.status || 'pending'))}</b> prévu le <b>${escapeHtml(String(appointment.date_heure || ''))}</b>.`,
    }));

  const recentNotifications = notifications.slice(0, 5).map((notification) => ({
    type: 'alert',
    created_at: notification.created_at,
    tag: notification.is_read ? 'Info' : 'Alerte',
    tag_type: notification.is_read ? 'info' : 'alert',
    message: escapeHtml(notification.message || 'Notification'),
  }));

  return [...recentNotifications, ...recentAppointments, ...recentUsers]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 12);
};

const sanitizeAdminConfig = (payload = {}) => ({
  platform_name: String(payload.platform_name || '').trim() || 'SmartAppoint',
  contact_email: String(payload.contact_email || '').trim(),
  noshow_threshold: Number(payload.noshow_threshold) >= 0 ? Number(payload.noshow_threshold) : 10,
  ai_enabled: Boolean(payload.ai_enabled),
  registration_open: Boolean(payload.registration_open),
});

const getAdminConfig = async () => readAdminConfig();

const saveAdminConfig = async (payload) => writeAdminConfig(sanitizeAdminConfig(payload));

const buildAdminReportData = async () => {
  const [stats, users, professionals, appointments] = await Promise.all([
    getAdminStats(),
    getAdminUsers(),
    getProfessionals(),
    getAdminAppointments(),
  ]);

  return {
    stats,
    usersCount: users.length,
    professionalsCount: professionals.length,
    appointmentsCount: appointments.length,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  getAdminStats,
  getDetailedStats,
  getProfessionals,
  updateProfessionalStatus,
  getAdminUsers,
  suspendUser,
  deleteUser,
  getAdminAppointments,
  getAdminActivity,
  getAdminConfig,
  saveAdminConfig,
  buildAdminReportData,
};
