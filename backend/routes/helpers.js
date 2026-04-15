const { getProfessionalReviewStatus } = require('../services/adminProfessionalReviewStore');

const toLocalDateTime = (timestamp) => {
  if (!timestamp) return { date: '', time: '' };
  const date = new Date(timestamp);
  const year    = date.getFullYear();
  const month   = String(date.getMonth() + 1).padStart(2, '0');
  const day     = String(date.getDate()).padStart(2, '0');
  const hours   = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

const mapProfessional = (pro) => {
  const reviewedStatus = getProfessionalReviewStatus(pro?.id);
  const validation = String(pro?.validation || '').trim().toLowerCase();
  const status = reviewedStatus || (
    ['valide', 'validé', 'validated'].includes(validation)
      ? 'validated'
      : (['suspendu', 'suspended', 'rejete', 'rejeté', 'refuse', 'refusé'].includes(validation)
        ? 'suspended'
        : 'pending')
  );

  return {
    id:          pro.id,
    name:        pro.nom        || '',
    nom:         pro.nom        || '',
    prenom:      pro.prenom     || '',
    specialty:   pro.specialite || '',
    city:        pro.city       || '',
    rating:      pro.rating     || 0,
    avatar_url:  pro.avatar_url || '',
    description: pro.description || '',
    verified:    status === 'validated',
    status,
  };
};

const mapService = (svc) => ({
  id:              svc.id,
  name:            svc.nom         || '',
  description:     svc.description || '',
  price:           svc.prix        || 0,
  duration:        svc.duree_minutes ?? svc.duration ?? 30,
  professional_id: svc.professional_id,
});

const mapAppointment = (appt, service, pro, client) => {
  const { date, time } = toLocalDateTime(appt.date_heure);
  return {
    id:               appt.id,
    client_id:        appt.client_id,
    professional_id:  appt.professional_id,
    service_id:       appt.service_id,
    status:           appt.status || 'pending',
    payment_status:   appt.payment_status || 'unpaid',
    date,
    time,
    duration:         service?.duree_minutes ?? service?.duration ?? 30,
    service:          service?.nom            || '',
    professional_name: pro?.nom               || '',
    professional_avatar_url: pro?.avatar_url  || '',
    client_name:      client?.nom             || '',
    client_avatar_url: client?.avatar_url     || '',
    created_at:       appt.created_at,
    rating:           appt.rating  ?? null,
    comment:          appt.comment ?? null,
    rated:            appt.rating  != null,
  };
};

const mapNotification = (notif) => ({
  id:         notif.id,
  message:    notif.message,
  type:       notif.type || 'appointment',
  created_at: notif.created_at,
  read:       notif.is_read || false,
});

module.exports = {
  mapProfessional,
  mapService,
  mapAppointment,
  mapNotification,
};
