import { NavLink } from 'react-router-dom';
import {
  BarChart2,
  Briefcase,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Search,
  Settings,
  User,
  UserCircle2,
  Users,
} from 'lucide-react';
import './MobileBottomNav.css';

const navItems = {
  client: [
    { to: '/client/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { to: '/client/appointments', label: 'RDV', icon: CalendarDays },
    { to: '/client/specialites', label: 'Trouver', icon: Search },
    { to: '/client/profile', label: 'Profil', icon: User },
  ],
  professional: [
    { to: '/pro/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { to: '/pro/planning', label: 'Planning', icon: Calendar },
    { to: '/pro/clients', label: 'Clients', icon: Users },
    { to: '/pro/profile', label: 'Profil', icon: UserCircle2 },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/professionals', label: 'Pros', icon: Briefcase },
    { to: '/admin/config', label: 'Config', icon: Settings },
  ],
};

const MobileBottomNav = ({ role = 'client' }) => {
  const items = navItems[role] || navItems.client;

  return (
    <nav className={`mobile-bottom-nav mobile-bottom-nav-${role}`} aria-label="Navigation mobile">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `mobile-bottom-item ${isActive ? 'active' : ''}`}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
      {role === 'professional' ? (
        <NavLink to="/pro/stats" className={({ isActive }) => `mobile-bottom-item mobile-bottom-extra ${isActive ? 'active' : ''}`}>
          <BarChart2 size={20} />
          <span>Stats</span>
        </NavLink>
      ) : null}
    </nav>
  );
};

export default MobileBottomNav;
