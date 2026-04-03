import { useEffect, useState } from 'react';
import { Search, User } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProClients.css';

const ProClients = () => {
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/pro/clients')
      .then(r => setClients(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Mes clients</h1>
        </header>

        <div className="clients-layout">
          {/* Liste */}
          <div className="pro-panel clients-list-panel">
            <div className="clients-search-bar">
              <Search size={15} className="clients-search-icon" />
              <input
                className="clients-search-input"
                placeholder="Rechercher un client…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <p className="pro-loading">Chargement…</p>
            ) : filtered.length === 0 ? (
              <div className="pro-empty">
                <User size={30} className="pro-empty-icon" />
                <p>Aucun client trouvé.</p>
              </div>
            ) : (
              <ul className="clients-list">
                {filtered.map(c => (
                  <li
                    key={c.id}
                    className={`client-item ${selected?.id === c.id ? 'active' : ''}`}
                    onClick={() => setSelected(c)}
                  >
                    <div className="client-avatar">
                      {c.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="client-info">
                      <p className="client-name">{c.name}</p>
                      <p className="client-email">{c.email}</p>
                    </div>
                    <span className="client-rdv-count">{c.appointments_count ?? 0} RDV</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Détail client */}
          <div className="pro-panel clients-detail-panel">
            {!selected ? (
              <div className="pro-empty" style={{ height: '100%' }}>
                <User size={34} className="pro-empty-icon" />
                <p>Sélectionnez un client pour voir ses détails.</p>
              </div>
            ) : (
              <>
                <div className="client-detail-header">
                  <div className="client-detail-avatar">
                    {selected.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="client-detail-name">{selected.name}</p>
                    <p className="client-detail-email">{selected.email}</p>
                    {selected.phone && <p className="client-detail-phone">{selected.phone}</p>}
                  </div>
                </div>

                <div className="client-detail-stats">
                  <div className="client-stat">
                    <p className="client-stat-val">{selected.appointments_count ?? 0}</p>
                    <p className="client-stat-label">RDV total</p>
                  </div>
                  <div className="client-stat">
                    <p className="client-stat-val">{selected.no_show_count ?? 0}</p>
                    <p className="client-stat-label">Absences</p>
                  </div>
                  <div className="client-stat">
                    <p className="client-stat-val">{selected.last_visit ? new Date(selected.last_visit).toLocaleDateString('fr-FR') : '—'}</p>
                    <p className="client-stat-label">Dernière visite</p>
                  </div>
                </div>

                <h3 className="client-detail-section">Historique des RDV</h3>
                {(!selected.history || selected.history.length === 0) ? (
                  <p className="pro-loading">Aucun historique disponible.</p>
                ) : (
                  <ul className="client-history-list">
                    {selected.history.map(h => (
                      <li key={h.id} className="client-history-item">
                        <span className="client-history-date">{new Date(h.date).toLocaleDateString('fr-FR')}</span>
                        <span className="client-history-service">{h.service}</span>
                        <span className={`plan-badge badge-${h.status}`}>{h.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProClients;
