import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Briefcase, BarChart2, AlertTriangle, Bell, LogOut, UserCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getAvatarSrc, getUserInitials } from '../../utils/avatar';
import VerificationBadge from '../common/VerificationBadge';
import './ProSidebar.css';

const ProSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = getUserInitials(user, 'PR');
  const avatarSrc = getAvatarSrc(user);

  return (
    <aside className="pro-sidebar">
      <div className="pro-sidebar-brand">
        <div className="pro-sidebar-brand-mark">
          <img src="/logo2.png" alt="SmartAppoint" className="pro-sidebar-logo" />
        </div>
        <div className="pro-sidebar-brand-copy">
          <span className="pro-sidebar-brand-title">SmartAppoint</span>
          <span className="pro-brand-sub">Espace pro</span>
        </div>
      </div>

      <nav className="pro-sidebar-nav">
        <NavLink to="/pro/dashboard" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><LayoutDashboard size={17} /><span>Tableau de bord</span></NavLink>
        <NavLink to="/pro/planning" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><Calendar size={17} /><span>Planning</span></NavLink>
        <NavLink to="/pro/clients" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><Users size={17} /><span>Mes clients</span></NavLink>
        <NavLink to="/pro/services" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><Briefcase size={17} /><span>Mes services</span></NavLink>
      </nav>

      <div className="pro-sidebar-section-label">ANALYSE</div>

      <nav className="pro-sidebar-nav">
        <NavLink to="/pro/stats" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><BarChart2 size={17} /><span>Statistiques</span></NavLink>
        <NavLink to="/pro/profile" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><UserCircle2 size={17} /><span>Mon profil</span></NavLink>
        <NavLink to="/pro/notifications" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><Bell size={17} /><span>Notifications</span></NavLink>
        <NavLink to="/pro/risks" className={({ isActive }) => `pro-nav-item ${isActive ? 'active' : ''}`}><AlertTriangle size={17} /><span>IA - Risques</span></NavLink>
      </nav>

      <div className="pro-sidebar-footer">
        <div className="pro-sidebar-user">
          <div className="pro-user-avatar">
            {avatarSrc ? <img src={avatarSrc} alt={user?.name || 'Avatar'} /> : initials}
          </div>
          <div className="pro-user-info">
            <div className="pro-user-name-row">
              <span className="pro-user-name">{user?.name}</span>
              <VerificationBadge verified={Boolean(user?.verified || ['validated', 'valide'].includes(String(user?.validation || user?.status || '').toLowerCase()))} compact />
            </div>
            <span className="pro-user-role">{user?.specialty}</span>
          </div>
        </div>

        <button className="pro-logout-btn" onClick={handleLogout} title="Deconnexion">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};

export default ProSidebar;
