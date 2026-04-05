import { useEffect, useState } from 'react';
import { Calendar, Clock, X, Edit2, Star } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import './MyAppointments.css';

const FILTERS = ['Tous', 'À venir', 'Passés', 'Annulés'];

/* ── Badge statut ── */
const StatusBadge = ({ status }) => {
  const map = {
    confirmed:    { label: 'Confirmé',   cls: 'badge-confirmed' },
    pending:      { label: 'En attente', cls: 'badge-pending'   },
    cancelled:    { label: 'Annulé',     cls: 'badge-cancelled' },
    past:         { label: 'Passé',      cls: 'badge-past'      },
    no_show:      { label: 'Absent',     cls: 'badge-cancelled' },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-pending' };
  return <span className={`appt-badge ${s.cls}`}>{s.label}</span>;
};

/* ── Étoiles interactives ── */
const StarRating = ({ value, onChange, readonly = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={20}
          className={`star-icon ${
            star <= (readonly ? value : (hovered || value)) ? 'filled' : ''
          } ${readonly ? 'readonly' : 'interactive'}`}
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

/* ── Modal de notation ── */
const RatingModal = ({ appointment, onClose, onSubmit }) => {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note.');
      return;
    }
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
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Noter votre rendez-vous</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-pro-info">
          <div className="modal-pro-avatar">
            {appointment.professional_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="modal-pro-name">{appointment.professional_name}</p>
            <p className="modal-pro-service">{appointment.service}</p>
          </div>
        </div>

        <div className="modal-rating-section">
          <p className="modal-label">Votre note</p>
          <StarRating value={rating} onChange={setRating} />
          <p className="modal-rating-hint">
            {rating === 0 ? 'Cliquez pour noter' :
             rating === 1 ? 'Très insatisfait' :
             rating === 2 ? 'Insatisfait' :
             rating === 3 ? 'Correct' :
             rating === 4 ? 'Satisfait' : 'Très satisfait !'}
          </p>
        </div>

        <div className="modal-comment-section">
          <p className="modal-label">Commentaire <span className="modal-optional">(optionnel)</span></p>
          <textarea
            className="modal-textarea"
            placeholder="Partagez votre expérience…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={300}
            rows={3}
          />
          <p className="modal-char-count">{comment.length}/300</p>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Annuler</button>
          <button
            className="modal-btn-submit"
            onClick={handleSubmit}
            disabled={saving || rating === 0}
          >
            {saving ? 'Envoi…' : 'Envoyer la note'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── État vide ── */
const EmptyState = ({ filter }) => (
  <div className="ma-empty">
    <Calendar size={36} className="ma-empty-icon" />
    <p className="ma-empty-title">Aucun rendez-vous</p>
    <p className="ma-empty-sub">
      {filter === 'Tous'
        ? "Vous n'avez pas encore de rendez-vous."
        : `Aucun rendez-vous "${filter.toLowerCase()}" pour l'instant.`}
    </p>
  </div>
);

/* ══════════════════════════════════════════════════════════ */
const MyAppointments = () => {
  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState('Tous');
  const [ratingModal,   setRatingModal]   = useState(null); // appointment sélectionné

  useEffect(() => {
    api.get('/appointments')
      .then(r => setAppointments(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Filtrage */
  const filtered = appointments.filter(a => {
    if (activeFilter === 'Tous')    return true;
    if (activeFilter === 'À venir') return ['confirmed', 'pending'].includes(a.status?.toLowerCase());
    if (activeFilter === 'Passés')  return ['past', 'no_show'].includes(a.status?.toLowerCase());
    if (activeFilter === 'Annulés') return a.status?.toLowerCase() === 'cancelled';
    return true;
  });

  /* Annuler un RDV */
  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de ce rendez-vous ?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)
      );
    } catch (err) { console.error(err); }
  };

  /* Après soumission du rating */
  const handleRatingSubmit = (apptId, rating, comment) => {
    setAppointments(prev =>
      prev.map(a => a.id === apptId
        ? { ...a, rating, comment, rated: true }
        : a
      )
    );
    setRatingModal(null);
  };

  const isPast        = (a) => ['past', 'no_show'].includes(a.status?.toLowerCase());
  const isCancellable = (a) => ['confirmed', 'pending'].includes(a.status?.toLowerCase());

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">

        <header className="topbar">
          <h1 className="page-title">Mes rendez-vous</h1>
        </header>

        {/* Filtres */}
        <div className="ma-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`ma-filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              {f !== 'Tous' && (
                <span className="ma-filter-count">
                  {f === 'À venir'  ? appointments.filter(a => ['confirmed','pending'].includes(a.status?.toLowerCase())).length
                 : f === 'Passés'   ? appointments.filter(a => ['past','no_show'].includes(a.status?.toLowerCase())).length
                 : f === 'Annulés'  ? appointments.filter(a => a.status?.toLowerCase() === 'cancelled').length
                 : 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <p className="loading-text">Chargement…</p>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="ma-list">
            {filtered.map(appt => {
              const d     = new Date(appt.date);
              const day   = d.getDate().toString().padStart(2, '0');
              const month = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
              const year  = d.getFullYear();

              return (
                <div key={appt.id} className="ma-card">

                  {/* Date */}
                  <div className="ma-date-col">
                    <span className="ma-day">{day}</span>
                    <span className="ma-month">{month} {year}</span>
                  </div>

                  <div className="ma-divider" />

                  {/* Infos */}
                  <div className="ma-info">
                    <p className="ma-pro-name">{appt.professional_name}</p>
                    <p className="ma-service">{appt.service}</p>
                    <div className="ma-meta">
                      <Clock size={13} />
                      <span>{appt.time} · {appt.duration} min</span>
                    </div>

                    {/* Note déjà donnée */}
                    {appt.rated && (
                      <div className="ma-existing-rating">
                        <StarRating value={appt.rating} readonly />
                        {appt.comment && (
                          <p className="ma-existing-comment">"{appt.comment}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Droite : badge + actions */}
                  <div className="ma-right">
                    <StatusBadge status={appt.status} />

                    <div className="ma-actions">
                      {/* Modifier (si à venir) */}
                      {isCancellable(appt) && (
                        <>
                          <button className="ma-btn-edit" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="ma-btn-cancel"
                            title="Annuler"
                            onClick={() => handleCancel(appt.id)}
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}

                      {/* Bouton noter (si passé et pas encore noté) */}
                      {isPast(appt) && !appt.rated && (
                        <button
                          className="ma-btn-rate"
                          onClick={() => setRatingModal(appt)}
                          title="Noter ce rendez-vous"
                        >
                          <Star size={14} />
                          Noter
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal de notation */}
        {ratingModal && (
          <RatingModal
            appointment={ratingModal}
            onClose={() => setRatingModal(null)}
            onSubmit={handleRatingSubmit}
          />
        )}

      </main>
    </div>
  );
};

export default MyAppointments;
