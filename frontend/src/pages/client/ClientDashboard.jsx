import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Calendar, User, AlertCircle, Info, CheckCheck, Heart } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import UserAvatar from '../../components/common/UserAvatar';
import VerificationBadge from '../../components/common/VerificationBadge';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import { formatNotificationMessage } from '../../utils/notificationFormat';
import './Dashboard.css';

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { label: 'Confirme', cls: 'badge-confirmed' },
    pending: { label: 'En attente', cls: 'badge-pending' },
    cancelled: { label: 'Annule', cls: 'badge-cancelled' },
    confirme: { label: 'Confirme', cls: 'badge-confirmed' },
    'en attente': { label: 'En attente', cls: 'badge-pending' },
    annule: { label: 'Annule', cls: 'badge-cancelled' },
  };
  const normalizedStatus = status?.toLowerCase();
  const badge = map[normalizedStatus] || { label: status, cls: 'badge-pending' };
  return <span className={`status-badge ${badge.cls}`}>{badge.label}</span>;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', ''),
  };
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
};

const notificationIcons = {
  appointment: <Calendar size={15} />,
  alert: <AlertCircle size={15} />,
  info: <Info size={15} />,
};

const notificationClasses = {
  appointment: 'appointment',
  alert: 'alert',
  info: 'info',
};

const EmptyState = ({ icon: Icon, message }) => (
  <div className="empty-state">
    <Icon size={32} className="empty-icon" />
    <p>{message}</p>
  </div>
);

const ClientDashboard = () => {
  useAuth();
  const navigate = useNavigate();
  const notifMenuRef = useRef(null);

  const [stats, setStats] = useState({ upcoming: 0, past: 0, cancelled: 0, favourites: 0 });
  const [appointments, setAppointments] = useState([]);
  const [pros, setPros] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotifLoading(true);
      try {
        const [apptRes, prosRes, notifRes, favRes] = await Promise.all([
          api.get('/appointments'),
          api.get('/professionals'),
          api.get('/notifications'),
          api.get('/favorites'),
        ]);

        const appts = apptRes.data || [];
        const favList = favRes.data || [];
        setAppointments(appts.slice(0, 3));
        setStats({
          upcoming: appts.filter((appt) => ['confirmed', 'pending', 'confirme', 'en attente'].includes(appt.status?.toLowerCase())).length,
          // Option 1 – most likely (recommended)
          past: appts.filter((appt) => 
            ['past', 'completed', 'terminé', 'done', 'finished'].includes(appt.status?.toLowerCase())
          ).length,
          cancelled: appts.filter((appt) => ['cancelled', 'annule'].includes(appt.status?.toLowerCase())).length,
          favourites: favList.length,
        });
        setPros((prosRes.data || []).slice(0, 3));
        setFavorites(favList.slice(0, 3));
        setNotifications(notifRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setNotifLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveFavorite = async (proId) => {
    try {
      await api.delete(`/favorites/${proId}`);
      setFavorites(prev => prev.filter(p => p.id !== proId));
      setStats(prev => ({ ...prev, favourites: Math.max(0, prev.favourites - 1) }));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifications = notifications.filter((notif) => !notif.read).length;
  const hasNotifications = notifications.length > 0;
  const visibleNotifications = notifications.slice(0, 5);

  const markNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((notif) => (
        notif.id === id ? { ...notif, read: true } : notif
      )));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="topbar">
          <h1 className="page-title">Tableau de bord</h1>
          <div className="topbar-right">
            <span className="topbar-date">{todayCapitalized}</span>
            <div className="client-notif-menu" ref={notifMenuRef}>
              <button
                type="button"
                className={`client-notif-trigger ${hasNotifications ? 'has-alert' : ''} ${notifOpen ? 'open' : ''}`}
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadNotifications > 0 ? (
                  <span className="client-notif-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="client-notif-dropdown">
                  <div className="client-notif-dropdown-head">
                    <div>
                      <p className="client-notif-dropdown-title">Notifications</p>
                      <p className="client-notif-dropdown-sub">
                        {unreadNotifications > 0 ? `${unreadNotifications} non lue${unreadNotifications > 1 ? 's' : ''}` : 'Tout est lu'}
                      </p>
                    </div>
                    {unreadNotifications > 0 ? (
                      <button type="button" className="client-notif-mark-all" onClick={markAllNotificationsRead}>
                        <CheckCheck size={14} />
                      </button>
                    ) : null}
                  </div>

                  {notifLoading ? (
                    <p className="client-notif-empty">Chargement...</p>
                  ) : visibleNotifications.length === 0 ? (
                    <p className="client-notif-empty">Aucune notification pour le moment.</p>
                  ) : (
                    <div className="client-notif-dropdown-list">
                      {visibleNotifications.map((notif) => (
                        <button
                          type="button"
                          key={notif.id}
                          className={`client-notif-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => {
                            if (!notif.read) markNotificationRead(notif.id);
                          }}
                        >
                          <span className={`client-notif-item-icon ${notificationClasses[notif.type] || 'info'}`}>
                            {notificationIcons[notif.type] || <Info size={15} />}
                          </span>
                          <span className="client-notif-item-body">
                            <span className="client-notif-item-message">{formatNotificationMessage(notif.message)}</span>
                            <span className="client-notif-item-time">{timeAgo(notif.created_at)}</span>
                          </span>
                          {!notif.read ? <span className="client-notif-item-dot" /> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <button className="btn-new-rdv" onClick={() => navigate('/client/book')}>
              <Plus size={15} />
              Nouveau RDV
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">RDV a venir</p>
            <p className="stat-value">{stats.upcoming}</p>
            <p className="stat-sub blue">Ce mois-ci</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">RDV passes</p>
            <p className="stat-value">{stats.past}</p>
            <p className="stat-sub muted">Total</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Annules</p>
            <p className="stat-value">{stats.cancelled}</p>
            <p className="stat-sub orange">Ce mois</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Pros favoris</p>
            <p className="stat-value">{stats.favourites}</p>
            <p className="stat-sub muted">Enregistres</p>
          </div>
        </section>

        <section className="two-col">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Prochains rendez-vous</h2>
              <button className="link-btn" onClick={() => navigate('/client/appointments')}>
                Voir tout
              </button>
            </div>
            {loading ? (
              <p className="loading-text">Chargement...</p>
            ) : appointments.length === 0 ? (
              <EmptyState icon={Calendar} message="Aucun rendez-vous a venir. Reservez votre premier RDV !" />
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
                          {appt.time} - {appt.service} · {appt.duration} min
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
              <h2 className="panel-title">Professionnels recommandes</h2>
              <button className="link-btn" onClick={() => navigate('/client/book')}>
                Explorer
              </button>
            </div>
            {loading ? (
              <p className="loading-text">Chargement...</p>
            ) : pros.length === 0 ? (
              <EmptyState icon={User} message="Aucun professionnel disponible pour l'instant." />
            ) : (
              <ul className="pros-list">
                {pros.map((pro) => (
                  <li key={pro.id} className="pro-item">
                    <UserAvatar user={pro} fallback="PR" className="pro-avatar" style={{ background: '#1a5276' }} />
                    <div className="pro-info">
                      <div className="pro-name-row">
                        <p className="pro-name">{[pro.prenom, pro.nom].filter(Boolean).join(' ').trim() || pro.name}</p>
                        <VerificationBadge verified={Boolean(pro.verified || ['validated', 'valide'].includes(String(pro.status || pro.validation || '').toLowerCase()))} compact className="dashboard-verified-badge" />
                      </div>
                      <p className="pro-meta">{pro.specialty} · {pro.city}</p>
                    </div>
                    <button
                      className="btn-reserver"
                      onClick={() => navigate(`/client/book?pro=${pro.id}`)}
                    >
                      Reserver
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Favorites widget */}
        <section className="two-col" style={{ marginTop: 20 }}>
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-header">
              <h2 className="panel-title">
                <Heart size={15} style={{ marginRight: 6, color: '#ef4444', verticalAlign: 'middle' }} />
                Mes professionnels favoris
              </h2>
              <button className="link-btn" onClick={() => navigate('/client/Appointments')}>
                Explorer
              </button>
            </div>
            {loading ? (
              <p className="loading-text">Chargement...</p>
            ) : favorites.length === 0 ? (
              <EmptyState icon={Heart} message="Vous n'avez pas encore de professionnels favoris. Ajoutez-en depuis vos rendez-vous." />
            ) : (
              <ul className="pros-list">
                {favorites.map((pro) => (
                  <li key={pro.id} className="pro-item">
                    <UserAvatar user={pro} fallback="PR" className="pro-avatar" style={{ background: '#1a5276' }} />
                    <div className="pro-info">
                      <div className="pro-name-row">
                        <p className="pro-name">{[pro.prenom, pro.nom].filter(Boolean).join(' ').trim() || pro.name}</p>
                        <VerificationBadge verified={Boolean(pro.verified || ['validated', 'valide'].includes(String(pro.status || pro.validation || '').toLowerCase()))} compact className="dashboard-verified-badge" />
                      </div>
                      <p className="pro-meta">{pro.specialty} · {pro.city}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-reserver"
                        onClick={() => navigate(`/client/book?pro=${pro.id}`)}
                      >
                        Reserver
                      </button>
                      <button
                        className="btn-unfavorite"
                        onClick={() => handleRemoveFavorite(pro.id)}
                        title="Retirer des favoris"
                      >
                        <Heart size={14} fill="#ef4444" color="#ef4444" />
                      </button>
                    </div>
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
