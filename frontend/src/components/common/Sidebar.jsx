import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Search, User, Bell, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AM';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-name">SmartAppoint</span>
        <span className="brand-sub">Espace client</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/client/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Tableau de bord</span>
        </NavLink>
        <NavLink to="/client/appointments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={18} />
          <span>Mes rendez-vous</span>
        </NavLink>
        <NavLink to="/client/book" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          <span>Trouver un pro</span>
        </NavLink>
      </nav>

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

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
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
  );
};

export default Sidebar;
