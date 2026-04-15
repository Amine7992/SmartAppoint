import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProRisks.css';

const getRiskPercent = (score) => Math.round((Number(score) || 0) * 100);

const getRiskLevel = (score) => {
  const pct = getRiskPercent(score);
  if (pct >= 70) return 'high';
  if (pct >= 40) return 'medium';
  return 'low';
};

const RiskBar = ({ score }) => {
  const pct = getRiskPercent(score);
  const cls = getRiskLevel(score);

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
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const refreshAt = new Date();
      const res = await api.get('/pro/appointments/risks', {
        params: { refresh: refreshAt.getTime() },
        headers: { 'Cache-Control': 'no-cache' },
      });
      setRisks(res.data || []);
      setLastRefreshAt(refreshAt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRisks();
    setRefreshing(false);
  };

  const high = risks.filter((r) => getRiskLevel(r.ai_score) === 'high');
  const medium = risks.filter((r) => getRiskLevel(r.ai_score) === 'medium');
  const low = risks.filter((r) => getRiskLevel(r.ai_score) === 'low');

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <div>
            <h1 className="pro-page-title">IA - Risques d'absence</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
              Predictions basees sur l'historique des patients
            </p>
            {lastRefreshAt ? (
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0' }}>
                Dernier recalcul IA: {lastRefreshAt.toLocaleTimeString('fr-FR')}
              </p>
            ) : null}
          </div>
          <button className="pro-btn-primary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </header>

        <div className="risk-summary-grid">
          <div className="risk-summary-card high-card">
            <p className="risk-summary-label">Risque eleve</p>
            <p className="risk-summary-val">{high.length}</p>
            <p className="risk-summary-sub">= 70%</p>
          </div>
          <div className="risk-summary-card medium-card">
            <p className="risk-summary-label">Risque moyen</p>
            <p className="risk-summary-val">{medium.length}</p>
            <p className="risk-summary-sub">40% - 69%</p>
          </div>
          <div className="risk-summary-card low-card">
            <p className="risk-summary-label">Risque faible</p>
            <p className="risk-summary-val">{low.length}</p>
            <p className="risk-summary-sub">{'< 40%'}</p>
          </div>
        </div>

        <div className="pro-panel">
          <div className="pro-panel-header">
            <h2 className="pro-panel-title">Prochains rendez-vous - Scores IA</h2>
          </div>

          {loading ? (
            <p className="pro-loading">Chargement...</p>
          ) : risks.length === 0 ? (
            <div className="pro-empty" style={{ padding: '40px 20px' }}>
              <AlertTriangle size={32} className="pro-empty-icon" />
              <p style={{ fontWeight: 600, color: '#374151' }}>Aucune prediction disponible</p>
              <p>Les scores IA apparaitront ici une fois le modele entraine.</p>
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
                  <th>Recalcule</th>
                </tr>
              </thead>
              <tbody>
                {[...risks].sort((a, b) => b.ai_score - a.ai_score).map((r) => {
                  const level = getRiskLevel(r.ai_score);
                  const labels = { high: 'Eleve', medium: 'Moyen', low: 'Faible' };

                  return (
                    <tr key={r.id}>
                      <td className="risk-client-name">{r.client_name}</td>
                      <td className="risk-date">
                        {new Date(r.date).toLocaleDateString('fr-FR')} - {r.time}
                      </td>
                      <td className="risk-service">{r.service}</td>
                      <td><RiskBar score={r.ai_score} /></td>
                      <td><span className={`risk-level-badge ${level}`}>{labels[level]}</span></td>
                      <td className="risk-date">
                        {r.ai_generated_at
                          ? new Date(r.ai_generated_at).toLocaleTimeString('fr-FR')
                          : '-'}
                      </td>
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
