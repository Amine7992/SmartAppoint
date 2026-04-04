import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProRisks.css';

const RiskBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const cls = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low';
  return (
    <div className="risk-bar-wrap">
      <div className="risk-bar-track">
        <div className={`risk-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`risk-pct ${cls}`}>{pct}%</span>
    </div>
  );
};

const ProRisks = () => {
  const [risks, setRisks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pro/appointments/risks');
      setRisks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRisks(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRisks();
    setRefreshing(false);
  };

  const high   = risks.filter(r => r.ai_score >= 0.7);
  const medium = risks.filter(r => r.ai_score >= 0.4 && r.ai_score < 0.7);
  const low    = risks.filter(r => r.ai_score < 0.4);

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <div>
            <h1 className="pro-page-title">IA — Risques d'absence</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
              Prédictions basées sur l'historique des patients
            </p>
          </div>
          <button className="pro-btn-primary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </header>

        {/* Summary cards */}
        <div className="risk-summary-grid">
          <div className="risk-summary-card high-card">
            <p className="risk-summary-label">Risque élevé</p>
            <p className="risk-summary-val">{high.length}</p>
            <p className="risk-summary-sub">≥ 70%</p>
          </div>
          <div className="risk-summary-card medium-card">
            <p className="risk-summary-label">Risque moyen</p>
            <p className="risk-summary-val">{medium.length}</p>
            <p className="risk-summary-sub">40% – 69%</p>
          </div>
          <div className="risk-summary-card low-card">
            <p className="risk-summary-label">Risque faible</p>
            <p className="risk-summary-val">{low.length}</p>
            <p className="risk-summary-sub">{'< 40%'}</p>
          </div>
        </div>

        {/* Table */}
        <div className="pro-panel">
          <div className="pro-panel-header">
            <h2 className="pro-panel-title">Prochains rendez-vous — Scores IA</h2>
          </div>

          {loading ? (
            <p className="pro-loading">Chargement…</p>
          ) : risks.length === 0 ? (
            <div className="pro-empty" style={{ padding: '40px 20px' }}>
              <AlertTriangle size={32} className="pro-empty-icon" />
              <p style={{ fontWeight: 600, color: '#374151' }}>Aucune prédiction disponible</p>
              <p>Les scores IA apparaîtront ici une fois le modèle entraîné.</p>
            </div>
          ) : (
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Score IA</th>
                  <th>Niveau</th>
                </tr>
              </thead>
              <tbody>
                {risks.sort((a, b) => b.ai_score - a.ai_score).map(r => {
                  const level = r.ai_score >= 0.7 ? 'high' : r.ai_score >= 0.4 ? 'medium' : 'low';
                  const labels = { high: 'Élevé', medium: 'Moyen', low: 'Faible' };
                  return (
                    <tr key={r.id}>
                      <td className="risk-client-name">{r.client_name}</td>
                      <td className="risk-date">{new Date(r.date).toLocaleDateString('fr-FR')} · {r.time}</td>
                      <td className="risk-service">{r.service}</td>
                      <td><RiskBar score={r.ai_score} /></td>
                      <td><span className={`risk-level-badge ${level}`}>{labels[level]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProRisks;
