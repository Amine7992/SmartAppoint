import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Search, User, Bell, LogOut, HelpCircle, X, Mail, Phone } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getAvatarSrc, getUserInitials } from '../../utils/avatar';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [supportOpen, setSupportOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = getUserInitials(user, 'CL');
  const avatarSrc = getAvatarSrc(user);

  return (
    <>
      <aside className="sidebar">
        {/* LOGO */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <img src="/logo2.png" alt="SmartAppoint" className="sidebar-logo" />
          </div>
          <div className="sidebar-brand-copy">
            <span className="sidebar-brand-title">SmartAppoint</span>
            <span className="brand-sub">Espace client</span>
          </div>
        </div>

        {/* NAV PRINCIPAL */}
        <nav className="sidebar-nav">
          <NavLink to="/client/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Tableau de bord</span>
          </NavLink>
          <NavLink to="/client/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays size={18} />
            <span>Mes rendez-vous</span>
          </NavLink>
          <NavLink to="/client/specialites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Search size={18} />
            <span>Trouver un pro</span>
          </NavLink>
        </nav>

        {/* COMPTE */}
        <div className="sidebar-section-label">COMPTE</div>
        <nav className="sidebar-nav">
          <NavLink to="/client/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={18} />
            <span>Mon profil</span>
          </NavLink>
          <NavLink to="/client/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Bell size={18} />
            <span>Notifications</span>
          </NavLink>
        </nav>

        {/* SUPPORT */}
        <div className="sidebar-section-label">SUPPORT</div>
        <nav className="sidebar-nav">
          <button
            className="nav-item support-btn"
            onClick={() => setSupportOpen(true)}
          >
            <HelpCircle size={18} />
            <span>Aide &amp; Support</span>
          </button>
        </nav>

        {/* FOOTER USER */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {avatarSrc ? <img src={avatarSrc} alt={user?.name || 'Avatar'} /> : initials}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Ahmed M.'}</span>
              <span className="user-role">Client</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ===== PANNEAU SUPPORT ===== */}
      {supportOpen && (
        <div className="support-overlay" onClick={() => setSupportOpen(false)}>
          <div className="support-panel" onClick={e => e.stopPropagation()}>

            <button className="support-close" onClick={() => setSupportOpen(false)} title="Fermer">
              <X size={17} />
            </button>

            <div className="support-icon-wrap">
              <HelpCircle size={34} />
            </div>

            <h2 className="support-title">Besoin d'aide ?</h2>
            <p className="support-subtitle">
              Notre équipe est disponible pour répondre à toutes vos questions.
              Contactez-nous via l'un des canaux ci-dessous.
            </p>

            <div className="support-contacts">
              <a href="mailto:support@smartappoint.dz" className="support-contact-item">
                <div className="support-contact-icon">
                  <Mail size={18} />
                </div>
                <div className="support-contact-info">
                  <span className="support-contact-label">Email</span>
                  <span className="support-contact-value">supportsmartappoint@gmail.com</span>
                </div>
              </a>

              <a href="tel:+21321000000" className="support-contact-item">
                <div className="support-contact-icon">
                  <Phone size={18} />
                </div>
                <div className="support-contact-info">
                  <span className="support-contact-label">Téléphone fixe</span>
                  <span className="support-contact-value">+216 77 142 222</span>
                </div>
              </a>
            </div>

            <p className="support-hours">
              Disponible du <strong>Lundi au Vendredi</strong>, 9h – 17h
            </p>

          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
