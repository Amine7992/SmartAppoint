import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Calendar, AlertCircle, Info } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import '../client/Notifications.css';

const iconMap = {
  appointment: <Calendar size={16} />,
  alert: <AlertCircle size={16} />,
  info: <Info size={16} />,
  success: <CheckCheck size={16} />,
};

const colorMap = {
  appointment: 'notif-blue',
  alert: 'notif-orange',
  info: 'notif-gray',
  success: 'notif-green',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "\u00C0 l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
};

const ProNotifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then((r) => setNotifs(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 ? (
              <p className="notif-count">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <button className="notif-mark-all" onClick={markAllRead}>
              <CheckCheck size={15} />
              Tout marquer comme lu
            </button>
          ) : null}
        </header>

        <section className="notif-page notif-page-pro">
          {loading ? (
            <p className="loading-text">Chargement...</p>
          ) : notifs.length === 0 ? (
            <div className="notif-empty">
              <Bell size={38} className="notif-empty-icon" />
              <p className="notif-empty-title">Aucune notification</p>
              <p className="notif-empty-sub">Vous serez notifi\u00E9 ici pour les rendez-vous, annulations et nouveaux avis.</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={`notif-card ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && markOne(n.id)}
                >
                  <div className={`notif-icon-wrap ${colorMap[n.type] || 'notif-gray'}`}>
                    {iconMap[n.type] || <Info size={16} />}
                  </div>
                  <div className="notif-body">
                    <p className="notif-message">{n.message}</p>
                    <p className="notif-time">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read ? <span className="notif-dot-unread" /> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProNotifications;
