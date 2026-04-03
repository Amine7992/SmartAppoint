import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ClientDashboard from './pages/client/ClientDashboard.jsx';
import MyAppointments  from './pages/client/MyAppointments.jsx';
import BookAppointment from './pages/client/BookAppointment.jsx';
import Profile         from './pages/client/Profile.jsx';
import Notifications   from './pages/client/Notifications.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 🔒 Dashboard client protégé */}
          <Route
            path="/client/dashboard"
            element={
              <PrivateRoute roles={['client']}>
                <ClientDashboard />
              </PrivateRoute>
            }
          />

          {/* 🔒 Pages client */}
          <Route path="/client/appointments"  element={<PrivateRoute roles={['client']}><MyAppointments /></PrivateRoute>} />
          <Route path="/client/book"          element={<PrivateRoute roles={['client']}><BookAppointment /></PrivateRoute>} />
          <Route path="/client/profile"       element={<PrivateRoute roles={['client']}><Profile /></PrivateRoute>} />
          <Route path="/client/notifications" element={<PrivateRoute roles={['client']}><Notifications /></PrivateRoute>} />

          {/* autres dashboards (optionnel) */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute roles={['admin']}>
                <h2>Admin Dashboard</h2>
              </PrivateRoute>
            }
          />

          <Route
            path="/pro/dashboard"
            element={
              <PrivateRoute roles={['professional']}>
                <h2>Pro Dashboard</h2>
              </PrivateRoute>
            }
          />

          {/* erreurs */}
          <Route path="/unauthorized" element={<h2 className="text-center mt-5">Accès refusé</h2>} />
          <Route path="*" element={<h2 className="text-center mt-5">404 — Page introuvable</h2>} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
