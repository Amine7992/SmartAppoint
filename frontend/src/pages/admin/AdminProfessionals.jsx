import { useEffect, useState } from 'react';
import { Search, Briefcase, Check, X, RefreshCw } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../api/axios';

const FILTERS = ['Tous', 'En attente', 'Validés', 'Suspendus'];

const AdminProfessionals = () => {
  const [pros,    setPros]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [filter,  setFilter]  = useState('Tous');

  useEffect(() => {
    api.get('/admin/professionals')
      .then(r => setPros(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleValidate   = async (id) => {
    try { await api.put(`/admin/professionals/${id}/validate`);
      setPros(prev => prev.map(p => p.id === id ? { ...p, status: 'validated' } : p)); }
    catch (err) { console.error(err); }
  };

  const handleReject     = async (id) => {
    try { await api.put(`/admin/professionals/${id}/reject`);
      setPros(prev => prev.map(p => p.id === id ? { ...p, status: 'suspended' } : p)); }
    catch (err) { console.error(err); }
  };

  const handleReactivate = async (id) => {
    try { await api.put(`/admin/professionals/${id}/reactivate`);
      setPros(prev => prev.map(p => p.id === id ? { ...p, status: 'validated' } : p)); }
    catch (err) { console.error(err); }
  };

  const statusMap = { 'En attente': ['pending','en attente'], 'Validés': ['validated','valide'], 'Suspendus': ['suspended','suspendu'] };

  const filtered = pros.filter(p => {
    const matchFilter = filter === 'Tous' || statusMap[filter]?.includes(p.status?.toLowerCase());
    const matchQuery  = p.name?.toLowerCase().includes(query.toLowerCase()) ||
                        p.specialty?.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchQuery;
  });

  const statusLabel = { pending: 'En attente', 'en attente': 'En attente', validated: 'Validé', valide: 'Validé', suspended: 'Suspendu', suspendu: 'Suspendu' };
  const statusCls   = { pending: 'abadge-pending', 'en attente': 'abadge-pending', validated: 'abadge-validated', valide: 'abadge-validated', suspended: 'abadge-suspended', suspendu: 'abadge-suspended' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">Professionnels</h1>
        </header>

        <div className="admin-panel">
          <div className="au-toolbar">
            <div className="au-search-bar">
              <Search size={15} className="au-search-icon" />
              <input className="au-search-input" placeholder="Rechercher…" value={query} onChange={e => setQuery(e.target.value)} />
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
            <div className="admin-empty"><Briefcase size={30} className="admin-empty-icon" /><p>Aucun professionnel trouvé.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Nom</th><th>Spécialité</th><th>Email</th><th>Statut</th><th>RDV total</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(pro => (
                  <tr key={pro.id}>
                    <td className="admin-table-name">{pro.name}</td>
                    <td className="admin-table-muted">{pro.specialty}</td>
                    <td className="admin-table-muted">{pro.email}</td>
                    <td><span className={`admin-status-badge ${statusCls[pro.status?.toLowerCase()] || 'abadge-pending'}`}>{statusLabel[pro.status?.toLowerCase()] || pro.status}</span></td>
                    <td className="admin-table-muted">{pro.appointments_count ?? 0}</td>
                    <td>
                      <div className="admin-table-actions">
                        {['pending','en attente'].includes(pro.status?.toLowerCase()) && (
                          <>
                            <button className="admin-btn-ok" onClick={() => handleValidate(pro.id)}><Check size={13} /></button>
                            <button className="admin-btn-reject" onClick={() => handleReject(pro.id)}><X size={13} /></button>
                          </>
                        )}
                        {['validated','valide'].includes(pro.status?.toLowerCase()) && (
                          <button className="admin-btn-reject" onClick={() => handleReject(pro.id)}><X size={13} /></button>
                        )}
                        {['suspended','suspendu'].includes(pro.status?.toLowerCase()) && (
                          <button className="admin-btn-reactivate" onClick={() => handleReactivate(pro.id)}><RefreshCw size={13} /></button>
                        )}
                      </div>
                    </td>
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

export default AdminProfessionals;
