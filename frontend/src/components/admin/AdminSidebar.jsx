import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calendar, BarChart2, Settings, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <span className="admin-brand-name">SmartAppoint</span>
        <span className="admin-brand-sub">Administration</span>
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
        <NavLink to="/admin/config" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={17} />
          <span>Configuration</span>
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">{initials}</div>
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
  );
};

export default AdminSidebar;
