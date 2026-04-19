import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Calendar, AlertCircle, Info, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import api from '../../api/axios';
import './Notifications.css';

// ── 1. Ajout de slot_available dans iconMap ──
const iconMap = {
  appointment:   <Calendar size={16} />,
  alert:         <AlertCircle size={16} />,
  info:          <Info size={16} />,
  slot_available: <CheckCircle size={16} />,   // ← nouveau
};

// ── 2. Ajout de slot_available dans colorMap ──
const colorMap = {
  appointment:   'notif-blue',
  alert:         'notif-orange',
  info:          'notif-gray',
  slot_available: 'notif-green',               // ← nouveau
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
};

const Notifications = () => {
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

  // ── 3. Nouvelle fonction : accepter le créneau libéré ──
  const handleTakeSlot = async (notif) => {
    if (!window.confirm(`Confirmer l'avancement à ${notif.freed_slot_time} ?`)) return;
    try {
      await api.post('/appointments/take-slot', {
        target_appointment_id: notif.target_appointment_id,
        freed_slot_date:       notif.freed_slot_date,
        freed_slot_time:       notif.freed_slot_time,
      });
      // Marquer la notification comme lue et actionnée
      await api.put(`/notifications/${notif.id}/read`);
      setNotifs((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read: true, actioned: true } : n
        )
      );
      alert('Votre rendez-vous a été avancé avec succès !');
    } catch (err) {
      alert('Erreur lors de la mise à jour.');
      console.error(err);
    }
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h1 className="page-title">Notifications</h1>
            {unreadCount > 0 && (
              <p className="notif-count">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={markAllRead}>
              <CheckCheck size={15} />
              Tout marquer comme lu
            </button>
          )}
        </header>

        <section className="notif-page notif-page-client">
          {loading ? (
            <p className="loading-text">Chargement...</p>
          ) : notifs.length === 0 ? (
            <div className="notif-empty">
              <Bell size={38} className="notif-empty-icon" />
              <p className="notif-empty-title">Aucune notification</p>
              <p className="notif-empty-sub">Vous serez notifié ici de vos rendez-vous et mises à jour.</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={`notif-card ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && n.type !== 'slot_available' && markOne(n.id)}
                >
                  <div className={`notif-icon-wrap ${colorMap[n.type] || 'notif-gray'}`}>
                    {iconMap[n.type] || <Info size={16} />}
                  </div>

                  <div className="notif-body">
                    <p className="notif-message">{n.message}</p>
                    <p className="notif-time">{timeAgo(n.created_at)}</p>

                    {/* ── 4. Bouton "Oui" uniquement pour slot_available non encore actionné ── */}
                    {n.type === 'slot_available' && !n.read && !n.actioned && (
                      <button
                        className="notif-take-slot-btn"
                        onClick={(e) => { e.stopPropagation(); handleTakeSlot(n); }}
                      >
                        ✅ Oui, avancer mon RDV
                      </button>
                    )}
                  </div>

                  {!n.read && <span className="notif-dot-unread" />}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Notifications;
