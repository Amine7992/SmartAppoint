require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const compression = require('compression');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');
const cron    = require('node-cron');

// Routes
const aiRoutes = require('./routes/ai');
const authRoutes              = require('./routes/auth');
const clientRoutes            = require('./routes/client');
const proRoutes               = require('./routes/pro');
const notificationsRoutes     = require('./routes/notifications');
const userRoutes              = require('./routes/users');
const appointmentRatingRouter = require('./routes/appointment');
const adminRoutes             = require('./routes/admin');
const { router: specialitesRoutes } = require('./routes/specialites');

// Services
const supabase = require('./config/supabase');
const { 
  cancelExpiredAppointments, 
  sendAppointmentReminders 
} = require('./services/appointmentService');

const app = express();

// CORS Configuration
const normalizeOrigin = (value) => String(value || '')
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .replace(/\/+$/, '');

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const isLocalDevOrigin =
      process.env.NODE_ENV !== 'production' &&
      typeof origin === 'string' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

    const normalizedOrigin = normalizeOrigin(origin);

    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin) || isLocalDevOrigin) {
      return callback(null, true);
    }
    const error = new Error('Origine non autorisee par CORS');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
};

// Rate Limiters
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

// Middleware
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'smartappoint-backend' });
});

// API Routes
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api',              clientRoutes);
app.use('/api',              specialitesRoutes);
app.use('/api',              userRoutes);
app.use('/api',              notificationsRoutes);
app.use('/api/pro',          proRoutes);
app.use('/api/appointments', appointmentRatingRouter);
app.use('/api/admin',        adminLimiter, adminRoutes);
app.use('/api/ai',           aiRoutes);

// Debug Route
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

// Global Error Handler
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Image trop lourde pour le serveur. Choisissez un fichier plus petit.',
    });
  }
  if (err?.statusCode === 403) {
    return res.status(403).json({ error: err.message });
  }
  if (err) {
    console.error('Unhandled server error', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
  next();
});

// CRON JOBS
// 1: Cancel expired appointments (every 10 min)
cron.schedule('*/10 * * * *', () => {
  console.log('CRON 1: Vérification des rendez-vous expirés...');
  cancelExpiredAppointments();
});

// 2: Send reminders (every 15 min)
cron.schedule('*/15 * * * *', () => {
  console.log('CRON 2: Vérification des rappels de rendez-vous...');
  sendAppointmentReminders();
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n🚀 Serveur SmartAppoint opérationnel sur le port ${PORT}`);
  console.log(`✅ Module Admin activé sur /api/admin`);
  console.log(`✅ Rappels automatiques activés (toutes les 15 min)`);

  // Initial check
  console.log('Running initial check for expired appointments...');
  await cancelExpiredAppointments();
});

