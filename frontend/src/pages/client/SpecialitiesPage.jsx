import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import './Dashboard.css';
import './BookAppointment.css';

const COLORS = {
  informatique: { bg: '#e6f1fb', color: '#185fa5' },
  sante: { bg: '#e1f5ee', color: '#0f6e56' },
  industrie: { bg: '#faeeda', color: '#854f0b' },
  commerce: { bg: '#eaf3de', color: '#3b6d11' },
  droit: { bg: '#eeedfe', color: '#533ab7' },
  education: { bg: '#fbeaf0', color: '#993556' },
  artisanat: { bg: '#f1efe8', color: '#5f5e5a' },
  transport: { bg: '#e6f1fb', color: '#185fa5' },
};

const pageStyles = {
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 4 },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 24 },
  searchWrap: { position: 'relative', marginBottom: 28 },
  searchIcon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 },
  searchInput: {
    width: '100%',
    padding: '11px 16px 11px 38px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1e293b',
  },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 60 },
  loading: { color: '#94a3b8' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: 14,
  },
};

export default function SpecialitiesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/specialites')
      .then((r) => setCategories(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter((category) =>
    category.label.toLowerCase().includes(search.toLowerCase()) ||
    (category.exemples || []).some((example) => example.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (category) => {
    navigate('/client/book', {
      state: {
        categorieId: category.id,
        categorieLabel: category.label,
      },
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div style={{ maxWidth: 960 }}>
          <h1 style={pageStyles.title}>Choisir une specialite</h1>
          <p style={pageStyles.subtitle}>
            Selectionnez un domaine pour trouver le professionnel qu&apos;il vous faut.
          </p>

          <div style={pageStyles.searchWrap}>
            <span style={pageStyles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher une specialite ou un metier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={pageStyles.searchInput}
            />
          </div>

          {loading ? (
            <p style={pageStyles.loading}>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p style={pageStyles.empty}>Aucune specialite trouvee pour "{search}"</p>
          ) : (
            <div style={pageStyles.grid}>
              {filtered.map((category) => {
                const theme = COLORS[category.id] || { bg: '#f1f5f9', color: '#475569' };

                return (
                  <div
                    key={category.id}
                    onClick={() => handleSelect(category)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSelect(category);
                    }}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '18px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = `2px solid ${theme.color}`;
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${theme.color}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '1.5px solid #e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 10,
                        background: theme.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                        marginBottom: 12,
                      }}
                    >
                      {category.icon}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '0 0 8px', lineHeight: 1.3 }}>
                      {category.label}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(category.exemples || []).slice(0, 3).map((example) => (
                        <span
                          key={example}
                          style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            background: theme.bg,
                            color: theme.color,
                            borderRadius: 20,
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
