import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, Calendar, Star, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProStats.css';

const MONTHS_FR = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Aoû',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

const formatMonth = (key) => {
  const [, m] = key.split('-');
  return MONTHS_FR[m] || key;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <p className="stats-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontSize: 13 }}>
          {p.name}: <strong>{p.value} {p.name === 'Revenus' ? 'DT' : 'RDV'}</strong>
        </p>
      ))}
    </div>
  );
};

const ProStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pro/stats/detailed')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats?.monthly?.map((m) => ({
    month: formatMonth(m.month),
    Revenus: m.revenue || 0,
    RDV: m.count || 0,
  })) || [];

  const growthPositive = (stats?.revenue_growth ?? 0) >= 0;

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Statistiques</h1>
        </header>

        {loading ? (
          <p className="pro-loading">Chargement...</p>
        ) : !stats ? (
          <div className="pro-panel">
            <div className="pro-empty" style={{ padding: '50px 20px' }}>
              <TrendingUp size={36} className="pro-empty-icon" />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucune statistique disponible</p>
              <p>Les données apparaîtront ici au fur et à mesure de vos rendez-vous.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="pro-stats-grid" style={{ marginBottom: 20 }}>
              <div className="pro-stat-card">
                <p className="pro-stat-label"><Calendar size={13} style={{ marginRight: 4 }} />Total RDV</p>
                <p className="pro-stat-value">{stats.total_appointments ?? 0}</p>
                <p className="pro-stat-sub muted">Depuis le début</p>
              </div>
              <div className="pro-stat-card">
                <p className="pro-stat-label"><Users size={13} style={{ marginRight: 4 }} />Clients uniques</p>
                <p className="pro-stat-value">{stats.unique_clients ?? 0}</p>
                <p className="pro-stat-sub green">Patients suivis</p>
              </div>
              <div className="pro-stat-card">
                <p className="pro-stat-label"><TrendingUp size={13} style={{ marginRight: 4 }} />Taux no-show</p>
                <p className="pro-stat-value">{stats.noshow_rate ? `${stats.noshow_rate}%` : '0%'}</p>
                <p className="pro-stat-sub orange">Sur la période</p>
              </div>
              <div className="pro-stat-card">
                <p className="pro-stat-label"><Star size={13} style={{ marginRight: 4 }} />Note moyenne</p>
                <p className="pro-stat-value">{stats.avg_rating ?? '-'}</p>
                <p className="pro-stat-sub star">* sur 5</p>
              </div>
            </div>

            {/* Revenue cards */}
            <div className="stats-revenue-grid">
              <div className="stats-revenue-card total">
                <div className="stats-revenue-icon"><DollarSign size={20} /></div>
                <div className="stats-revenue-info">
                  <p className="stats-revenue-label">Revenus totaux</p>
                  <p className="stats-revenue-value">{(stats.total_revenue || 0).toFixed(2)} DT</p>
                  <p className="stats-revenue-sub">Tous les paiements confirmés</p>
                </div>
              </div>
              <div className="stats-revenue-card month">
                <div className="stats-revenue-icon"><TrendingUp size={20} /></div>
                <div className="stats-revenue-info">
                  <p className="stats-revenue-label">Ce mois-ci</p>
                  <p className="stats-revenue-value">{(stats.this_month_revenue || 0).toFixed(2)} DT</p>
                  <p className="stats-revenue-sub muted">Mois précédent: {(stats.last_month_revenue || 0).toFixed(2)} DT</p>
                </div>
              </div>
              <div className="stats-revenue-card growth">
                <div className={`stats-revenue-icon ${growthPositive ? 'positive' : 'negative'}`}>
                  {growthPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="stats-revenue-info">
                  <p className="stats-revenue-label">Évolution</p>
                  <p className={`stats-revenue-value ${growthPositive ? 'green' : 'red'}`}>
                    {growthPositive ? '+' : ''}{stats.revenue_growth ?? 0}%
                  </p>
                  <p className="stats-revenue-sub">vs mois précédent</p>
                </div>
              </div>
            </div>

            {/* Revenue curve */}
            <div className="pro-panel" style={{ marginTop: 20 }}>
              <h2 className="pro-panel-title" style={{ marginBottom: 20 }}>Revenus mensuels</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#085041" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#085041" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit=" DT" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Revenus"
                      stroke="#085041"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                      dot={{ fill: '#085041', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="pro-empty"><p>Pas encore de données de revenus.</p></div>
              )}
            </div>

            {/* RDV par mois + services */}
            <div className="pro-two-col" style={{ marginTop: 20 }}>
              <div className="pro-panel">
                <h2 className="pro-panel-title" style={{ marginBottom: 16 }}>RDV par mois</h2>
                {stats.monthly && stats.monthly.length > 0 ? (
                  <div className="stats-bar-chart">
                    {stats.monthly.map((m, i) => (
                      <div key={i} className="stats-bar-row">
                        <span className="stats-bar-label">{formatMonth(m.month)}</span>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${(m.count / Math.max(...stats.monthly.map((x) => x.count), 1)) * 100}%` }}
                          />
                        </div>
                        <span className="stats-bar-val">{m.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pro-empty"><p>Pas encore de données.</p></div>
                )}
              </div>

              <div className="pro-panel">
                <h2 className="pro-panel-title" style={{ marginBottom: 16 }}>Répartition des services</h2>
                {stats.services && stats.services.filter(s => s.count > 0).length > 0 ? (
                  <div className="stats-service-list">
                    {stats.services.filter(s => s.count > 0).map((s, i) => (
                      <div key={i} className="stats-service-row">
                        <span className="stats-service-name">{s.name}</span>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${(s.count / Math.max(...stats.services.map((x) => x.count), 1)) * 100}%` }}
                          />
                        </div>
                        <span className="stats-bar-val">{s.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pro-empty"><p>Pas encore de données.</p></div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ProStats;
