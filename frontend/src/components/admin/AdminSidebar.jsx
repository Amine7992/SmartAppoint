import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calendar, BarChart2, Settings, LogOut, UserCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getAvatarSrc, getUserInitials } from '../../utils/avatar';
import MobileBottomNav from '../common/MobileBottomNav';
import '../common/Sidebar.css';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = getUserInitials(user, 'AD');
  const avatarSrc = getAvatarSrc(user);

  return (
    <>
    <aside className="admin-sidebar">
      {/* SECTION LOGO MISE À JOUR */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <img src="/logo2.png" alt="SmartAppoint" className="sidebar-logo" />
        </div>
        <div className="sidebar-brand-copy">
          <span className="sidebar-brand-title">SmartAppoint</span>
          <span className="brand-sub">Administration</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span>Vue globale</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} />
          <span>Utilisateurs</span>
        </NavLink>
        <NavLink to="/admin/professionals" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={17} />
          <span>Professionnels</span>
        </NavLink>
        <NavLink to="/admin/appointments" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={17} />
          <span>Rendez-vous</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-section-label">SYSTÈME</div>
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin/stats" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={17} />
          <span>Statistiques</span>
        </NavLink>
        <NavLink to="/admin/profile" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle2 size={17} />
          <span>Mon profil</span>
        </NavLink>
        <NavLink to="/admin/config" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={17} />
          <span>Configuration</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">
            {avatarSrc ? <img src={avatarSrc} alt={user?.name || 'Avatar'} /> : initials}
          </div>
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name || 'Admin'}</span>
            <span className="admin-user-role">Super admin</span>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} title="Déconnexion">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
    <MobileBottomNav role="admin" />
    </>
  );
};

export default AdminSidebar;
