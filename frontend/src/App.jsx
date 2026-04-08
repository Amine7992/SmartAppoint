import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute.jsx';

import Login    from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// ── Client ──────────────────────────────────────────────
import ClientDashboard from './pages/client/ClientDashboard.jsx';
import MyAppointments  from './pages/client/MyAppointments.jsx';
import BookAppointment from './pages/client/BookAppointment.jsx';
import Profile         from './pages/client/Profile.jsx';
import Notifications   from './pages/client/Notifications.jsx';

// ── Pro ─────────────────────────────────────────────────
import ProDashboard from './pages/pro/ProDashboard.jsx';
import ProPlanning  from './pages/pro/ProPlanning.jsx';
import ProClients   from './pages/pro/ProClients.jsx';
import ProServices  from './pages/pro/ProServices.jsx';
import ProStats     from './pages/pro/ProStats.jsx';
import ProRisks     from './pages/pro/ProRisks.jsx';

// ── Admin ────────────────────────────────────────────────
import AdminDashboard     from './pages/admin/AdminDashboard.jsx';
import AdminUsers         from './pages/admin/AdminUsers.jsx';
import AdminProfessionals from './pages/admin/AdminProfessionals.jsx';
import AdminAppointments  from './pages/admin/AdminAppointments.jsx';
import AdminStats         from './pages/admin/AdminStats.jsx';
import AdminConfig        from './pages/admin/AdminConfig.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <ToastContainer position="top-right" autoClose={false} pauseOnHover />

        <Routes>

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Client */}
          <Route path="/client/dashboard"     element={<PrivateRoute roles={['client']}><ClientDashboard /></PrivateRoute>} />
          <Route path="/client/appointments"  element={<PrivateRoute roles={['client']}><MyAppointments /></PrivateRoute>} />
          <Route path="/client/book"          element={<PrivateRoute roles={['client']}><BookAppointment /></PrivateRoute>} />
          <Route path="/client/profile"       element={<PrivateRoute roles={['client']}><Profile /></PrivateRoute>} />
          <Route path="/client/notifications" element={<PrivateRoute roles={['client']}><Notifications /></PrivateRoute>} />

          {/* Pro */}
          <Route path="/pro/dashboard" element={<PrivateRoute roles={['professional']}><ProDashboard /></PrivateRoute>} />
          <Route path="/pro/planning"  element={<PrivateRoute roles={['professional']}><ProPlanning /></PrivateRoute>} />
          <Route path="/pro/clients"   element={<PrivateRoute roles={['professional']}><ProClients /></PrivateRoute>} />
          <Route path="/pro/services"  element={<PrivateRoute roles={['professional']}><ProServices /></PrivateRoute>} />
          <Route path="/pro/stats"     element={<PrivateRoute roles={['professional']}><ProStats /></PrivateRoute>} />
          <Route path="/pro/risks"     element={<PrivateRoute roles={['professional']}><ProRisks /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard"     element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users"         element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/professionals" element={<PrivateRoute roles={['admin']}><AdminProfessionals /></PrivateRoute>} />
          <Route path="/admin/appointments"  element={<PrivateRoute roles={['admin']}><AdminAppointments /></PrivateRoute>} />
          <Route path="/admin/stats"         element={<PrivateRoute roles={['admin']}><AdminStats /></PrivateRoute>} />
          <Route path="/admin/config"        element={<PrivateRoute roles={['admin']}><AdminConfig /></PrivateRoute>} />

          {/* Erreurs */}
          <Route path="/unauthorized" element={<h2 className="text-center mt-5">Accès refusé</h2>} />
          <Route path="*"             element={<h2 className="text-center mt-5">404 — Page introuvable</h2>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
