import { useEffect, useState } from 'react';
import { Search, User, Trash2, ShieldOff } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UserAvatar from '../../components/common/UserAvatar';
import api from '../../api/axios';
import './AdminUsers.css';

const ROLES = ['Tous', 'client', 'professional', 'admin'];

const AdminUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');
  const [role,    setRole]    = useState('Tous');

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      const message = err?.response?.data?.error || 'Suppression impossible pour cet utilisateur';
      console.error(err);
      window.alert(message);
    }
  };

  const handleSuspend = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/suspend`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: data?.status || 'suspended' } : u));
    } catch (err) {
      const message = err?.response?.data?.error || 'Suspension impossible pour cet utilisateur';
      console.error(err);
      window.alert(message);
    }
  };

  const handleUnsuspend = async (id) => {
    try {
      const { data } = await api.put(`/admin/users/${id}/unsuspend`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: data?.status || 'active' } : u));
    } catch (err) {
      const message = String(err?.response?.data?.error || err?.message || '');
      const isMissingRoute = message.includes('Cannot PUT') || err?.response?.status === 404;

      if (!isMissingRoute) {
        console.error(err);
        window.alert(message || 'Annulation de suspension impossible pour cet utilisateur');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const fallbackApi = 'http://localhost:5000/api';
        const { data } = await api.put(`${fallbackApi}/admin/users/${id}/unsuspend`, null, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: data?.status || 'active' } : u));
      } catch (fallbackErr) {
        console.error(fallbackErr);
        const fallbackMessage = fallbackErr?.response?.data?.error || 'Annulation de suspension impossible pour cet utilisateur';
        window.alert(fallbackMessage);
      }
    }
  };

  const filtered = users.filter(u => {
    const matchRole  = role === 'Tous' || u.role === role;
    const matchQuery = u.name?.toLowerCase().includes(query.toLowerCase()) ||
                       u.email?.toLowerCase().includes(query.toLowerCase());
    return matchRole && matchQuery;
  });

  const roleLabel = { client: 'Client', professional: 'Pro', admin: 'Admin' };
  const roleCls   = { client: 'urole-client', professional: 'urole-pro', admin: 'urole-admin' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">Utilisateurs</h1>
        </header>

        <div className="admin-panel">
          <div className="au-toolbar">
            <div className="au-search-bar">
              <Search size={15} className="au-search-icon" />
              <input
                className="au-search-input"
                placeholder="Rechercher un utilisateur…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="au-role-filters">
              {ROLES.map(r => (
                <button
                  key={r}
                  className={`au-role-btn ${role === r ? 'active' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r === 'Tous' ? 'Tous' : roleLabel[r]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="admin-loading">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <User size={30} className="admin-empty-icon" />
              <p>Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="au-user-cell">
                        <UserAvatar user={u} fallback="US" className="au-avatar" />
                        <span className="admin-table-name">{u.name}</span>
                      </div>
                    </td>
                    <td className="admin-table-muted">{u.email}</td>
                    <td><span className={`au-role-badge ${roleCls[u.role] || ''}`}>{roleLabel[u.role] || u.role}</span></td>
                    <td>
                      <span className={`admin-status-badge ${u.status === 'active' ? 'abadge-validated' : 'abadge-suspended'}`}>
                        {u.status === 'active' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="admin-table-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        {u.status === 'suspended' ? (
                          <button className="admin-btn-reactivate" title="Annuler suspension" onClick={() => handleUnsuspend(u.id)}>
                            Annuler suspension
                          </button>
                        ) : (
                          <button className="admin-btn-reject" title="Suspendre" onClick={() => handleSuspend(u.id)}>
                            <ShieldOff size={13} />
                          </button>
                        )}
                        <button className="admin-btn-reject" title="Supprimer" onClick={() => handleDelete(u.id)}>
                          <Trash2 size={13} />
                        </button>
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

export default AdminUsers;
