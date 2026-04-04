import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../api/axios';

const AdminStats = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats/detailed')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">Statistiques</h1>
        </header>

        {loading ? (
          <p className="admin-loading">Chargement…</p>
        ) : !stats ? (
          <div className="admin-panel">
            <div className="admin-empty" style={{ padding: '50px 20px' }}>
              <TrendingUp size={36} className="admin-empty-icon" />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucune statistique disponible</p>
              <p>Les données apparaîtront ici au fur et à mesure de l'activité de la plateforme.</p>
            </div>
          </div>
        ) : (
          <div className="pro-two-col">
            <div className="admin-panel">
              <h2 className="admin-panel-title" style={{ marginBottom: 18 }}>RDV par mois</h2>
              {stats.monthly?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.monthly.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 60 }}>{m.month}</span>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#26215C', borderRadius: 4, width: `${(m.count / Math.max(...stats.monthly.map(x => x.count))) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', minWidth: 28 }}>{m.count}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="admin-empty"><p>Pas encore de données.</p></div>}
            </div>

            <div className="admin-panel">
              <h2 className="admin-panel-title" style={{ marginBottom: 18 }}>Inscriptions par mois</h2>
              {stats.registrations?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.registrations.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 60 }}>{m.month}</span>
                      <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#1D9E75', borderRadius: 4, width: `${(m.count / Math.max(...stats.registrations.map(x => x.count))) * 100}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', minWidth: 28 }}>{m.count}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="admin-empty"><p>Pas encore de données.</p></div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStats;
