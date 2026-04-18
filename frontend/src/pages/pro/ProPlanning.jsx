import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, CheckCircle } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProPlanning.css';

const HOURS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
               '12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const DAYS_FR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const DAY_KEYS = [1, 2, 3, 4, 5, 6, 0];
const EMPTY_RANGE = { start: '08:00', end: '12:00' };

const getWeekDays = (baseDate) => {
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const StatusBadge = ({ status }) => {
  const map = {
    confirmed:  { label: 'Confirmé',   cls: 'badge-confirmed' },
    pending:    { label: 'En attente', cls: 'badge-pending'   },
    cancelled:  { label: 'Annulé',     cls: 'badge-cancelled' },
    completed:  { label: 'Terminé',    cls: 'badge-completed' },
  };
  const s = map[status?.toLowerCase()] || { label: status, cls: 'badge-pending' };
  return <span className={`plan-badge ${s.cls}`}>{s.label}</span>;
};

const ProPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [dayOffInput, setDayOffInput] = useState('');
  const [loading, setLoading] = useState(true);
  const weekDays = getWeekDays(currentDate);
  const now = new Date();

  useEffect(() => {
    Promise.all([api.get('/pro/appointments'), api.get('/pro/schedule')])
      .then(([appointmentsResponse, scheduleResponse]) => {
        setAppointments(appointmentsResponse.data || []);
        setSchedule(scheduleResponse.data || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleValidate = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'confirmed' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
    } catch (err) { console.error(err); }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) { console.error(err); }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/pro/appointments/${id}/complete`);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    } catch (err) { console.error(err); }
  };

  const isPast = (appt) => {
    const apptDateTime = new Date(`${appt.date}T${appt.time}`);
    return apptDateTime < now;
  };

  const monthLabel = weekDays[0].toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  // Confirmed past appointments that can be marked as completed
  const completable = appointments.filter(a =>
    a.status === 'confirmed' && isPast(a)
  );

  const updateWeeklyDay = (dayKey, updater) => {
    setSchedule((prev) => {
      const currentDay = prev?.weekly?.[dayKey] || { enabled: false, ranges: [] };
      return {
        ...prev,
        weekly: {
          ...prev.weekly,
          [dayKey]: updater(currentDay),
        },
      };
    });
  };

  const saveSchedule = async (nextSchedule = schedule) => {
    setScheduleSaving(true);
    try {
      const { data } = await api.put('/pro/schedule', nextSchedule);
      setSchedule(data);
    } catch (err) {
      console.error(err);
    } finally {
      setScheduleSaving(false);
    }
  };

  const addDayOff = async () => {
    if (!dayOffInput) return;
    const nextSchedule = {
      ...schedule,
      daysOff: [...new Set([...(schedule?.daysOff || []), dayOffInput])].sort(),
    };
    setSchedule(nextSchedule);
    setDayOffInput('');
    await saveSchedule(nextSchedule);
  };

  const removeDayOff = async (date) => {
    const nextSchedule = {
      ...schedule,
      daysOff: (schedule?.daysOff || []).filter((value) => value !== date),
    };
    setSchedule(nextSchedule);
    await saveSchedule(nextSchedule);
  };

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Planning</h1>
          <div className="pro-topbar-right">
            <button className="plan-nav-btn" onClick={prevWeek}><ChevronLeft size={16} /></button>
            <span className="plan-month-label">{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
            <button className="plan-nav-btn" onClick={nextWeek}><ChevronRight size={16} /></button>
          </div>
        </header>

        {/* Week grid */}
        <div className="pro-panel plan-grid-container">
          <div className="plan-grid">
            <div className="plan-time-col" />
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`plan-day-header ${isToday ? 'today' : ''}`}>
                  <span className="plan-day-name">{DAYS_FR[i]}</span>
                  <span className="plan-day-num">{d.getDate()}</span>
                </div>
              );
            })}

            {HOURS.map(hour => (
              <>
                <div key={`t-${hour}`} className="plan-time-label">{hour}</div>
                {weekDays.map((d, di) => {
                  const appt = appointments.find(a => {
                    const aDate = new Date(a.date);
                    return aDate.toDateString() === d.toDateString() && a.time === hour;
                  });
                  return (
                    <div key={`cell-${hour}-${di}`} className="plan-cell">
                      {appt && (
                        <div className={`plan-appt-block status-${appt.status}`}>
                          <p className="plan-appt-name">{appt.client_name}</p>
                          <p className="plan-appt-service">{appt.service}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {schedule && (
          <div className="pro-panel" style={{ marginTop: 20 }}>
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">Plages de travail et jours off</h2>
              <button className="plan-btn-validate" onClick={() => saveSchedule()} disabled={scheduleSaving}>
                <Check size={14} /> {scheduleSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            <div className="plan-settings">
              {DAY_KEYS.map((dayKey, index) => {
                const dayConfig = schedule.weekly?.[dayKey] || { enabled: false, ranges: [] };
                return (
                  <div key={dayKey} className="plan-settings-card">
                    <div className="plan-settings-head">
                      <strong>{DAYS_FR[index]}</strong>
                      <label className="plan-toggle">
                        <input
                          type="checkbox"
                          checked={Boolean(dayConfig.enabled)}
                          onChange={(e) => updateWeeklyDay(String(dayKey), (currentDay) => ({
                            ...currentDay,
                            enabled: e.target.checked,
                            ranges: currentDay.ranges?.length ? currentDay.ranges : [EMPTY_RANGE],
                          }))}
                        />
                        <span>Disponible</span>
                      </label>
                    </div>

                    <div className="plan-ranges">
                      {(dayConfig.ranges || []).map((range, rangeIndex) => (
                        <div key={`${dayKey}-${rangeIndex}`} className="plan-range-row">
                          <input
                            type="time"
                            value={range.start}
                            onChange={(e) => updateWeeklyDay(String(dayKey), (currentDay) => ({
                              ...currentDay,
                              ranges: currentDay.ranges.map((item, itemIndex) => itemIndex === rangeIndex ? { ...item, start: e.target.value } : item),
                            }))}
                          />
                          <span>a</span>
                          <input
                            type="time"
                            value={range.end}
                            onChange={(e) => updateWeeklyDay(String(dayKey), (currentDay) => ({
                              ...currentDay,
                              ranges: currentDay.ranges.map((item, itemIndex) => itemIndex === rangeIndex ? { ...item, end: e.target.value } : item),
                            }))}
                          />
                          <button
                            className="plan-btn-cancel"
                            onClick={() => updateWeeklyDay(String(dayKey), (currentDay) => ({
                              ...currentDay,
                              ranges: currentDay.ranges.filter((_, itemIndex) => itemIndex !== rangeIndex),
                            }))}
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      className="plan-nav-btn"
                      type="button"
                      onClick={() => updateWeeklyDay(String(dayKey), (currentDay) => ({
                        ...currentDay,
                        ranges: [...(currentDay.ranges || []), EMPTY_RANGE],
                      }))}
                    >
                      Ajouter une plage
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="plan-days-off">
              <h3 className="book-subtitle">Jours off</h3>
              <div className="plan-days-off-form">
                <input type="date" value={dayOffInput} onChange={(e) => setDayOffInput(e.target.value)} />
                <button className="plan-btn-cancel" type="button" onClick={addDayOff}>Ajouter</button>
              </div>
              <div className="plan-days-off-list">
                {(schedule.daysOff || []).length > 0 ? schedule.daysOff.map((date) => (
                  <button key={date} className="plan-day-off-chip" type="button" onClick={() => removeDayOff(date)}>
                    {date} <X size={12} />
                  </button>
                )) : <p className="pro-loading">Aucun jour off enregistre.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Pending appointments */}
        <div className="pro-panel" style={{ marginTop: 20 }}>
          <div className="pro-panel-header">
            <h2 className="pro-panel-title">Demandes en attente</h2>
          </div>
          {loading ? (
            <p className="pro-loading">Chargement…</p>
          ) : appointments.filter(a => a.status === 'pending').length === 0 ? (
            <div className="pro-empty">
              <p>Aucune demande en attente.</p>
            </div>
          ) : (
            <div className="plan-pending-list">
              {appointments.filter(a => a.status === 'pending').map(appt => (
                <div key={appt.id} className="plan-pending-card">
                  <div className="plan-pending-info">
                    <p className="plan-pending-name">{appt.client_name}</p>
                    <p className="plan-pending-detail">
                      {new Date(appt.date).toLocaleDateString('fr-FR')} · {appt.time} · {appt.service}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                  <div className="plan-pending-actions">
                    <button className="plan-btn-validate" onClick={() => handleValidate(appt.id)}>
                      <Check size={14} /> Valider
                    </button>
                    <button className="plan-btn-cancel" onClick={() => handleCancel(appt.id)}>
                      <X size={14} /> Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completable appointments */}
        {completable.length > 0 && (
          <div className="pro-panel" style={{ marginTop: 20 }}>
            <div className="pro-panel-header">
              <h2 className="pro-panel-title">À marquer comme terminés</h2>
            </div>
            <div className="plan-pending-list">
              {completable.map(appt => (
                <div key={appt.id} className="plan-pending-card">
                  <div className="plan-pending-info">
                    <p className="plan-pending-name">{appt.client_name}</p>
                    <p className="plan-pending-detail">
                      {new Date(appt.date).toLocaleDateString('fr-FR')} · {appt.time} · {appt.service}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                  <div className="plan-pending-actions">
                    <button className="plan-btn-complete" onClick={() => handleComplete(appt.id)}>
                      <CheckCircle size={14} /> Terminer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProPlanning;
