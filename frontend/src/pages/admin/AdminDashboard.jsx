import { useEffect, useState } from 'react';
import { Users, Briefcase, Calendar, TrendingUp, X, User, Clock, AlertCircle, Download } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import VerificationBadge from '../../components/common/VerificationBadge';
import api from '../../api/axios';
import './AdminDashboard.css';

const StatusBadge = ({ status }) => {
  const map = {
    pending:      { label: 'En attente', cls: 'abadge-pending'   },
    validated:    { label: 'Validé',     cls: 'abadge-validated' },
    suspended:    { label: 'Suspendu',   cls: 'abadge-suspended' },
    'en attente': { label: 'En attente', cls: 'abadge-pending'   },
    valide:       { label: 'Validé',     cls: 'abadge-validated' },
    suspendu:     { label: 'Suspendu',   cls: 'abadge-suspended' },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'abadge-pending' };
  return <span className={`admin-status-badge ${s.cls}`}>{s.label}</span>;
};

const ActivityIcon = ({ type }) => {
  const icons = {
    user:        <User size={15} />,
    appointment: <Calendar size={15} />,
    alert:       <AlertCircle size={15} />,
  };
  const cls = { user: 'aicon-blue', appointment: 'aicon-green', alert: 'aicon-orange' };
  return (
    <div className={`activity-icon-wrap ${cls[type] || 'aicon-blue'}`}>
      {icons[type] || <User size={15} />}
    </div>
  );
};

const DonutChart = ({ clients = 0, pros = 0, admins = 0 }) => {
  const total = clients + pros + admins || 1;
  const r = 60, cx = 80, cy = 80, stroke = 22;
  const circ = 2 * Math.PI * r;
  const pClient = (clients / total) * circ;
  const pPro    = (pros    / total) * circ;
  const pAdmin  = (admins  / total) * circ;

  return (
    <div className="donut-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#534AB7" strokeWidth={stroke}
          strokeDasharray={`${pClient} ${circ - pClient}`}
          strokeDashoffset={circ * 0.25} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1D9E75" strokeWidth={stroke}
          strokeDasharray={`${pPro} ${circ - pPro}`}
          strokeDashoffset={circ * 0.25 - pClient} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EF9F27" strokeWidth={stroke}
          strokeDasharray={`${pAdmin} ${circ - pAdmin}`}
          strokeDashoffset={circ * 0.25 - pClient - pPro} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1a1a2e">
          {(clients + pros + admins) > 0
            ? (clients + pros + admins).toLocaleString('fr-FR')
            : '—'}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">utilisateurs</text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: '#534AB7' }} />
          <span>Clients<br /><b>{clients.toLocaleString('fr-FR')} ({total > 1 ? Math.round(clients / total * 100) : 0}%)</b></span>
        </div>
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: '#1D9E75' }} />
          <span>Professionnels<br /><b>{pros} ({total > 1 ? Math.round(pros / total * 100) : 0}%)</b></span>
        </div>
        <div className="donut-legend-item">
          <span className="donut-dot" style={{ background: '#EF9F27' }} />
          <span>Admins<br /><b>{admins} ({total > 1 ? Math.round(admins / total * 100) : 0}%)</b></span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats,       setStats]       = useState(null);
  const [pendingPros, setPendingPros] = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [userDist,    setUserDist]    = useState({ clients: 0, pros: 0, admins: 0 });
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, prosRes, actRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/professionals/pending'),
          api.get('/admin/activity'),
        ]);
        setStats(statsRes.data || null);
        setPendingPros(prosRes.data || []);
        setActivity(actRes.data || []);
        setUserDist({
          clients: statsRes.data?.clients_count || 0,
          pros:    statsRes.data?.pros_count    || 0,
          admins:  statsRes.data?.admins_count  || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Export rapport ── */
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/report', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `smartappoint-rapport-${date}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export échoué :', err);
      alert('Export non disponible pour l\'instant.');
    } finally {
      setExporting(false);
    }
  };

  const handleValidate   = async (id) => {
    try {
      await api.put(`/admin/professionals/${id}/validate`);
      setPendingPros(prev => prev.map(p => p.id === id ? { ...p, status: 'validated' } : p));
    } catch (err) { console.error(err); }
  };

  const handleReject     = async (id) => {
    try {
      await api.put(`/admin/professionals/${id}/reject`);
      setPendingPros(prev => prev.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleReactivate = async (id) => {
    try {
      await api.put(`/admin/professionals/${id}/reactivate`);
      setPendingPros(prev => prev.map(p => p.id === id ? { ...p, status: 'validated' } : p));
    } catch (err) { console.error(err); }
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return "À l'instant";
    if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return `Il y a ${Math.floor(diff / 86400)}j`;
  };

  /* ── Helpers stats dynamiques ── */
  const fmt = (val) => val != null ? val.toLocaleString('fr-FR') : '0';

  const weeklyUsersLabel = () => {
    if (!stats?.weekly_new_users && stats?.weekly_new_users !== 0) return null;
    return stats.weekly_new_users > 0
      ? `+${stats.weekly_new_users} cette semaine`
      : stats.weekly_new_users === 0
      ? 'Aucun nouveau cette semaine'
      : `${stats.weekly_new_users} cette semaine`;
  };

  const monthlyApptLabel = () => {
    if (!stats?.monthly_growth_pct && stats?.monthly_growth_pct !== 0) return null;
    const pct = stats.monthly_growth_pct;
    return pct > 0
      ? `+${pct}% vs mois passé`
      : pct === 0
      ? 'Stable vs mois passé'
      : `${pct}% vs mois passé`;
  };

  const noshowLabel = () => {
    if (!stats?.noshow_target) return 'Objectif : < 10%';
    return `Objectif : < ${stats.noshow_target}%`;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <h1 className="admin-page-title">Vue globale</h1>
          <div className="admin-topbar-right">
            <span className="admin-topbar-date">{todayCapitalized}</span>
            <button
              className="admin-btn-primary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={14} style={{ marginRight: 6 }} />
              {exporting ? 'Export en cours…' : 'Exporter rapport'}
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="admin-stats-grid">

          <div className="admin-stat-card">
            <p className="admin-stat-label">
              <Users size={13} style={{ marginRight: 4 }} />Total utilisateurs
            </p>
            <p className="admin-stat-value">{fmt(stats?.total_users)}</p>
            {weeklyUsersLabel() ? (
              <p className={`admin-stat-sub ${stats?.weekly_new_users > 0 ? 'green' : 'muted'}`}>
                {weeklyUsersLabel()}
              </p>
            ) : (
              <p className="admin-stat-sub muted">—</p>
            )}
          </div>

          <div className="admin-stat-card">
            <p className="admin-stat-label">
              <Briefcase size={13} style={{ marginRight: 4 }} />Professionnels actifs
            </p>
            <p className="admin-stat-value">{fmt(stats?.active_pros)}</p>
            {stats?.pending_pros != null ? (
              <p className={`admin-stat-sub ${stats.pending_pros > 0 ? 'orange' : 'muted'}`}>
                {stats.pending_pros > 0
                  ? `${stats.pending_pros} en attente`
                  : 'Aucun en attente'}
              </p>
            ) : (
              <p className="admin-stat-sub muted">—</p>
            )}
          </div>

          <div className="admin-stat-card">
            <p className="admin-stat-label">
              <Calendar size={13} style={{ marginRight: 4 }} />RDV ce mois
            </p>
            <p className="admin-stat-value">{fmt(stats?.monthly_appts)}</p>
            {monthlyApptLabel() ? (
              <p className={`admin-stat-sub ${
                stats?.monthly_growth_pct > 0 ? 'green'
                : stats?.monthly_growth_pct < 0 ? 'red' : 'muted'
              }`}>
                {monthlyApptLabel()}
              </p>
            ) : (
              <p className="admin-stat-sub muted">—</p>
            )}
          </div>

          <div className="admin-stat-card">
            <p className="admin-stat-label">
              <TrendingUp size={13} style={{ marginRight: 4 }} />Taux no-show global
            </p>
            <p className="admin-stat-value">
              {stats?.noshow_rate != null ? `${stats.noshow_rate}%` : '0%'}
            </p>
            <p className={`admin-stat-sub ${
              stats?.noshow_rate > 10 ? 'red' : 'muted'
            }`}>
              {noshowLabel()}
            </p>
          </div>

        </section>

        {/* Middle row */}
        <section className="admin-mid-row">

          {/* Pros en attente */}
          <div className="admin-panel admin-pros-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Professionnels en attente de validation</h2>
            </div>

            {loading ? (
              <p className="admin-loading">Chargement…</p>
            ) : pendingPros.length === 0 ? (
              <div className="admin-empty">
                <Briefcase size={30} className="admin-empty-icon" />
                <p>Aucun professionnel en attente.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Spécialité</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPros.map(pro => (
                    <tr key={pro.id}>
                      <td>
                        <div className="admin-pro-name-row">
                          <span className="admin-table-name">{pro.name}</span>
                          <VerificationBadge verified={Boolean(pro.verified || ['validated', 'valide'].includes(String(pro.status || '').toLowerCase()))} compact />
                        </div>
                      </td>
                      <td className="admin-table-muted">{pro.specialty}</td>
                      <td><StatusBadge status={pro.status} /></td>
                      <td>
                        <div className="admin-table-actions">
                          {['pending', 'en attente'].includes(pro.status?.toLowerCase()) && (
                            <>
                              <button className="admin-btn-ok"     onClick={() => handleValidate(pro.id)}>OK</button>
                              <button className="admin-btn-reject" onClick={() => handleReject(pro.id)}><X size={13} /></button>
                            </>
                          )}
                          {['validated', 'valide'].includes(pro.status?.toLowerCase()) && (
                            <button className="admin-btn-reject" onClick={() => handleReject(pro.id)}><X size={13} /></button>
                          )}
                          {['suspended', 'suspendu'].includes(pro.status?.toLowerCase()) && (
                            <button className="admin-btn-reactivate" onClick={() => handleReactivate(pro.id)}>Réactiver</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Donut */}
          <div className="admin-panel admin-donut-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Répartition des utilisateurs</h2>
            </div>
            {loading ? (
              <p className="admin-loading">Chargement…</p>
            ) : (
              <DonutChart
                clients={userDist.clients}
                pros={userDist.pros}
                admins={userDist.admins}
              />
            )}
          </div>
        </section>

        {/* Activité récente */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 className="admin-panel-title">Activité récente</h2>
          </div>
          {loading ? (
            <p className="admin-loading">Chargement…</p>
          ) : activity.length === 0 ? (
            <div className="admin-empty">
              <Clock size={28} className="admin-empty-icon" />
              <p>Aucune activité récente.</p>
            </div>
          ) : (
            <div className="admin-activity-list">
              {activity.map((item, i) => (
                <div key={i} className="admin-activity-item">
                  <ActivityIcon type={item.type} />
                  <div className="admin-activity-body">
                    <p
                      className="admin-activity-msg"
                      dangerouslySetInnerHTML={{ __html: item.message }}
                    />
                    <p className="admin-activity-time">{timeAgo(item.created_at)}</p>
                  </div>
                  {item.tag && (
                    <span className={`admin-activity-tag tag-${item.tag_type || 'info'}`}>
                      {item.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
