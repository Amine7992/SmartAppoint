import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Bell, Calendar, AlertCircle, Info, CheckCheck } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import './ProDashboard.css';

const EmptyTimeline = () => (
  <div className="pro-empty">
    <Clock size={30} className="pro-empty-icon" />
    <p>Aucun rendez-vous aujourd'hui.</p>
  </div>
);

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

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "A l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
};

const ProDashboard = () => {
  useAuth();
  const navigate = useNavigate();
  const notifMenuRef = useRef(null);

  const [stats, setStats] = useState({ today: 0, month: 0, absence_rate: 0, rating: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [allAppts, setAllAppts] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setNotifLoading(true);
      try {
        const [statsRes, apptRes, allRes, notifRes] = await Promise.all([
          api.get('/pro/stats'),
          api.get('/pro/appointments/today'),
          api.get('/pro/appointments'),
          api.get('/notifications'),
        ]);
        setStats(statsRes.data || null);
        setTodayAppts(apptRes.data || []);
        setAllAppts(allRes.data || []);
        setNotifications(notifRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setNotifLoading(false);
      }
    };
    fetchData();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < startOffset; i += 1) days.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) days.push(d);
    setCalendarDays(days);
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

  const getDayStatusDot = (day) => {
    if (!day) return null;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAppts = allAppts.filter((a) => a.date === dateStr);
    if (dayAppts.length > 0) return <span className="legend-dot busy" />;
    return <span className="legend-dot available" />;
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);
  const todayDate = new Date().getDate();
  const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  const currentMonth = MONTHS_FR[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const monthlyGrowthLabel = () => {
    const pct = stats?.monthly_growth_pct;
    if (pct == null) return null;
    if (pct > 0) return `+${pct}% vs mois passe`;
    if (pct === 0) return 'Stable vs mois passe';
    return `${pct}% vs mois passe`;
  };

  const monthlyGrowthClass = () => {
    const pct = stats?.monthly_growth_pct;
    if (pct == null) return 'muted';
    if (pct > 0) return 'green';
    if (pct < 0) return 'red';
    return 'muted';
  };

  const ratingLabel = () => {
    const r = stats?.rating;
    if (r == null) return null;
    return '* sur 5';
  };

  const getRiskClass = (score) => {
    if (!score) return '';
    if (score >= 0.7) return 'risk-high';
    if (score >= 0.4) return 'risk-medium';
    return 'risk-low';
  };

  const getRiskLabel = (score) => {
    if (!score) return '';
    return `Risque IA ${Math.round(score * 100)}%`;
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

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Tableau de bord</h1>
          <div className="pro-topbar-right">
            <span className="pro-topbar-date">{todayCapitalized}</span>
            <div className="pro-notif-menu" ref={notifMenuRef}>
              <button
                type="button"
                className={`pro-notif-trigger ${hasNotifications ? 'has-alert' : ''} ${notifOpen ? 'open' : ''}`}
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadNotifications > 0 ? (
                  <span className="pro-notif-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                ) : null}
              </button>

              {notifOpen ? (
                <div className="pro-notif-dropdown">
                  <div className="pro-notif-dropdown-head">
                    <div>
                      <p className="pro-notif-dropdown-title">Notifications</p>
                      <p className="pro-notif-dropdown-sub">
                        {unreadNotifications > 0 ? `${unreadNotifications} non lue${unreadNotifications > 1 ? 's' : ''}` : 'Tout est lu'}
                      </p>
                    </div>
                    {unreadNotifications > 0 ? (
                      <button type="button" className="pro-notif-mark-all" onClick={markAllNotificationsRead}>
                        <CheckCheck size={14} />
                      </button>
                    ) : null}
                  </div>

                  {notifLoading ? (
                    <p className="pro-notif-empty">Chargement...</p>
                  ) : visibleNotifications.length === 0 ? (
                    <p className="pro-notif-empty">Aucune notification pour le moment.</p>
                  ) : (
                    <div className="pro-notif-dropdown-list">
                      {visibleNotifications.map((notif) => (
                        <button
                          type="button"
                          key={notif.id}
                          className={`pro-notif-item ${notif.read ? 'read' : 'unread'}`}
                          onClick={() => {
                            if (!notif.read) markNotificationRead(notif.id);
                          }}
                        >
                          <span className={`pro-notif-item-icon ${notificationClasses[notif.type] || 'info'}`}>
                            {notificationIcons[notif.type] || <Info size={15} />}
                          </span>
                          <span className="pro-notif-item-body">
                            <span className="pro-notif-item-message">{notif.message}</span>
                            <span className="pro-notif-item-time">{timeAgo(notif.created_at)}</span>
                          </span>
                          {!notif.read ? <span className="pro-notif-item-dot" /> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <button className="pro-btn-primary" onClick={() => navigate('/pro/planning')}>
              Gerer les horaires
            </button>
          </div>
        </header>

        <section className="pro-stats-grid">
          <div className="pro-stat-card">
            <p className="pro-stat-label">RDV aujourd'hui</p>
            <p className="pro-stat-value">{stats.today ?? 0}</p>
            <p className="pro-stat-sub muted">En temps reel</p>
          </div>

          <div className="pro-stat-card">
            <p className="pro-stat-label">Ce mois-ci</p>
            <p className="pro-stat-value">{stats?.month ?? 0}</p>
            {monthlyGrowthLabel() ? (
              <p className={`pro-stat-sub ${monthlyGrowthClass()}`}>{monthlyGrowthLabel()}</p>
            ) : (
              <p className="pro-stat-sub muted">-</p>
            )}
          </div>

          <div className="pro-stat-card">
            <p className="pro-stat-label">Taux d'absence</p>
            <p className="pro-stat-value">{stats.absence_rate ? `${stats.absence_rate}%` : '0%'}</p>
            <p className="pro-stat-sub orange">Analyse IA</p>
          </div>

          <div className="pro-stat-card">
            <p className="pro-stat-label">Note moyenne</p>
            <p className="pro-stat-value">{stats?.rating != null ? stats.rating : '-'}</p>
            {ratingLabel() ? (
              <p className="pro-stat-sub star">{ratingLabel()}</p>
            ) : (
              <p className="pro-stat-sub muted">Pas encore de note</p>
            )}
          </div>
        </section>

        <section className="pro-two-col">
          <div className="pro-panel">
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">Planning - {currentMonth} {currentYear}</h2>
              <button className="pro-link-btn" onClick={() => navigate('/pro/planning')}>
                Vue semaine
              </button>
            </div>

            <div className="pro-calendar">
              <div className="pro-cal-header">
                {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
                  <div key={d} className="pro-cal-dow">{d}</div>
                ))}
              </div>
              <div className="pro-cal-grid">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="pro-cal-cell empty" />;
                  const isToday = day === todayDate;
                  return (
                    <div key={day} className={`pro-cal-cell ${isToday ? 'today' : ''}`}>
                      <span className="day-number">{day}</span>
                      {getDayStatusDot(day)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pro-cal-legend">
              <span className="legend-item"><span className="legend-dot available" />Disponible</span>
              <span className="legend-item"><span className="legend-dot today-dot" />Aujourd'hui</span>
              <span className="legend-item"><span className="legend-dot busy" />Charge</span>
            </div>
          </div>

          <div className="pro-panel">
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">Aujourd'hui</h2>
              <span className="pro-rdv-count">
                {loading ? '...' : `${todayAppts.length} RDV`}
              </span>
            </div>

            {loading ? (
              <p className="pro-loading">Chargement...</p>
            ) : todayAppts.length === 0 ? (
              <EmptyTimeline />
            ) : (
              <div className="pro-timeline">
                {todayAppts.map((appt) => {
                  const hasRisk = appt.ai_score && appt.ai_score >= 0.4;
                  return (
                    <div key={appt.id} className="pro-timeline-row">
                      <span className="pro-timeline-time">{appt.time}</span>
                      <div className={`pro-timeline-card ${hasRisk ? 'risk' : ''}`}>
                        <div className="pro-timeline-top">
                          <span className="pro-timeline-name">{appt.client_name}</span>
                          {hasRisk && (
                            <span className={`pro-risk-badge ${getRiskClass(appt.ai_score)}`}>
                              {getRiskLabel(appt.ai_score)}
                            </span>
                          )}
                        </div>
                        <span className="pro-timeline-service">
                          {appt.service} - {appt.duration || 30} min
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="pro-panel pro-chart-panel">
          <h2 className="pro-panel-title" style={{ marginBottom: 20 }}>
            RDV par semaine - {currentMonth} {currentYear}
          </h2>
          <div className="pro-chart-empty">
            <BarChartIcon />
            <p>
              {stats?.month > 0
                ? 'Graphique disponible dans la page Statistiques.'
                : "Les statistiques s'afficheront ici une fois les donnees disponibles."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

const BarChartIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

export default ProDashboard;
