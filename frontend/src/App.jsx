import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute.jsx';

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const LandingPage = lazy(() => import('./pages/public/LandingPage.jsx'));
const ClientSpacePage = lazy(() => import('./pages/public/ClientSpacePage.jsx'));

// Client Pages
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard.jsx'));
const SpecialitiesPage = lazy(() => import('./pages/client/SpecialitiesPage.jsx'));
const MyAppointments = lazy(() => import('./pages/client/MyAppointments.jsx'));
const BookAppointment = lazy(() => import('./pages/client/BookAppointment.jsx'));
const Profile = lazy(() => import('./pages/client/Profile.jsx'));
const Notifications = lazy(() => import('./pages/client/Notifications.jsx'));
const PaymentSuccess = lazy(() => import('./pages/client/PaymentSuccess.jsx'));

// Pro Pages
const ProDashboard = lazy(() => import('./pages/pro/ProDashboard.jsx'));
const ProPlanning = lazy(() => import('./pages/pro/ProPlanning.jsx'));
const ProClients = lazy(() => import('./pages/pro/ProClients.jsx'));
const ProServices = lazy(() => import('./pages/pro/ProServices.jsx'));
const ProStats = lazy(() => import('./pages/pro/ProStats.jsx'));
const ProRisks = lazy(() => import('./pages/pro/ProRisks.jsx'));
const ProProfile = lazy(() => import('./pages/pro/ProProfile.jsx'));
const ProNotifications = lazy(() => import('./pages/pro/ProNotifications.jsx'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminProfessionals = lazy(() => import('./pages/admin/AdminProfessionals.jsx'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments.jsx'));
const AdminStats = lazy(() => import('./pages/admin/AdminStats.jsx'));
const AdminConfig = lazy(() => import('./pages/admin/AdminConfig.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile.jsx'));

// Loading component
const PageLoader = memo(function PageLoader() {
  return (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Chargement...</span>
    </div>
  </div>
  );
});

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={false} pauseOnHover />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/espace-client" element={<ClientSpacePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/client/dashboard" element={<PrivateRoute roles={['client']}><ClientDashboard /></PrivateRoute>} />
            <Route path="/client/appointments" element={<PrivateRoute roles={['client']}><MyAppointments /></PrivateRoute>} />
            <Route path="/client/specialites" element={<PrivateRoute roles={['client']}><SpecialitiesPage /></PrivateRoute>} />
            <Route path="/client/book" element={<PrivateRoute roles={['client']}><BookAppointment /></PrivateRoute>} />
            <Route path="/client/profile" element={<PrivateRoute roles={['client']}><Profile /></PrivateRoute>} />
            <Route path="/client/notifications" element={<PrivateRoute roles={['client']}><Notifications /></PrivateRoute>} />
            <Route path="/client/payment-success" element={<PrivateRoute roles={['client']}><PaymentSuccess /></PrivateRoute>} />

            <Route path="/pro/dashboard" element={<PrivateRoute roles={['professional']}><ProDashboard /></PrivateRoute>} />
            <Route path="/pro/planning" element={<PrivateRoute roles={['professional']}><ProPlanning /></PrivateRoute>} />
            <Route path="/pro/clients" element={<PrivateRoute roles={['professional']}><ProClients /></PrivateRoute>} />
            <Route path="/pro/services" element={<PrivateRoute roles={['professional']}><ProServices /></PrivateRoute>} />
            <Route path="/pro/stats" element={<PrivateRoute roles={['professional']}><ProStats /></PrivateRoute>} />
            <Route path="/pro/profile" element={<PrivateRoute roles={['professional']}><ProProfile /></PrivateRoute>} />
            <Route path="/pro/notifications" element={<PrivateRoute roles={['professional']}><ProNotifications /></PrivateRoute>} />
            <Route path="/pro/risks" element={<PrivateRoute roles={['professional']}><ProRisks /></PrivateRoute>} />

            <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/professionals" element={<PrivateRoute roles={['admin']}><AdminProfessionals /></PrivateRoute>} />
            <Route path="/admin/appointments" element={<PrivateRoute roles={['admin']}><AdminAppointments /></PrivateRoute>} />
            <Route path="/admin/stats" element={<PrivateRoute roles={['admin']}><AdminStats /></PrivateRoute>} />
            <Route path="/admin/profile" element={<PrivateRoute roles={['admin']}><AdminProfile /></PrivateRoute>} />
            <Route path="/admin/config" element={<PrivateRoute roles={['admin']}><AdminConfig /></PrivateRoute>} />

            <Route path="/unauthorized" element={<h2 className="text-center mt-5">Acces refuse</h2>} />
            <Route path="*" element={<h2 className="text-center mt-5">404 - Page introuvable</h2>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
