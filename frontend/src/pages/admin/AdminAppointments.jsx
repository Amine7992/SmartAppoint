import { useEffect, useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../api/axios';

const FILTERS = ['Tous', 'Confirmés', 'En attente', 'Annulés'];

const AdminAppointments = () => {
  const [appts,   setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState('Tous');

  useEffect(() => {
    api.get('/admin/appointments')
      .then(r => setAppts(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusMap = { 'Confirmés': ['confirmed','confirme'], 'En attente': ['pending','en attente'], 'Annulés': ['cancelled','annule'] };

  const filtered = appts.filter(a => {
    const matchFilter = filter === 'Tous' || statusMap[filter]?.includes(a.status?.toLowerCase());
    const matchQuery  = a.client_name?.toLowerCase().includes(query.toLowerCase()) ||
                        a.professional_name?.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  const statusLabel = { confirmed: 'Confirmé', confirme: 'Confirmé', pending: 'En attente', 'en attente': 'En attente', cancelled: 'Annulé', annule: 'Annulé' };
  const statusCls   = { confirmed: 'abadge-validated', confirme: 'abadge-validated', pending: 'abadge-pending', 'en attente': 'abadge-pending', cancelled: 'abadge-suspended', annule: 'abadge-suspended' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">Rendez-vous</h1>
        </header>

        <div className="admin-panel">
          <div className="au-toolbar">
            <div className="au-search-bar">
              <Search size={15} className="au-search-icon" />
              <input className="au-search-input" placeholder="Client ou professionnel…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="au-role-filters">
              {FILTERS.map(f => (
                <button key={f} className={`au-role-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="admin-loading">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="admin-empty"><Calendar size={30} className="admin-empty-icon" /><p>Aucun rendez-vous trouvé.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Client</th><th>Professionnel</th><th>Service</th><th>Date</th><th>Heure</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td className="admin-table-name">{a.client_name}</td>
                    <td className="admin-table-muted">{a.professional_name}</td>
                    <td className="admin-table-muted">{a.service}</td>
                    <td className="admin-table-muted">{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="admin-table-muted">{a.time}</td>
                    <td><span className={`admin-status-badge ${statusCls[a.status?.toLowerCase()] || 'abadge-pending'}`}>{statusLabel[a.status?.toLowerCase()] || a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAppointments;
