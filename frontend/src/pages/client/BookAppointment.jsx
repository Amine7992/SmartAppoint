import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Clock, MapPin, Search, Star } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import UserAvatar from '../../components/common/UserAvatar';
import VerificationBadge from '../../components/common/VerificationBadge';
import api from '../../api/axios';
import './Dashboard.css';
import './BookAppointment.css';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const CATEGORY_KEYWORDS = {
  informatique: ['developpeur', 'dev', 'informatique', 'data', 'cybersecurite', 'devops', 'ux', 'ui', 'designer', 'systeme', 'reseau', 'cloud', 'ia', 'intelligence artificielle', 'software', 'web', 'mobile', 'fullstack', 'frontend', 'backend'],
  sante: ['medecin', 'docteur', 'dentiste', 'kine', 'kinesitherapeute', 'psychologue', 'infirmier', 'infirmiere', 'pharmacien', 'chirurgien', 'pediatre', 'cardiologue', 'dermatologue', 'gynecologue', 'ophtalmologue', 'orthopediste', 'sante', 'medical', 'therapeute', 'osteopathe'],
  industrie: ['ingenieur', 'electricien', 'plombier', 'architecte', 'maintenance', 'soudeur', 'mecanicien', 'btp', 'construction', 'industrie', 'technicien', 'climatisation', 'chauffage', 'menuisier', 'macon', 'peintre'],
  commerce: ['comptable', 'comptabilite', 'financier', 'finance', 'rh', 'ressources humaines', 'marketing', 'commercial', 'auditeur', 'audit', 'management', 'gestionnaire', 'entrepreneur', 'consultant', 'business', 'vente', 'achat'],
  droit: ['avocat', 'notaire', 'juriste', 'huissier', 'greffier', 'droit', 'juridique', 'legal', 'administration', 'administratif', 'fonctionnaire', 'magistrat'],
  education: ['professeur', 'enseignant', 'formateur', 'coach', 'scolaire', 'orthophoniste', 'educateur', 'orientation', 'tutorat', 'formation', 'pedagogie', 'moniteur', 'precepteur'],
  artisanat: ['coiffeur', 'coiffeuse', 'estheticien', 'photographe', 'cuisinier', 'chef', 'menuisier', 'peintre', 'artisan', 'couturier', 'bijoutier', 'reparateur', 'nettoyage', 'garde enfant', 'gardien', 'menage'],
  transport: ['chauffeur', 'livreur', 'logistique', 'transport', 'douane', 'pilote', 'conducteur', 'transitaire', 'fret', 'demenagement', 'coursier'],
};

const getNextDays = () => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    return day;
  });
};

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const formatHumanDate = (date) => `${DAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}`;
const getProfessionalName = (professional) => professional?.name || [professional?.prenom, professional?.nom].filter(Boolean).join(' ') || 'Professionnel';
const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const matchesCategory = (professional, categorieId) => {
  if (!categorieId) return true;

  const specialty = normalizeText(professional?.specialty);
  const keywords = CATEGORY_KEYWORDS[categorieId] || [];
  return keywords.some((keyword) => specialty.includes(keyword));
};

const StepIndicator = ({ step }) => {
  const items = [
    { id: 1, label: 'Professionnel' },
    { id: 2, label: 'Service' },
    { id: 3, label: 'Creneau' },
  ];

  return (
    <div className="step-indicator">
      {items.map((item, index) => {
        const stateClass = step > item.id ? 'done' : step === item.id ? 'active' : '';
        return (
          <div key={item.id} className="step-item">
            <div className={`step-circle ${stateClass}`.trim()}>
              {step > item.id ? <Check size={13} /> : item.id}
            </div>
            <span className={`step-label ${stateClass}`.trim()}>{item.label}</span>
            {index < items.length - 1 ? <span className={`step-line ${step > item.id ? 'done' : ''}`.trim()} /> : null}
          </div>
        );
      })}
    </div>
  );
};

const Step1 = ({ categorieId, categorieLabel, onSelect }) => {
  const [professionals, setProfessionals] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadProfessionals = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/professionals');
        const list = (response.data || []).filter((professional) => matchesCategory(professional, categorieId));

        if (!ignore) {
          setProfessionals(list);
        }
      } catch (err) {
        if (!ignore) {
          setProfessionals([]);
          setError(err.response?.data?.error || 'Impossible de recuperer les professionnels');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadProfessionals();

    return () => {
      ignore = true;
    };
  }, [categorieId]);

  const filteredProfessionals = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return professionals;

    return professionals.filter((professional) =>
      [professional.name, professional.nom, professional.prenom, professional.specialty, professional.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [professionals, query]);

  return (
    <div className="book-step">
      <p className="book-subtitle">
        {categorieLabel ? `Professionnels disponibles en ${categorieLabel}` : 'Choisissez un professionnel'}
      </p>

      <div className="book-search-bar">
        <Search className="book-search-icon" size={16} />
        <input
          className="book-search-input"
          placeholder="Rechercher un professionnel, une ville ou une specialite"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? <p>Chargement des professionnels...</p> : null}
      {!loading && error ? <p>{error}</p> : null}

      {!loading && !error ? (
        <div className="pros-grid">
          {filteredProfessionals.length > 0 ? (
            filteredProfessionals.map((professional) => (
              <div
                key={professional.id}
                className="pro-card"
                onClick={() => onSelect(professional)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(professional);
                }}
              >
                <UserAvatar user={professional} fallback="PR" className="pro-card-avatar" />
                <div className="pro-card-info">
                  <div className="pro-card-name-row">
                    <p className="pro-card-name">{getProfessionalName(professional)}</p>
                    <VerificationBadge verified={professional.verified} compact className="book-verified-badge" />
                  </div>
                  <p className="pro-card-specialty">{professional.specialty || 'Specialite non renseignee'}</p>
                  <p className="pro-card-city">
                    <MapPin size={13} />
                    {professional.city || 'Ville non renseignee'}
                  </p>
                  <p className="pro-card-rating">
                    <Star size={13} />
                    {Number(professional.rating || 0).toFixed(1)}
                  </p>
                </div>
                <ChevronRight className="pro-card-arrow" size={18} />
              </div>
            ))
          ) : (
            <p>Aucun professionnel trouve pour cette categorie.</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

const Step2 = ({ professional, onSelect, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadServices = async () => {
      if (!professional?.id) {
        setServices([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/professionals/${professional.id}/services`);
        if (!ignore) {
          setServices(response.data || []);
        }
      } catch (err) {
        if (!ignore) {
          setServices([]);
          setError(err.response?.data?.error || 'Impossible de recuperer les services');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      ignore = true;
    };
  }, [professional?.id]);

  return (
    <div className="book-step">
      <div className="book-selected-pro">
        <UserAvatar user={professional} fallback="PR" className="pro-mini-avatar" />
        <div>
          <div className="pro-mini-name-row">
            <p className="pro-mini-name">{getProfessionalName(professional)}</p>
            <VerificationBadge verified={professional?.verified} compact className="book-verified-badge" />
          </div>
          <p className="pro-mini-spec">{professional?.specialty || 'Specialite non renseignee'}</p>
        </div>
      </div>

      <p className="book-subtitle">Choisissez un service</p>

      {loading ? <p>Chargement des services...</p> : null}
      {!loading && error ? <p>{error}</p> : null}

      {!loading && !error ? (
        <div className="services-list">
          {services.length > 0 ? (
            services.map((service) => (
              <div
                key={service.id}
                className="service-card"
                onClick={() => onSelect(service)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(service);
                }}
              >
                <div className="service-info">
                  <p className="service-name">{service.name}</p>
                  {service.description ? <p className="service-desc">{service.description}</p> : null}
                  <div className="service-meta">
                    <span>
                      <Clock size={13} style={{ marginRight: 4 }} />
                      {service.duration || 30} min
                    </span>
                    <span className="service-price">{Number(service.price || 0).toFixed(2)} DT</span>
                  </div>
                </div>
                <ChevronRight className="pro-card-arrow" size={18} />
              </div>
            ))
          ) : (
            <p>Ce professionnel n'a encore ajoute aucun service.</p>
          )}
        </div>
      ) : null}

      <button className="btn-back" onClick={onBack}>
        <ChevronLeft size={14} />
        Retour a la liste des professionnels
      </button>
    </div>
  );
};

const Step3 = ({ professional, service, submitting, onConfirm, onBack }) => {
  const [days] = useState(() => getNextDays());
  const [selectedDate, setSelectedDate] = useState(() => getNextDays()[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [takenSlots, setTakenSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [dayOff, setDayOff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadSlots = async () => {
      if (!professional?.id || !selectedDate) return;

      setLoadingSlots(true);
      setError('');
      setSelectedTime('');

      try {
        const response = await api.get(`/professionals/${professional.id}/slots`, {
          params: { date: formatDate(selectedDate) },
        });
        const payload = response.data;
        const legacyTakenSlots = Array.isArray(payload) ? payload : [];
        const normalizedTakenSlots = payload?.takenSlots || legacyTakenSlots;
        const normalizedAvailableSlots = Array.isArray(payload?.availableSlots)
          ? payload.availableSlots
          : SLOTS.filter((slot) => !normalizedTakenSlots.includes(slot));

        if (!ignore) {
          setTakenSlots(normalizedTakenSlots);
          setAvailableSlots(normalizedAvailableSlots);
          setDayOff(Boolean(payload?.dayOff));
        }
      } catch (err) {
        if (!ignore) {
          setTakenSlots([]);
          setAvailableSlots([]);
          setDayOff(false);
          setError(err.response?.data?.error || 'Impossible de recuperer les creneaux');
        }
      } finally {
        if (!ignore) {
          setLoadingSlots(false);
        }
      }
    };

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [professional?.id, selectedDate]);

  return (
    <div className="book-step">
      <div className="book-recap-header">
        <p className="recap-pro">{getProfessionalName(professional)}</p>
        <p className="recap-service">{service?.name}</p>
      </div>

      <p className="book-subtitle">Choisissez une date</p>
      <div className="days-scroll">
        {days.map((day) => {
          const active = formatDate(day) === formatDate(selectedDate);
          const isToday = formatDate(day) === formatDate(new Date());

          return (
            <button
              key={formatDate(day)}
              type="button"
              className={`day-btn ${active ? 'active' : ''}`.trim()}
              onClick={() => setSelectedDate(day)}
            >
              <span className="day-name">{DAYS_FR[day.getDay()]}</span>
              <span className="day-num">{day.getDate()}</span>
              {isToday ? <span className="day-today-dot" /> : null}
            </button>
          );
        })}
      </div>

      <p className="book-subtitle">Choisissez un horaire</p>
      {loadingSlots ? <p>Chargement des creneaux...</p> : null}
      {!loadingSlots && error ? <p>{error}</p> : null}

      {!loadingSlots && !error ? (
        <>
        {dayOff ? <p>Jour off: aucun creneau disponible pour cette date.</p> : null}
        {!dayOff && availableSlots.length === 0 ? <p>Aucun horaire de travail configure pour cette date.</p> : null}
        <div className="slots-grid">
          {SLOTS.filter((slot) => availableSlots.includes(slot)).map((slot) => {
            const taken = takenSlots.includes(slot);
            const active = selectedTime === slot;

            return (
              <button
                key={slot}
                type="button"
                className={`slot-btn ${taken ? 'taken' : ''} ${active ? 'active' : ''}`.trim()}
                disabled={taken}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            );
          })}
        </div>
        </>
      ) : null}

      <div className="book-confirm-section">
        <div className="book-summary">
          <p><strong>Professionnel:</strong> {getProfessionalName(professional)}</p>
          <p><strong>Service:</strong> {service?.name}</p>
          <p><strong>Duree:</strong> {service?.duration || 30} min</p>
          <p><strong>Prix:</strong> {Number(service?.price || 0).toFixed(2)} DT</p>
          <p><strong>Date:</strong> {selectedDate ? formatHumanDate(selectedDate) : '-'}</p>
          <p><strong>Heure:</strong> {selectedTime || '-'}</p>
        </div>

        <button
          className="btn-confirm"
          disabled={!selectedTime || submitting}
          onClick={() => onConfirm({ date: selectedDate, time: selectedTime })}
        >
          {submitting ? 'Reservation en cours...' : 'Confirmer le rendez-vous'}
        </button>
      </div>

      <button className="btn-back" onClick={onBack}>
        <ChevronLeft size={14} />
        Retour aux services
      </button>
    </div>
  );
};

const BookAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const categorieId = location.state?.categorieId || null;
  const categorieLabel = location.state?.categorieLabel || '';

  const [step, setStep] = useState(1);
  const [professional, setProfessional] = useState(null);
  const [service, setService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleConfirm = async ({ date, time }) => {
    if (!professional?.id || !service?.id) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await api.post('/appointments', {
        professional_id: professional.id,
        service_id: service.id,
        date: formatDate(date),
        time,
      });

      navigate('/client/appointments');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Impossible de reserver ce rendez-vous');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="book-container">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
            Prendre rendez-vous
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            {categorieLabel ? `Categorie choisie: ${categorieLabel}` : 'Choisissez un professionnel, un service puis un creneau.'}
          </p>

          <StepIndicator step={step} />
          {submitError ? <p style={{ color: '#b91c1c', marginBottom: 16 }}>{submitError}</p> : null}

          {step === 1 ? (
            <Step1
              categorieId={categorieId}
              categorieLabel={categorieLabel}
              onSelect={(selectedProfessional) => {
                setProfessional(selectedProfessional);
                setService(null);
                setStep(2);
              }}
            />
          ) : null}

          {step === 2 && professional ? (
            <Step2
              professional={professional}
              onSelect={(selectedService) => {
                setService(selectedService);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          ) : null}

          {step === 3 && professional && service ? (
            <Step3
              professional={professional}
              service={service}
              submitting={submitting}
              onConfirm={handleConfirm}
              onBack={() => setStep(2)}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
