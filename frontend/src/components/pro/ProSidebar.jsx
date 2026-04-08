import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Briefcase, BarChart2, AlertTriangle, LogOut } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import './ProSidebar.css';

const ProSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PR';

  return (
    <aside className="pro-sidebar">
      <div className="pro-sidebar-brand">
        <span className="pro-brand-name">SmartAppoint</span>
        <span className="pro-brand-sub">Espace pro</span>
      </div>

      <nav className="pro-sidebar-nav">
        <NavLink to="/pro/dashboard" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={17} />
          <span>Tableau de bord</span>
        </NavLink>
        <NavLink to="/pro/planning" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <Calendar size={17} />
          <span>Planning</span>
        </NavLink>
        <NavLink to="/pro/clients" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={17} />
          <span>Mes clients</span>
        </NavLink>
        <NavLink to="/pro/services" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={17} />
          <span>Mes services</span>
        </NavLink>
      </nav>

      <div className="pro-sidebar-section-label">ANALYSE</div>
      <nav className="pro-sidebar-nav">
        <NavLink to="/pro/stats" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={17} />
          <span>Statistiques</span>
        </NavLink>
        <NavLink to="/pro/risks" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={17} />
          <span>IA — Risques</span>
        </NavLink>
      </nav>

      <div className="pro-sidebar-footer">
        <div className="pro-sidebar-user">
          <div className="pro-user-avatar">{initials}</div>
          <div className="pro-user-info">
            <span className="pro-user-name">{user?.name }</span>
            <span className="pro-user-role">{user?.specialty }</span>
          </div>
        </div>
        <button className="pro-logout-btn" onClick={handleLogout} title="Déconnexion">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};

export default ProSidebar;
