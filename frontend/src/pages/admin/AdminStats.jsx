import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, PieChart, Award } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../api/axios';
import './AdminStats.css';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSendNotifications = async () => {
    if (window.confirm("Envoyer le bilan fiscal à tous les professionnels pour ce mois ?")) {
      try {
        await api.post('/admin/notify-tax');
        alert("Notifications envoyées !");
      } catch (err) {
        alert("Erreur lors de l'envoi.");
      }
    }
  };

  useEffect(() => {
  api.get('/admin/stats/detailed')
    .then(response => {
      console.log("✅ Full Stats Data:", response.data);   // ← Check this in console
      setStats(response.data);
    })
    .catch(err => {
      console.error("❌ Stats API Error:", err.response?.data || err.message);
      setError("Failed to load stats");
    })
    .finally(() => setLoading(false));
}, []);

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <p className="admin-loading">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-main">
          <p className="admin-error">{error || "Impossible de charger les données."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="admin-page-title">Tableau de Bord Financier</h1>
            <p className="admin-subtitle">Surveillance des revenus et de la taxation fiscale</p>
          </div>
          <button className="admin-action-btn" type="button" onClick={handleSendNotifications}>
            Notifier les professionnels
          </button>
        </header>

        <div className="admin-stats-container">
          {/* KPI CARDS */}
          <div className="admin-stats-grid">
            <div className="admin-kpi-card glass">
              <div className="kpi-icon-wrap blue"><DollarSign size={24} /></div>
              <div className="kpi-info">
                <span>Volume d'Affaires Total</span>
                <h3>{(stats.total_volume || stats.totalRevenue || 0).toFixed(2)} <small>DT</small></h3>
              </div>
            </div>

            <div className="admin-kpi-card glass">
              <div className="kpi-icon-wrap green"><PieChart size={24} /></div>
              <div className="kpi-info">
                <span>Total Taxes Collectées</span>
                <h3 className="text-green">{(stats.total_tax_collected || 0).toFixed(2)} <small>DT</small></h3>
              </div>
            </div>

            <div className="admin-kpi-card glass">
              <div className="kpi-icon-wrap purple"><Users size={24} /></div>
              <div className="kpi-info">
                <span>Professionnels Actifs</span>
                <h3>{stats.pro_taxation_breakdown?.length || 0}</h3>
              </div>
            </div>
          </div>

          <div className="admin-grid-main">
            {/* DAILY REVENUE CURVE */}
            <div className="admin-panel chart-card">
              <h2 className="panel-title"><TrendingUp size={18} /> Évolution quotidienne des revenus (30j)</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.daily_revenue_curve || []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#26215C" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#26215C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => str?.split('-').slice(2).join('/') || ''} 
                      fontSize={11} 
                    />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenu" 
                      stroke="#26215C" 
                      strokeWidth={3} 
                      fill="url(#colorRev)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TAXATION TABLE */}
            <div className="admin-panel table-card">
              <h2 className="panel-title"><Award size={18} /> Détails de la Taxation par Professionnel</h2>
              <div className="admin-table-wrapper">
                <table className="admin-tax-table">
                  <thead>
                    <tr>
                      <th>Professionnel</th>
                      <th>Revenu Total</th>
                      <th>Palier Taxe</th>
                      <th>Montant Taxe</th>
                      <th>Montant Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.pro_taxation_breakdown || []).map((pro) => (
                      <tr key={pro.id}>
                        <td className="font-bold">{pro.name}</td>
                        <td>{(pro.totalRevenue || 0).toFixed(2)} DT</td>
                        <td>
                          <span className={`bracket-badge tier-${pro.rateLabel?.replace('%', '') || '0'}`}>
                            {pro.rateLabel || '0%'}
                          </span>
                        </td>
                        <td className="text-red">-{ (pro.taxAmount || 0).toFixed(2)} DT</td>
                        <td className="text-green font-bold">{(pro.netRevenue || 0).toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminStats;
