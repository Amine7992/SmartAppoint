import { useEffect, useState } from 'react';
import { Calendar, Clock, X, Edit2, Star, Save, Heart } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import './MyAppointments.css';

const FILTERS = ['Tous', 'A venir', 'Passes', 'Annules'];
const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { label: 'Confirme', cls: 'badge-confirmed' },
    pending: { label: 'En attente', cls: 'badge-pending' },
    completed: { label: 'Termine', cls: 'badge-completed' },
    cancelled: { label: 'Annule', cls: 'badge-cancelled' },
    past: { label: 'Passe', cls: 'badge-past' },
    no_show: { label: 'Absent', cls: 'badge-cancelled' },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-pending' };
  return <span className={`appt-badge ${s.cls}`}>{s.label}</span>;
};

const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={20}
          className={`star-icon ${star <= (readonly ? value : (hovered || value)) ? 'filled' : ''} ${readonly ? 'readonly' : 'interactive'}`}
          fill={star <= (readonly ? value : (hovered || value)) ? '#f0a500' : 'none'}
          color={star <= (readonly ? value : (hovered || value)) ? '#f0a500' : '#d1d5db'}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
};

const EditAppointmentModal = ({ appointment, onClose, onSubmit }) => {
  const days = getNextDays();
  const [selectedDay, setSelectedDay] = useState(appointment?.date || '');
  const [selectedTime, setSelectedTime] = useState(appointment?.time || '');
  const [availableSlots, setAvailableSlots] = useState(SLOTS);
  const [takenSlots, setTakenSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!appointment?.professional_id || !selectedDay) return;

    api.get(`/professionals/${appointment.professional_id}/slots`, { params: { date: selectedDay } })
      .then(({ data }) => {
        const legacyTakenSlots = Array.isArray(data) ? data : [];
        const normalizedTakenSlots = data?.takenSlots || legacyTakenSlots;
        const normalizedAvailableSlots = Array.isArray(data?.availableSlots)
          ? data.availableSlots
          : SLOTS.filter((slot) => !normalizedTakenSlots.includes(slot));

        setAvailableSlots(normalizedAvailableSlots);
        setTakenSlots(normalizedTakenSlots);
      })
      .catch(() => {
        setAvailableSlots([]);
        setTakenSlots([]);
      });
  }, [appointment?.professional_id, selectedDay]);

  const handleSubmit = async () => {
    if (!selectedDay || !selectedTime) {
      setError('Choisissez une date et une heure.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(selectedDay, selectedTime);
    } catch (err) {
      setError(err?.response?.data?.error || 'Modification impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Modifier le rendez-vous</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="modal-pro-name">{appointment.professional_name}</p>
        <p className="modal-pro-service">{appointment.service}</p>
        <div className="edit-days-grid">
          {days.map((day) => {
            const value = day.toISOString().split('T')[0];
            const active = value === selectedDay;
            return (
              <button key={value} className={`edit-day-btn ${active ? 'active' : ''}`} onClick={() => setSelectedDay(value)}>
                {day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </button>
            );
          })}
        </div>
        <div className="edit-slots-grid">
          {availableSlots.map((slot) => (
            <button key={slot} disabled={takenSlots.includes(slot) && slot !== appointment?.time} className={`edit-slot-btn ${selectedTime === slot ? 'active' : ''}`} onClick={() => setSelectedTime(slot)}>
              {slot}
            </button>
          ))}
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-btn-submit" onClick={handleSubmit} disabled={saving}><Save size={14} />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
};

const RatingModal = ({ appointment, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (rating === 0) return setError('Veuillez selectionner une note.');
    setSaving(true);
    setError(null);
    try {
      await api.post(`/appointments/${appointment.id}/rating`, {
        rating,
        comment: comment.trim() || null,
        professional_id: appointment.professional_id,
      });
      onSubmit(appointment.id, rating, comment);
    } catch (err) {
      setError(err?.response?.data?.error || 'Erreur lors de envoi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Noter votre rendez-vous</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-pro-info">
          <div className="modal-pro-avatar">{appointment.professional_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</div>
          <div>
            <p className="modal-pro-name">{appointment.professional_name}</p>
            <p className="modal-pro-service">{appointment.service}</p>
          </div>
        </div>
        <div className="modal-rating-section">
          <p className="modal-label">Votre note</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="modal-comment-section">
          <p className="modal-label">Commentaire</p>
          <textarea className="modal-textarea" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} rows={3} />
          <p className="modal-char-count">{comment.length}/300</p>
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Annuler</button>
          <button className="modal-btn-submit" onClick={handleSubmit} disabled={saving || rating === 0}>{saving ? 'Envoi...' : 'Envoyer la note'}</button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ filter }) => (
  <div className="ma-empty">
    <Calendar size={36} className="ma-empty-icon" />
    <p className="ma-empty-title">Aucun rendez-vous</p>
    <p className="ma-empty-sub">{filter === 'Tous' ? "Vous n'avez pas encore de rendez-vous." : `Aucun rendez-vous ${filter.toLowerCase()} pour l'instant.`}</p>
  </div>
);

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [ratingModal, setRatingModal] = useState(null);
  const [editModal, setEditModal] = useState(null);

  useEffect(() => {
    api.get('/appointments').then((r) => setAppointments(r.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = appointments.filter((a) => {
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'A venir') return ['confirmed', 'pending'].includes(a.status?.toLowerCase());
    if (activeFilter === 'Passes') return ['past', 'no_show', 'completed'].includes(a.status?.toLowerCase());
    if (activeFilter === 'Annules') return a.status?.toLowerCase() === 'cancelled';
    return true;
  });

  const handleCancel = async (id) => {
    if (!window.confirm("Confirmer l'annulation de ce rendez-vous ?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (id, currentStatus) => {
    try {
      // On suppose un endpoint qui bascule l'état favori du professionnel associé au RDV
      await api.patch(`/appointments/${id}/favorite`, { is_favorite: !currentStatus });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, is_favorite: !currentStatus } : a)));
    } catch (err) {
      console.error("Erreur lors de l'ajout aux favoris", err);
    }
  };

  const handleEditSubmit = async (date, time) => {
    const { data } = await api.put(`/appointments/${editModal.id}`, { date, time });
    setAppointments((prev) => prev.map((a) => (a.id === editModal.id ? { ...a, ...(data?.appointment || {}), date, time } : a)));
    setEditModal(null);
  };

  const handleRatingSubmit = (apptId, rating, comment) => {
    setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, rating, comment, rated: true } : a)));
    setRatingModal(null);
  };

  const isCancellable = (a) => ['confirmed', 'pending'].includes(a.status?.toLowerCase());
  const isRatable = (a) => ['past', 'no_show', 'cancelled', 'completed'].includes(a.status?.toLowerCase()) && !a.rated;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar"><h1 className="page-title">Mes rendez-vous</h1></header>

        <div className="ma-filters">
          {FILTERS.map((f) => <button key={f} className={`ma-filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>)}
        </div>

        {loading ? <p className="loading-text">Chargement...</p> : filtered.length === 0 ? <EmptyState filter={activeFilter} /> : (
          <div className="ma-list">
            {filtered.map((appt) => {
              const d = new Date(appt.date);
              const day = d.getDate().toString().padStart(2, '0');
              const month = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
              const year = d.getFullYear();

              return (
                <div key={appt.id} className="ma-card">
                  <div className="ma-date-col"><span className="ma-day">{day}</span><span className="ma-month">{month} {year}</span></div>
                  <div className="ma-divider" />
                  
                  {/* Bouton Favoris ajouté à gauche du nom */}
                  <button 
                    className={`ma-btn-favorite ${appt.is_favorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(appt.id, appt.is_favorite)}
                    title={appt.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart size={18} fill={appt.is_favorite ? "#ef4444" : "none"} />
                  </button>

                  <div className="ma-info">
                    <p className="ma-pro-name">{appt.professional_name}</p>
                    <p className="ma-service">{appt.service}</p>
                    <div className="ma-meta"><Clock size={13} /><span>{appt.time} • {appt.duration} min</span></div>
                    {appt.rated && <div className="ma-existing-rating"><StarRating value={appt.rating} readonly />{appt.comment && <p className="ma-existing-comment">"{appt.comment}"</p>}</div>}
                  </div>
                  <div className="ma-right">
                    <StatusBadge status={appt.status} />
                    {appt.status === 'confirmed' && (
                      <span className={`appt-badge ${appt.payment_status === 'paid' ? 'badge-confirmed' : 'badge-pending'}`}>
                        {appt.payment_status === 'paid' ? 'Payé' : 'Non payé'}
                      </span>
                    )}
                    {appt.status === 'confirmed' && appt.payment_status !== 'paid' && (
                      <button className="ma-btn-pay" onClick={async () => {
                        try {
                          const res = await api.post(`/appointments/${appt.id}/create-checkout-session`);
                          window.location.href = res.data.url;
                        } catch (err) { console.error(err); }
                      }}>
                        Payer
                      </button>
                    )}
                    <div className="ma-actions">
                      {isCancellable(appt) && (
                        <>
                          <button className="ma-btn-edit" title="Modifier" onClick={() => setEditModal(appt)}><Edit2 size={14} /></button>
                          <button className="ma-btn-cancel" title="Annuler" onClick={() => handleCancel(appt.id)}><X size={14} /></button>
                        </>
                      )}
                      {isRatable(appt) && <button className="ma-btn-rate" onClick={() => setRatingModal(appt)} title="Noter ce rendez-vous"><Star size={14} />Noter</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {ratingModal && <RatingModal appointment={ratingModal} onClose={() => setRatingModal(null)} onSubmit={handleRatingSubmit} />}
        {editModal && <EditAppointmentModal appointment={editModal} onClose={() => setEditModal(null)} onSubmit={handleEditSubmit} />}
      </main>
    </div>
  );
};

export default MyAppointments;
