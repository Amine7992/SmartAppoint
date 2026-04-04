import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';
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

const ProDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [todayAppts,  setTodayAppts]  = useState([]);
  const [calendarDays,setCalendarDays]= useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, apptRes] = await Promise.all([
          api.get('/pro/stats'),
          api.get('/pro/appointments/today'),
        ]);
        setStats(statsRes.data || null);
        setTodayAppts(apptRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Calendrier du mois courant
    const now       = new Date();
    const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset    = firstDay === 0 ? 6 : firstDay - 1;
    const days      = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= daysCount; d++) days.push(d);
    setCalendarDays(days);
  }, []);

  // ── Helpers stats dynamiques ─────────────────────────

  const todayRemaining = () => {
    // RDV restants = ceux qui n'ont pas encore eu lieu aujourd'hui
    const now  = new Date();
    const nowH = now.getHours() * 60 + now.getMinutes();
    const remaining = todayAppts.filter(a => {
      if (!a.time) return false;
      const [h, m] = a.time.split(':').map(Number);
      return (h * 60 + m) > nowH && a.status !== 'cancelled';
    }).length;
    return remaining;
  };

  const monthlyGrowthLabel = () => {
    const pct = stats?.monthly_growth_pct;
    if (pct == null) return null;
    if (pct > 0)  return `+${pct}% vs mois passé`;
    if (pct === 0) return 'Stable vs mois passé';
    return `${pct}% vs mois passé`;
  };

  const monthlyGrowthClass = () => {
    const pct = stats?.monthly_growth_pct;
    if (pct == null) return 'muted';
    if (pct > 0) return 'green';
    if (pct < 0) return 'red';
    return 'muted';
  };

  const absenceRiskLabel = () => {
    const rate = stats?.absence_rate;
    if (rate == null) return null;
    if (rate >= 20) return 'Risque élevé';
    if (rate >= 10) return 'Risque moyen';
    return 'Risque faible';
  };

  const absenceRiskClass = () => {
    const rate = stats?.absence_rate;
    if (rate == null) return 'muted';
    if (rate >= 20) return 'red';
    if (rate >= 10) return 'orange';
    return 'green';
  };

  const ratingLabel = () => {
    const r = stats?.rating;
    if (r == null) return null;
    return `★ sur 5`;
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

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);
  const todayDate   = new Date().getDate();
  const MONTHS_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const currentMonth= MONTHS_FR[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">

        {/* Topbar */}
        <header className="pro-topbar">
          <h1 className="pro-page-title">Tableau de bord</h1>
          <div className="pro-topbar-right">
            <span className="pro-topbar-date">{todayCapitalized}</span>
            <button className="pro-btn-primary" onClick={() => navigate('/pro/planning')}>
              Gérer les horaires
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="pro-stats-grid">

          {/* RDV aujourd'hui */}
          <div className="pro-stat-card">
            <p className="pro-stat-label">RDV aujourd'hui</p>
            <p className="pro-stat-value">{stats?.today ?? 0}</p>
            {loading ? (
              <p className="pro-stat-sub muted">—</p>
            ) : todayAppts.length > 0 ? (
              <p className="pro-stat-sub muted">
                {todayRemaining() > 0
                  ? `${todayRemaining()} restant${todayRemaining() > 1 ? 's' : ''}`
                  : 'Tous terminés'}
              </p>
            ) : (
              <p className="pro-stat-sub muted">Aucun RDV aujourd'hui</p>
            )}
          </div>

          {/* Ce mois-ci */}
          <div className="pro-stat-card">
            <p className="pro-stat-label">Ce mois-ci</p>
            <p className="pro-stat-value">{stats?.month ?? 0}</p>
            {monthlyGrowthLabel() ? (
              <p className={`pro-stat-sub ${monthlyGrowthClass()}`}>
                {monthlyGrowthLabel()}
              </p>
            ) : (
              <p className="pro-stat-sub muted">—</p>
            )}
          </div>

          {/* Taux d'absence */}
          <div className="pro-stat-card">
            <p className="pro-stat-label">Taux d'absence</p>
            <p className="pro-stat-value">
              {stats?.absence_rate != null ? `${stats.absence_rate}%` : '0%'}
            </p>
            {absenceRiskLabel() ? (
              <p className={`pro-stat-sub ${absenceRiskClass()}`}>
                {absenceRiskLabel()}
              </p>
            ) : (
              <p className="pro-stat-sub muted">—</p>
            )}
          </div>

          {/* Note moyenne */}
          <div className="pro-stat-card">
            <p className="pro-stat-label">Note moyenne</p>
            <p className="pro-stat-value">
              {stats?.rating != null ? stats.rating : '—'}
            </p>
            {ratingLabel() ? (
              <p className="pro-stat-sub star">{ratingLabel()}</p>
            ) : (
              <p className="pro-stat-sub muted">Pas encore de note</p>
            )}
          </div>

        </section>

        {/* Calendrier + Timeline */}
        <section className="pro-two-col">

          {/* Calendrier */}
          <div className="pro-panel">
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">
                Planning — {currentMonth} {currentYear}
              </h2>
              <button className="pro-link-btn" onClick={() => navigate('/pro/planning')}>
                Vue semaine
              </button>
            </div>

            <div className="pro-calendar">
              <div className="pro-cal-header">
                {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => (
                  <div key={d} className="pro-cal-dow">{d}</div>
                ))}
              </div>
              <div className="pro-cal-grid">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="pro-cal-cell empty" />;
                  const isToday = day === todayDate;
                  // Marque les jours avec des RDV
                  const hasBusy = todayAppts.some(a => {
                    if (!a.date) return false;
                    return new Date(a.date).getDate() === day;
                  });
                  return (
                    <div
                      key={day}
                      className={`pro-cal-cell ${isToday ? 'today' : hasBusy ? 'busy' : ''}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pro-cal-legend">
              <span className="legend-item"><span className="legend-dot available" />Disponible</span>
              <span className="legend-item"><span className="legend-dot today-dot" />Aujourd'hui</span>
              <span className="legend-item"><span className="legend-dot busy" />Chargé</span>
            </div>
          </div>

          {/* Timeline du jour */}
          <div className="pro-panel">
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">Aujourd'hui</h2>
              <span className="pro-rdv-count">
                {loading ? '…' : `${todayAppts.length} RDV`}
              </span>
            </div>

            {loading ? (
              <p className="pro-loading">Chargement…</p>
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
                          {appt.service} · {appt.duration} min
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* Graphique placeholder */}
        <section className="pro-panel pro-chart-panel">
          <h2 className="pro-panel-title" style={{ marginBottom: 20 }}>
            RDV par semaine — {currentMonth} {currentYear}
          </h2>
          <div className="pro-chart-empty">
            <BarChartIcon />
            <p>
              {stats?.month > 0
                ? 'Graphique disponible dans la page Statistiques.'
                : 'Les statistiques s\'afficheront ici une fois les données disponibles.'}
            </p>
          </div>
        </section>

      </main>
    </div>
  );
};

const BarChartIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
);

export default ProDashboard;
