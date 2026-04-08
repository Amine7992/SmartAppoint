require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes              = require('./routes/auth');
const clientRoutes            = require('./routes/client');
const proRoutes               = require('./routes/pro');
const notificationsRoutes     = require('./routes/notifications');
const userRoutes              = require('./routes/users');
const appointmentRatingRouter = require('./routes/appointment'); // ✅ nom cohérent

const app = express();
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              clientRoutes);
app.use('/api',              userRoutes);
app.use('/api',              notificationsRoutes);
app.use('/api/pro',          proRoutes);
app.use('/api/appointments', appointmentRatingRouter); // ✅ bonne variable + bon préfixe

// ── Debug routes ─────────────────────────────────────────
app.get('/__debug_routes', (req, res) => {
  res.json(app._router.stack
    .filter((layer) => layer.route || layer.name === 'router')
    .map((layer) => {
      if (layer.route) {
        return {
          type:    'route',
          path:    layer.route.path,
          methods: Object.keys(layer.route.methods),
        };
      }
      return {
        type:   'router',
        regexp: layer.regexp && layer.regexp.toString(),
      };
    })
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur SmartAppoint opérationnel sur le port ${PORT}`);
});