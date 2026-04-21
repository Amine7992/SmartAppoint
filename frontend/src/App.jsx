import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
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

// Page Transition Wrapper
const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

const PageWrapper = memo(({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="framer-page-wrapper"
    >
      {children}
    </motion.div>
  );
});

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/espace-client" element={<PageWrapper><ClientSpacePage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

        <Route path="/client/dashboard" element={<PrivateRoute roles={['client']}><PageWrapper><ClientDashboard /></PageWrapper></PrivateRoute>} />
        <Route path="/client/appointments" element={<PrivateRoute roles={['client']}><PageWrapper><MyAppointments /></PageWrapper></PrivateRoute>} />
        <Route path="/client/specialites" element={<PrivateRoute roles={['client']}><PageWrapper><SpecialitiesPage /></PageWrapper></PrivateRoute>} />
        <Route path="/client/book" element={<PrivateRoute roles={['client']}><PageWrapper><BookAppointment /></PageWrapper></PrivateRoute>} />
        <Route path="/client/profile" element={<PrivateRoute roles={['client']}><PageWrapper><Profile /></PageWrapper></PrivateRoute>} />
        <Route path="/client/notifications" element={<PrivateRoute roles={['client']}><PageWrapper><Notifications /></PageWrapper></PrivateRoute>} />
        <Route path="/client/payment-success" element={<PrivateRoute roles={['client']}><PageWrapper><PaymentSuccess /></PageWrapper></PrivateRoute>} />

        <Route path="/pro/dashboard" element={<PrivateRoute roles={['professional']}><PageWrapper><ProDashboard /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/planning" element={<PrivateRoute roles={['professional']}><PageWrapper><ProPlanning /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/clients" element={<PrivateRoute roles={['professional']}><PageWrapper><ProClients /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/services" element={<PrivateRoute roles={['professional']}><PageWrapper><ProServices /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/stats" element={<PrivateRoute roles={['professional']}><PageWrapper><ProStats /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/profile" element={<PrivateRoute roles={['professional']}><PageWrapper><ProProfile /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/notifications" element={<PrivateRoute roles={['professional']}><PageWrapper><ProNotifications /></PageWrapper></PrivateRoute>} />
        <Route path="/pro/risks" element={<PrivateRoute roles={['professional']}><PageWrapper><ProRisks /></PageWrapper></PrivateRoute>} />

        <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminDashboard /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminUsers /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/professionals" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminProfessionals /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/appointments" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminAppointments /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/stats" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminStats /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/profile" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminProfile /></PageWrapper></PrivateRoute>} />
        <Route path="/admin/config" element={<PrivateRoute roles={['admin']}><PageWrapper><AdminConfig /></PageWrapper></PrivateRoute>} />

        <Route path="/unauthorized" element={<PageWrapper><h2 className="text-center mt-5">Acces refuse</h2></PageWrapper>} />
        <Route path="*" element={<PageWrapper><h2 className="text-center mt-5">404 - Page introuvable</h2></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={false} pauseOnHover />
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
