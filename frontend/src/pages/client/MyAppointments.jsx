import { useEffect, useState } from 'react';
import { Calendar, Clock, X, Edit2 } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import './MyAppointments.css';

const FILTERS = ['Tous', 'À venir', 'Passés', 'Annulés'];

const StatusBadge = ({ status }) => {
  const map = {
    confirmed:    { label: 'Confirmé',   cls: 'badge-confirmed' },
    pending:      { label: 'En attente', cls: 'badge-pending'   },
    cancelled:    { label: 'Annulé',     cls: 'badge-cancelled' },
    past:         { label: 'Passé',      cls: 'badge-past'      },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-pending' };
  return <span className={`appt-badge ${s.cls}`}>{s.label}</span>;
};

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

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeFilter, setActiveFilter] = useState('Tous');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/appointments');
        setAppointments(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = appointments.filter((a) => {
    if (activeFilter === 'Tous')    return true;
    if (activeFilter === 'À venir') return ['confirmed', 'pending'].includes(a.status?.toLowerCase());
    if (activeFilter === 'Passés')  return a.status?.toLowerCase() === 'past';
    if (activeFilter === 'Annulés') return a.status?.toLowerCase() === 'cancelled';
    return true;
  });

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de ce rendez-vous ?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar">
          <h1 className="page-title">Mes rendez-vous</h1>
        </header>

        <div className="ma-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`ma-filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading-text">Chargement…</p>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="ma-list">
            {filtered.map((appt) => {
              const d = new Date(appt.date);
              const day   = d.getDate().toString().padStart(2, '0');
              const month = d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '');
              const year  = d.getFullYear();
              const isCancellable = ['confirmed', 'pending'].includes(appt.status?.toLowerCase());

              return (
                <div key={appt.id} className="ma-card">
                  <div className="ma-date-col">
                    <span className="ma-day">{day}</span>
                    <span className="ma-month">{month} {year}</span>
                  </div>
                  <div className="ma-divider" />
                  <div className="ma-info">
                    <p className="ma-pro-name">{appt.professional_name}</p>
                    <p className="ma-service">{appt.service}</p>
                    <div className="ma-meta">
                      <Clock size={13} />
                      <span>{appt.time} · {appt.duration} min</span>
                    </div>
                  </div>
                  <div className="ma-right">
                    <StatusBadge status={appt.status} />
                    {isCancellable && (
                      <div className="ma-actions">
                        <button className="ma-btn-edit" title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button className="ma-btn-cancel" title="Annuler" onClick={() => handleCancel(appt.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyAppointments;
