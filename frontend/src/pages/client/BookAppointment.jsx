import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft, Check, MapPin, Star, Clock } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import UserAvatar from '../../components/common/UserAvatar';
import api from '../../api/axios';
import './BookAppointment.css';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const getNextDays = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

const StepIndicator = ({ current }) => (
  <div className="step-indicator">
    {['Choisir un pro', 'Choisir un service', 'Date & heure'].map((label, i) => {
      const idx = i + 1;
      const done = idx < current;
      const active = idx === current;
      return (
        <div key={i} className="step-item">
          <div className={`step-circle ${done ? 'done' : active ? 'active' : ''}`}>
            {done ? <Check size={13} /> : idx}
          </div>
          <span className={`step-label ${active ? 'active' : done ? 'done' : ''}`}>{label}</span>
          {i < 2 && <div className={`step-line ${done ? 'done' : ''}`} />}
        </div>
      );
    })}
  </div>
);

/* ─── Step 1 : choisir un pro ─── */
const Step1 = ({ onSelect }) => {
  const [pros, setPros] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/professionals')
      .then(r => setPros(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = pros.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="book-step">
      <div className="book-search-bar">
        <Search size={16} className="book-search-icon" />
        <input
          className="book-search-input"
          placeholder="Rechercher un professionnel ou une spécialité…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="loading-text">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="loading-text">Aucun résultat trouvé.</p>
      ) : (
        <div className="pros-grid">
          {filtered.map(pro => (
            <div key={pro.id} className="pro-card" onClick={() => onSelect(pro)}>
              <UserAvatar user={pro} fallback="PR" className="pro-card-avatar" style={{ background: '#1a5276' }} />
              <div className="pro-card-info">
                <p className="pro-card-name">{pro.name}</p>
                <p className="pro-card-specialty">{pro.specialty}</p>
                {pro.city && (
                  <p className="pro-card-city">
                    <MapPin size={11} /> {pro.city}
                  </p>
                )}
                <p className="pro-card-rating">
                  <Star size={11} fill={Number(pro.rating) > 0 ? "#f0a500" : "none"} color="#f0a500" />
                  {Number(pro.rating) > 0 ? ` ${pro.rating}` : ""}
                </p>
              </div>
              <ChevronRight size={16} className="pro-card-arrow" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Step 2 : choisir un service ─── */
const Step2 = ({ pro, onSelect, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/professionals/${pro.id}/services`)
      .then(r => setServices(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pro.id]);

  return (
    <div className="book-step">
      <div className="book-selected-pro">
        <UserAvatar user={pro} fallback="PR" className="pro-mini-avatar" style={{ background: '#1a5276' }} />
        <div>
          <p className="pro-mini-name">{pro.name}</p>
          <p className="pro-mini-spec">{pro.specialty}</p>
        </div>
      </div>

      <h3 className="book-subtitle">Choisissez un service</h3>

      {loading ? (
        <p className="loading-text">Chargement…</p>
      ) : services.length === 0 ? (
        <p className="loading-text">Aucun service disponible.</p>
      ) : (
        <div className="services-list">
          {services.map(svc => (
            <div key={svc.id} className="service-card" onClick={() => onSelect(svc)}>
              <div className="service-info">
                <p className="service-name">{svc.name}</p>
                {svc.description && <p className="service-desc">{svc.description}</p>}
                <div className="service-meta">
                  <Clock size={12} /> <span>{svc.duration} min</span>
                  {svc.price && <span className="service-price">{svc.price} DT</span>}
                </div>
              </div>
              <ChevronRight size={16} className="pro-card-arrow" />
            </div>
          ))}
        </div>
      )}

      <button className="btn-back" onClick={onBack}>
        <ChevronLeft size={15} /> Retour
      </button>
    </div>
  );
};

/* ─── Step 3 : date & heure ─── */
const Step3 = ({ pro, service, onConfirm, onBack, loading }) => {
  const days = getNextDays();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [takenSlots, setTakenSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const handleDaySelect = async (d) => {
    setSelectedDay(d);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const dateStr = d.toISOString().split('T')[0];
      const res = await api.get(`/professionals/${pro.id}/slots?date=${dateStr}`);
      setTakenSlots(res.data || []);
    } catch (err) {
      console.error(err);
      setTakenSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  return (
    <div className="book-step">
      <div className="book-recap-header">
        <div>
          <p className="recap-pro">{pro.name}</p>
          <p className="recap-service">{service.name} · {service.duration} min{service.price ? ` · ${service.price} DT` : ''}</p>
        </div>
      </div>

      <h3 className="book-subtitle">Choisissez une date</h3>
      <div className="days-scroll">
        {days.map((d, i) => {
          const isSelected = selectedDay?.toDateString() === d.toDateString();
          const isToday = i === 0;
          return (
            <button
              key={i}
              className={`day-btn ${isSelected ? 'active' : ''}`}
              onClick={() => handleDaySelect(d)}
            >
              <span className="day-name">{DAYS_FR[d.getDay()]}</span>
              <span className="day-num">{d.getDate()}</span>
              {isToday && <span className="day-today-dot" />}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <>
          <h3 className="book-subtitle" style={{ marginTop: 20 }}>Choisissez un créneau</h3>
          {loadingSlots ? (
            <p className="loading-text">Chargement des créneaux…</p>
          ) : (
            <div className="slots-grid">
              {SLOTS.map(slot => {
                const isTaken = takenSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    className={`slot-btn ${selectedSlot === slot ? 'active' : ''} ${isTaken ? 'taken' : ''}`}
                    onClick={() => !isTaken && setSelectedSlot(slot)}
                    disabled={isTaken}
                    title={isTaken ? 'Créneau déjà réservé' : ''}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {selectedDay && selectedSlot && (
        <div className="book-confirm-section">
          <div className="book-summary">
            <p><strong>Pro :</strong> {pro.name}</p>
            <p><strong>Service :</strong> {service.name}</p>
            <p><strong>Date :</strong> {selectedDay.getDate()} {MONTHS_FR[selectedDay.getMonth()]} {selectedDay.getFullYear()}</p>
            <p><strong>Heure :</strong> {selectedSlot}</p>
          </div>
          <button
            className="btn-confirm"
            disabled={loading}
            onClick={() => onConfirm({ date: selectedDay, time: selectedSlot })}
          >
            {loading ? 'Confirmation…' : 'Confirmer le rendez-vous'}
          </button>
        </div>
      )}

      <button className="btn-back" onClick={onBack}>
        <ChevronLeft size={15} /> Retour
      </button>
    </div>
  );
};

/* ─── Main component ─── */
const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pro, setPro] = useState(null);
  const [service, setService] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async ({ date, time }) => {
    setSaving(true);
    try {
      await api.post('/appointments', {
        professional_id: pro.id,
        service_id: service.id,
        date: date.toISOString().split('T')[0],
        time,
      });
      navigate('/client/appointments');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar">
          <h1 className="page-title">Trouver un professionnel</h1>
        </header>

        <div className="book-container">
          <StepIndicator current={step} />

          {step === 1 && (
            <Step1 onSelect={p => { setPro(p); setStep(2); }} />
          )}
          {step === 2 && (
            <Step2
              pro={pro}
              onSelect={s => { setService(s); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3
              pro={pro}
              service={service}
              onConfirm={handleConfirm}
              onBack={() => setStep(2)}
              loading={saving}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
