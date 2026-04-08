require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes              = require('./routes/auth');
const clientRoutes            = require('./routes/client');
const proRoutes               = require('./routes/pro');
const notificationsRoutes     = require('./routes/notifications');
const userRoutes              = require('./routes/users');
const appointmentRatingRouter = require('./routes/appointment');
const adminRoutes             = require('./routes/admin'); // 1. Importer les routes admin

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              clientRoutes);
app.use('/api',              userRoutes);
app.use('/api',              notificationsRoutes);
app.use('/api/pro',          proRoutes);
app.use('/api/appointments', appointmentRatingRouter);
app.use('/api/admin',        adminRoutes); // 2. Enregistrer avec le préfixe /api/admin

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
      const prefix = layer.regexp.toString()
        .replace('/^\\/api\\/admin\\/?(?=\\/|$)/i', '/api/admin') // Lisibilité pour le debug
        .replace('/^\\//i', '/');
      return {
        type:   'router',
        path_prefix: prefix, 
      };
    })
  );
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Image trop lourde pour le serveur. Choisissez un fichier plus petit.',
    });
  }

  if (err) {
    console.error('Unhandled server error', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }

  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur SmartAppoint opérationnel sur le port ${PORT}`);
  console.log(`🛡️  Module Admin activé sur /api/admin`);
});
