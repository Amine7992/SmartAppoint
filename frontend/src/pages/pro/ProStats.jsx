import { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProStats.css';

const ProStats = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pro/stats/detailed')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Statistiques</h1>
        </header>

        {loading ? (
          <p className="pro-loading">Chargement…</p>
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
                <p className="pro-stat-value">{stats.avg_rating ?? '—'}</p>
                <p className="pro-stat-sub star">* sur 5</p>
              </div>
            </div>

            <div className="pro-two-col">
              <div className="pro-panel">
                <h2 className="pro-panel-title" style={{ marginBottom: 16 }}>RDV par mois</h2>
                {stats.monthly && stats.monthly.length > 0 ? (
                  <div className="stats-bar-chart">
                    {stats.monthly.map((m, i) => (
                      <div key={i} className="stats-bar-row">
                        <span className="stats-bar-label">{m.month}</span>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${(m.count / Math.max(...stats.monthly.map(x => x.count))) * 100}%` }}
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
                {stats.services && stats.services.length > 0 ? (
                  <div className="stats-service-list">
                    {stats.services.map((s, i) => (
                      <div key={i} className="stats-service-row">
                        <span className="stats-service-name">{s.name}</span>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${(s.count / Math.max(...stats.services.map(x => x.count))) * 100}%` }}
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

