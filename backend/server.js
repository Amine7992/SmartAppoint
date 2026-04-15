require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const authRoutes              = require('./routes/auth');
const clientRoutes            = require('./routes/client');
const proRoutes               = require('./routes/pro');
const notificationsRoutes     = require('./routes/notifications');
const userRoutes              = require('./routes/users');
const appointmentRatingRouter = require('./routes/appointment');
const adminRoutes             = require('./routes/admin'); // 1. Importer les routes admin

const app = express();
const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const isLocalDevOrigin =
      process.env.NODE_ENV !== 'production' &&
      typeof origin === 'string' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || isLocalDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ADMIN_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes admin. Réessayez dans quelques minutes.' },
});

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api',              clientRoutes);
app.use('/api',              userRoutes);
app.use('/api',              notificationsRoutes);
app.use('/api/pro',          proRoutes);
app.use('/api/appointments', appointmentRatingRouter);
app.use('/api/admin',        adminLimiter, adminRoutes); // 2. Enregistrer avec le préfixe /api/admin

// ── Debug routes ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
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
          .replace('/^\\/api\\/admin\\/?(?=\\/|$)/i', '/api/admin')
          .replace('/^\\//i', '/');
        return {
          type:   'router',
          path_prefix: prefix,
        };
      })
    );
  });
}

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
  console.log(` Serveur SmartAppoint opérationnel sur le port ${PORT}`);
  console.log(`  Module Admin activé sur /api/admin`);
});
