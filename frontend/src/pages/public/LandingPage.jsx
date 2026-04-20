import { memo } from 'react';
import { ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, LayoutDashboard, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PublicPages.css';

const highlights = [
  {
    icon: CalendarClock,
    title: 'Gestion centralisee des rendez-vous',
    text: 'Le professionnel remplace les methodes classiques par un espace unique pour organiser les demandes et gerer ses disponibilites.',
  },
  {
    icon: BrainCircuit,
    title: 'Aide a la decision par l IA',
    text: 'Avant de valider une demande, le professionnel peut consulter un indicateur de risque d absence pour decider avec plus de recul.',
  },
  {
    icon: ShieldCheck,
    title: 'Confiance et securite pour tous',
    text: 'Comptes verifies, donnees mieux structurees et parcours plus rassurant renforcent la confiance entre clients et professionnels.',
  },
  {
    icon: LayoutDashboard,
    title: 'Pilotage simple de l activite',
    text: 'Rendez-vous, clients, performance et suivi de l activite restent accessibles depuis un tableau de bord lisible.',
  },
];

const benefits = [
  'Trouver, comparer et reserver des services plus facilement',
  'Centraliser rendez-vous, paiements et suivi sur une seule plateforme',
  'Aider le professionnel a mieux gerer ses demandes',
  'Offrir une experience claire et intuitive des la premiere visite',
];

const professionalSignals = [
  { value: 'Tout-en-un', label: 'Reservation, suivi et paiement au meme endroit' },
  { value: 'IA', label: 'Aide a l evaluation du risque de no-show' },
  { value: '24/7', label: 'Acces continu a la plateforme' },
];

const executionSteps = [
  'Presenter clairement les services disponibles',
  'Guider le client vers la reservation et le suivi',
  'Permettre au professionnel de mieux gerer son activite',
];

function LandingPage() {
  return (
    <div className="public-page public-page-pro">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <img
            className="public-brand-logo"
            src="/logo.png"
            alt="SmartAppoint"
            fetchPriority="high"
            decoding="async"
          />
        </Link>
        <nav className="public-nav">
          <Link to="/espace-client">Espace client</Link>
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="public-nav-cta">Creer un compte</Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="public-kicker">
              <Sparkles size={14} />
              Plateforme de rendez-vous pour clients et professionnels
            </span>
            <h1>Gerez vos rendez-vous et trouvez le bon professionnel en toute confiance.</h1>
            <p className="hero-text">
              SmartAppoint centralise la prise de rendez-vous, la recherche de professionnels,
              le suivi des demandes et le paiement en ligne dans une seule plateforme.
              L objectif est simple: offrir plus de visibilite aux professionnels et plus
              de confiance aux clients.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="public-btn public-btn-primary">
                Acceder a mon espace <ArrowRight size={16} />
              </Link>
              <Link to="/espace-client" className="public-btn public-btn-secondary">
                Decouvrir l espace client
              </Link>
            </div>

            <div className="hero-benefits">
              {benefits.map((benefit) => (
                <div key={benefit} className="hero-benefit-item">
                  <CheckCircle2 size={16} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="public-signal-row">
              {professionalSignals.map((item) => (
                <div key={item.label} className="public-signal-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-orbit">
              <span className="hero-orbit-pill">Planning</span>
              <span className="hero-orbit-pill">Analyse IA</span>
              <span className="hero-orbit-pill">Tableaux de bord</span>
            </div>

            <div className="hero-panel-card hero-panel-card-primary">
              <p className="hero-panel-label">Valeur pour le professionnel</p>
              <h2>Un espace unique pour accepter, suivre et piloter les rendez-vous.</h2>
              <div className="hero-metrics">
                <div>
                  <strong>Demandes</strong>
                  <span>Accepter ou refuser les rendez-vous depuis un seul espace</span>
                </div>
                <div>
                  <strong>IA</strong>
                  <span>Visualiser le risque d absence avant validation</span>
                </div>
                <div>
                  <strong>Suivi</strong>
                  <span>Retrouver clients, services et indicateurs essentiels</span>
                </div>
              </div>
            </div>

            <div className="hero-panel-card hero-panel-card-analytics">
              <div className="hero-analytics-head">
                <div>
                  <p className="hero-panel-label">Vue d ensemble</p>
                  <strong>Suivi de l activite</strong>
                </div>
                <span className="hero-analytics-badge">+18%</span>
              </div>
              <div className="hero-analytics-bars" aria-hidden="true">
                <span style={{ '--bar-size': '74%' }} />
                <span style={{ '--bar-size': '46%' }} />
                <span style={{ '--bar-size': '88%' }} />
                <span style={{ '--bar-size': '62%' }} />
                <span style={{ '--bar-size': '96%' }} />
              </div>
              <div className="hero-analytics-summary">
                {executionSteps.map((step) => (
                  <div key={step} className="hero-analytics-step">
                    <CheckCircle2 size={14} />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-panel-card hero-panel-card-soft">
              <div className="hero-mini-stat">
                <UsersRound size={18} />
                <div>
                  <strong>Parcours plus rassurant</strong>
                  <span>Le client comprend rapidement comment chercher, comparer et reserver</span>
                </div>
              </div>
              <div className="hero-mini-stat">
                <BrainCircuit size={18} />
                <div>
                  <strong>Decision assistee</strong>
                  <span>Le professionnel dispose d une aide supplementaire avant validation</span>
                </div>
              </div>
            </div>

            <div className="public-floating-badge public-floating-badge-pro">
              Une plateforme unique pour reserver et gerer les rendez-vous
            </div>
          </div>
        </section>

        <section className="public-section">
          <div className="section-heading">
            <span>Fonctionnement de la plateforme</span>
            <h2>Les fonctions essentielles sont presentees avec un langage clair pour chaque type d utilisateur.</h2>
          </div>
          <div className="feature-grid">
            {highlights.map(({ icon: Icon, title, text }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-proof-grid">
          <article className="public-proof-card">
            <span>Pour le client</span>
            <h3>Trouver un professionnel ne doit plus etre une recherche au hasard.</h3>
            <p>La plateforme aide l utilisateur a comparer les prestations, comprendre les services et choisir plus sereinement selon son besoin.</p>
          </article>
          <article className="public-proof-card">
            <span>Pour le professionnel</span>
            <h3>Le suivi des rendez-vous et des demandes devient plus simple a piloter.</h3>
            <p>SmartAppoint regroupe la gestion, la reservation et l aide a la decision dans un environnement plus structure et plus pratique au quotidien.</p>
          </article>
        </section>

        <section className="public-section public-band">
          <div className="band-copy">
            <span>Acces rapide</span>
            <h2>Connectez-vous, creez un compte ou decouvrez l espace client selon votre besoin.</h2>
            <p>La page d accueil sert d entree claire vers les espaces existants de la plateforme sans perdre l utilisateur dans un message trop abstrait.</p>
          </div>
          <div className="band-actions">
            <Link to="/login" className="public-btn public-btn-primary">Connexion</Link>
            <Link to="/register" className="public-btn public-btn-secondary">Inscription</Link>
            <Link to="/espace-client" className="public-btn public-btn-ghost">Voir l espace client</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default memo(LandingPage);
