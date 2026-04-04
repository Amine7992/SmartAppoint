import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Calendar, User } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import './Dashboard.css';

const StatusBadge = ({ status }) => {
  const map = {
    confirmed:    { label: 'Confirmé',   cls: 'badge-confirmed' },
    pending:      { label: 'En attente', cls: 'badge-pending'   },
    cancelled:    { label: 'Annulé',     cls: 'badge-cancelled' },
    confirme:     { label: 'Confirmé',   cls: 'badge-confirmed' },
    'en attente': { label: 'En attente', cls: 'badge-pending'   },
    annule:       { label: 'Annulé',     cls: 'badge-cancelled' },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-pending' };
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', ''),
  };
};

const EmptyState = ({ icon: Icon, message }) => (
  <div className="empty-state">
    <Icon size={32} className="empty-icon" />
    <p>{message}</p>
  </div>
);

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ upcoming: 0, past: 0, cancelled: 0, favourites: 0 });
  const [appointments, setAppointments] = useState([]);
  const [pros, setPros]                 = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, prosRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/professionals'),
        ]);

        const appts = apptRes.data || [];
        setAppointments(appts.slice(0, 3));
        setStats({
          upcoming:   appts.filter(a => ['confirmed', 'pending', 'confirme', 'en attente'].includes(a.status?.toLowerCase())).length,
          past:       appts.filter(a => a.status?.toLowerCase() === 'past').length,
          cancelled:  appts.filter(a => ['cancelled', 'annule'].includes(a.status?.toLowerCase())).length,
          favourites: 0,
        });
        setPros((prosRes.data || []).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">

        {/* Topbar */}
        <header className="topbar">
          <h1 className="page-title">Tableau de bord</h1>
          <div className="topbar-right">
            <span className="topbar-date">{todayCapitalized}</span>
            <button className="notif-btn">
              <Bell size={17} />
            </button>
            <button className="btn-new-rdv" onClick={() => navigate('/client/book')}>
              <Plus size={15} />
              Nouveau RDV
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">RDV à venir</p>
            <p className="stat-value">{stats.upcoming}</p>
            <p className="stat-sub blue">Ce mois-ci</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">RDV passés</p>
            <p className="stat-value">{stats.past}</p>
            <p className="stat-sub muted">Total</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Annulés</p>
            <p className="stat-value">{stats.cancelled}</p>
            <p className="stat-sub orange">Ce mois</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pros favoris</p>
            <p className="stat-value">{stats.favourites}</p>
            <p className="stat-sub muted">Enregistrés</p>
          </div>
        </section>

        {/* Two columns */}
        <section className="two-col">

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Prochains rendez-vous</h2>
              <button className="link-btn" onClick={() => navigate('/client/appointments')}>
                Voir tout
              </button>
            </div>
            {loading ? (
              <p className="loading-text">Chargement…</p>
            ) : appointments.length === 0 ? (
              <EmptyState icon={Calendar} message="Aucun rendez-vous à venir. Réservez votre premier RDV !" />
            ) : (
              <ul className="appt-list">
                {appointments.map((appt) => {
                  const { day, month } = formatDate(appt.date);
                  return (
                    <li key={appt.id} className="appt-item">
                      <div className="appt-date-box">
                        <span className="appt-day">{day}</span>
                        <span className="appt-month">{month}</span>
                      </div>
                      <div className="appt-info">
                        <p className="appt-name">{appt.professional_name}</p>
                        <p className="appt-detail">
                          {appt.time} — {appt.service} · {appt.duration} min
                        </p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Professionnels recommandés</h2>
              <button className="link-btn" onClick={() => navigate('/client/book')}>
                Explorer
              </button>
            </div>
            {loading ? (
              <p className="loading-text">Chargement…</p>
            ) : pros.length === 0 ? (
              <EmptyState icon={User} message="Aucun professionnel disponible pour l'instant." />
            ) : (
              <ul className="pros-list">
                {pros.map((pro) => (
                  <li key={pro.id} className="pro-item">
                    <div className="pro-avatar" style={{ background: '#1a5276' }}>
                      {pro.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="pro-info">
                      <p className="pro-name">{pro.name}</p>
                      <p className="pro-meta">{pro.specialty} · {pro.city}</p>
                    </div>
                    <button
                      className="btn-reserver"
                      onClick={() => navigate(`/client/book?pro=${pro.id}`)}
                    >
                      Réserver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </section>
      </main>
    </div>
  );
};

export default ClientDashboard;
