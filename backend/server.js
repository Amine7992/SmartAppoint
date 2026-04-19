require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const compression = require('compression');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');
const cron    = require('node-cron');
const aiRoutes = require('./routes/ai');
const authRoutes              = require('./routes/auth');
const clientRoutes            = require('./routes/client');
const proRoutes               = require('./routes/pro');
const notificationsRoutes     = require('./routes/notifications');
const userRoutes              = require('./routes/users');
const appointmentRatingRouter = require('./routes/appointment');
const adminRoutes             = require('./routes/admin');
const { router: specialitesRoutes } = require('./routes/specialites');

const supabase = require('./config/supabase');
const { 
  cancelExpiredAppointments, 
  sendAppointmentReminders 
} = require('./services/appointmentService');

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
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api',              clientRoutes);
app.use('/api',              specialitesRoutes);
app.use('/api',              userRoutes);
app.use('/api',              notificationsRoutes);
app.use('/api/pro',          proRoutes);
app.use('/api/appointments', appointmentRatingRouter);
app.use('/api/admin',        adminLimiter, adminRoutes);
app.use('/api/ai',           aiRoutes);

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
        return { type: 'router' };
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

// ── CRON 1 : Annuler les RDVs expirés — toutes les 10 minutes ──
cron.schedule('*/10 * * * *', () => {
  console.log('CRON 1: Vérification des rendez-vous expirés...');
  cancelExpiredAppointments();
});

// ── CRON 2 : Rappels 2h avant le RDV — toutes les 15 minutes ──
cron.schedule('*/15 * * * *', () => {
  console.log('CRON 2: Vérification des rappels de rendez-vous...');
  sendAppointmentReminders();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(` Serveur SmartAppoint opérationnel sur le port ${PORT}`);
  console.log(`  Module Admin activé sur /api/admin`);
  console.log(`  Rappels automatiques activés (toutes les 15 min)`);

  // Run initial check for expired appointments on server start
  console.log('Running initial check for expired appointments');
  await cancelExpiredAppointments();
});