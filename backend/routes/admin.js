const express = require('express');
const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const supabase = require('../config/supabase');
const {
  getAdminStats,
  getDetailedStats,
  getProfessionals,
  updateProfessionalStatus,
  getAdminUsers,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAdminAppointments,
  getAdminActivity,
  getAdminConfig,
  saveAdminConfig,
  buildAdminReportData,
} = require('../services/adminService');
const { buildPdfBuffer } = require('../utils/adminReport');

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    res.json(await getAdminStats());
  } catch (error) {
    console.error('GET /api/admin/stats', error);
    res.status(500).json({ error: 'Impossible de recuperer les statistiques admin' });
  }
});

router.get('/stats/detailed', async (req, res) => {
  try {
    // 1. Get base stats from service
    const baseStats = await getDetailedStats();

    // 2. Calculate Admin Revenue and Taxation
    const { data: appts, error } = await supabase
      .from('Appointment')
      .select('service_id, payment_status, created_at, date_heure')
      .eq('payment_status', 'paid');

    if (error) throw error;

    // Fetch config for taxation (default 10% if not set)
    const config = await getAdminConfig();
    const taxRate = (config.commission_rate || 10) / 100;

    const { data: services } = await supabase.from('Service').select('id, prix');
    const priceMap = Object.fromEntries((services || []).map(s => [s.id, s.prix || 0]));

    const revenueByMonth = {};
    let totalPlatformRevenue = 0;

    appts.forEach(appt => {
      const d = new Date(appt.date_heure);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const price = priceMap[appt.service_id] || 0;
      const taxAmount = price * taxRate;

      revenueByMonth[monthKey] = revenueByMonth[monthKey] || { total: 0, tax: 0 };
      revenueByMonth[monthKey].total += price;
      revenueByMonth[monthKey].tax += taxAmount;
      totalPlatformRevenue += taxAmount;
    });

    const revenueStats = Object.entries(revenueByMonth).map(([month, data]) => ({
      month,
      revenue: data.total,
      commission: data.tax
    })).sort((a, b) => a.month > b.month ? 1 : -1);

    res.json({
      ...baseStats,
      revenue_history: revenueStats,
      total_platform_commission: totalPlatformRevenue,
      tax_rate_percent: taxRate * 100
    });
  } catch (error) {
    console.error('GET /api/admin/stats/detailed', error);
    res.status(200).json({
      total_volume: 0,
      total_tax_collected: 0,
      pro_taxation_breakdown: [],
      daily_revenue_curve: []
    });
  }
});

// POST /api/admin/notify-tax
// Triggered by Admin to send monthly summaries to all PROs
router.post('/notify-tax', async (req, res) => {
  try {
    const result = await notifyAllProsOfTax();
    res.json({ 
      message: `Notifications envoyées avec succès à ${result.notifiedCount} professionnels.`,
      count: result.notifiedCount 
    });
  } catch (error) {
    console.error('Error sending tax notifications:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi des notifications' });
  }
});

router.get('/professionals', async (req, res) => {
  try {
    res.json(await getProfessionals());
  } catch (error) {
    console.error('GET /api/admin/professionals', error);
    res.status(500).json({ error: 'Impossible de recuperer les professionnels' });
  }
});

router.get('/professionals/pending', async (req, res) => {
  try {
    res.json(await getProfessionals('pending'));
  } catch (error) {
    console.error('GET /api/admin/professionals/pending', error);
    res.status(500).json({ error: 'Impossible de recuperer les professionnels en attente' });
  }
});

router.put('/professionals/:id/validate', async (req, res) => {
  try {
    res.json(await updateProfessionalStatus(req.params.id, 'validate'));
  } catch (error) {
    console.error('PUT /api/admin/professionals/:id/validate', error);
    res.status(error?.statusCode || 500).json({ error: error?.message || 'Impossible de valider ce professionnel' });
  }
});

router.put('/professionals/:id/reject', async (req, res) => {
  try {
    res.json(await updateProfessionalStatus(req.params.id, 'reject'));
  } catch (error) {
    console.error('PUT /api/admin/professionals/:id/reject', error);
    res.status(error?.statusCode || 500).json({ error: error?.message || 'Impossible de suspendre ce professionnel' });
  }
});

router.put('/professionals/:id/reactivate', async (req, res) => {
  try {
    res.json(await updateProfessionalStatus(req.params.id, 'reactivate'));
  } catch (error) {
    console.error('PUT /api/admin/professionals/:id/reactivate', error);
    res.status(error?.statusCode || 500).json({ error: error?.message || 'Impossible de reactiver ce professionnel' });
  }
});

router.put('/professionals/:id/unvalidate', async (req, res) => {
  try {
    res.json(await updateProfessionalStatus(req.params.id, 'unvalidate'));
  } catch (error) {
    console.error('PUT /api/admin/professionals/:id/unvalidate', error);
    res.status(error?.statusCode || 500).json({ error: error?.message || 'Impossible de retirer la validation de ce professionnel' });
  }
});

router.get('/users', async (req, res) => {
  try {
    res.json(await getAdminUsers());
  } catch (error) {
    console.error('GET /api/admin/users', error);
    res.status(500).json({ error: 'Impossible de recuperer les utilisateurs' });
  }
});

router.put('/users/:id/suspend', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Un admin ne peut pas suspendre son propre compte' });
    }

    res.json(await suspendUser(req.params.id));
  } catch (error) {
    console.error('PUT /api/admin/users/:id/suspend', error);
    res.status(500).json({ error: 'Impossible de suspendre cet utilisateur' });
  }
});

router.put('/users/:id/unsuspend', async (req, res) => {
  try {
    res.json(await unsuspendUser(req.params.id));
  } catch (error) {
    console.error('PUT /api/admin/users/:id/unsuspend', error);
    res.status(500).json({ error: 'Impossible d annuler la suspension de cet utilisateur' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Un admin ne peut pas se supprimer lui-meme' });
    }

    res.json(await deleteUser(req.params.id));
  } catch (error) {
    console.error('DELETE /api/admin/users/:id', error);
    res.status(500).json({ error: 'Impossible de supprimer cet utilisateur' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    res.json(await getAdminAppointments());
  } catch (error) {
    console.error('GET /api/admin/appointments', error);
    res.status(500).json({ error: 'Impossible de recuperer les rendez-vous' });
  }
});

router.get('/activity', async (req, res) => {
  try {
    res.json(await getAdminActivity());
  } catch (error) {
    console.error('GET /api/admin/activity', error);
    res.status(500).json({ error: 'Impossible de recuperer l activite recente' });
  }
});

router.get('/config', async (req, res) => {
  try {
    res.json(await getAdminConfig());
  } catch (error) {
    console.error('GET /api/admin/config', error);
    res.status(500).json({ error: 'Impossible de recuperer la configuration admin' });
  }
});

router.put('/config', async (req, res) => {
  try {
    res.json(await saveAdminConfig(req.body || {}));
  } catch (error) {
    console.error('PUT /api/admin/config', error);
    res.status(500).json({ error: 'Impossible d enregistrer la configuration admin' });
  }
});

router.get('/report', async (req, res) => {
  try {
    const report = await buildAdminReportData();
    const buffer = buildPdfBuffer(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="smartappoint-rapport-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error('GET /api/admin/report', error);
    res.status(500).json({ error: 'Impossible de generer le rapport admin' });
  }
});

module.exports = router;
