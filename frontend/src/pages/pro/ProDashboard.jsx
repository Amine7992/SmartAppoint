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


  const [stats, setStats] = useState({ today: 0, month: 0, absence_rate: 0, rating: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [allAppts, setAllAppts] = useState([]); 
  const [calendarDays, setCalendarDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, apptRes, allRes] = await Promise.all([
          api.get('/pro/stats'),
          api.get('/pro/appointments/today'),
          api.get('/pro/appointments'), 
        ]);
        setStats(statsRes.data || null);
        setTodayAppts(apptRes.data || []);
        setAllAppts(allRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();


    // Construction du calendrier pour le mois actuel
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Ajustement : la semaine commence le lundi
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    setCalendarDays(days);
  }, []);

  // Logique de coloration : Si 1+ RDV -> Jaune (busy), Sinon -> Vert (available)
  const getDayStatusDot = (day) => {
    if (!day) return null;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayAppts = allAppts.filter(a => a.date === dateStr);

    if (dayAppts.length > 0) {
      return <span className="legend-dot busy" />; 
    }
    return <span className="legend-dot available" />;
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);
  const todayDate = new Date().getDate();
>>>>>>> origin/backend-supabase

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

            <p className="pro-stat-value">{stats.today ?? 0}</p>
            <p className="pro-stat-sub muted">En temps réel</p>
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

            <p className="pro-stat-value">{stats.absence_rate ? `${stats.absence_rate}%` : '0%'}</p>
            <p className="pro-stat-sub orange">Analyse IA</p>
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

          {/* Calendrier dynamique */}
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
              <span className="legend-item"><span className="legend-dot busy" />Chargé</span>
            </div>
          </div>

          {/* Timeline */}
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
                          {appt.service} · {appt.duration || 30} min
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>


        {/* Graphique */}
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