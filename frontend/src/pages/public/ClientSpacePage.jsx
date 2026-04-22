import { memo } from 'react';
import { BellRing, CalendarDays, ChevronRight, CreditCard, Search, ShieldCheck, UserRound, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PublicPages.css';

const featureCards = [
  {
    icon: Search,
    title: 'Trouver le bon professionnel',
    text: 'Le client peut rechercher par specialite, consulter plusieurs profils et comparer plus facilement avant de choisir.',
  },
  {
    icon: CalendarDays,
    title: 'Reserver rapidement un rendez-vous',
    text: 'Le parcours de reservation guide le client du choix du service jusqu au creneau disponible sans etapes inutiles.',
  },
  {
    icon: BellRing,
    title: 'Recevoir des notifications utiles',
    text: 'Les rappels et confirmations permettent de suivre chaque rendez-vous avant et apres la reservation.',
  },
  {
    icon: UserRound,
    title: 'Suivre son espace personnel',
    text: 'Le profil, l historique et les rendez-vous restent accessibles depuis un espace clair et coherent.',
  },
];

const journey = [
  'Explorer les specialites et les professionnels disponibles',
  'Prendre rendez-vous en quelques etapes',
  'Suivre les confirmations, annulations et rappels',
  'Gerer son profil et consulter ses rendez-vous depuis son espace',
];

const customerMoments = [
  { value: '01', title: 'Recherche rapide', text: 'Le client identifie vite le bon professionnel grace a une lecture claire des profils et services.' },
  { value: '02', title: 'Reservation guidee', text: 'Chaque etape rassure, du choix du creneau jusqu a la confirmation.' },
  { value: '03', title: 'Suivi centralise', text: 'Historique, rappels et prochaines actions restent visibles dans un seul espace.' },
];

const clientHighlights = [
  { value: 'Recherche', label: 'Comparer plusieurs professionnels selon le besoin' },
  { value: 'Reservation', label: 'Choisir un service, une date et un creneau' },
  { value: 'Suivi', label: 'Retrouver confirmations, rappels et historique' },
];

const clientSteps = [
  {
    title: 'Chercher le bon professionnel',
    text: 'Le visiteur commence par explorer les specialites, comparer les profils et comprendre rapidement les services proposes.',
  },
  {
    title: 'Reserver en quelques actions',
    text: 'Le choix du service, du jour et du creneau est guide avec une interface simple qui reduit l hesitation.',
  },
  {
    title: 'Suivre et gerer son espace',
    text: 'Confirmations, rappels, historique et profil personnel restent accessibles dans un environnement coherent.',
  },
];

function ClientSpacePage() {
  return (
    <div className="public-page public-page-client">
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
          <Link to="/">Espace professionnel</Link>
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="public-nav-cta">Commencer</Link>
        </nav>
      </header>

      <main>
        <section className="client-hero">
          <div className="client-hero-copy">
            <span className="public-kicker public-kicker-client">
              <Workflow size={14} />
              Espace client SmartAppoint
            </span>
            <h1>Trouvez un professionnel, reservez en ligne et suivez vos rendez-vous facilement.</h1>
            <p className="hero-text">
              Cette page presente clairement ce que le client peut faire sur SmartAppoint:
              rechercher un prestataire, comparer les services, reserver un rendez-vous
              et suivre ses actions depuis un espace personnel unique.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="public-btn public-btn-primary">
                Se connecter
              </Link>
              <Link to="/register" className="public-btn public-btn-secondary">
                Creer un compte client
              </Link>
            </div>

            <div className="client-trust-strip">
              {clientHighlights.map((item) => (
                <div key={item.label} className="client-trust-item client-trust-item-stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="client-showcase-card">
            <div className="client-showcase-glow" aria-hidden="true" />
            <div className="client-showcase-top">
              <span>Parcours client</span>
              <ShieldCheck size={18} />
            </div>

            <div className="client-showcase-list">
              {journey.map((item) => (
                <div key={item} className="client-showcase-item">
                  <ChevronRight size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="client-showcase-footer">
              <div>
                <strong>Notifications</strong>
                <span>Rappels et suivi des actions</span>
              </div>
              <div>
                <strong>Paiement</strong>
                <span>Parcours pret pour la validation</span>
              </div>
            </div>

            <div className="client-showcase-note">
              Une presentation simple pour comprendre tout de suite comment utiliser la plateforme.
            </div>
          </div>
        </section>

        <section className="public-section client-structure-section">
          <div className="client-structure-grid">
            <div className="client-structure-copy">
              <span>Utilisation pas a pas</span>
              <h2>Le client doit comprendre en quelques secondes comment rechercher, reserver et suivre son rendez-vous.</h2>
              <p>
                Cette organisation reprend la logique du projet presentee dans le rapport:
                une interface intuitive, une recherche plus claire et un parcours qui
                inspire confiance sans donner l impression d etre perdu.
              </p>
            </div>

            <div className="client-step-list">
              {clientSteps.map((step, index) => (
                <article key={step.title} className="client-step-card">
                  <span className="client-step-index">0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="public-section">
          <div className="section-heading">
            <span>Ce que voit le client</span>
            <h2>Les fonctions importantes apparaissent dans le meme ordre que le parcours reel de l utilisateur.</h2>
          </div>
          <div className="feature-grid">
            {featureCards.map(({ icon: Icon, title, text }) => (
              <article key={title} className="feature-card feature-card-client">
                <span className="feature-icon feature-icon-client">
                  <Icon size={20} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section client-flow-section">
          <div className="client-flow-card">
            <div className="client-flow-copy">
              <span>Acces aux pages existantes</span>
              <h2>La page publique guide simplement vers la recherche, la reservation, la connexion et le tableau de bord client.</h2>
              <p>
                Aucun ecran metier n est perdu. Cette presentation sert surtout a
                expliquer les usages de la plateforme avant d envoyer l utilisateur
                vers les routes deja disponibles dans SmartAppoint.
              </p>
            </div>
            <div className="client-flow-pills">
              <span><Search size={14} /> Specialites</span>
              <span><CalendarDays size={14} /> Reservation</span>
              <span><BellRing size={14} /> Notifications</span>
              <span><CreditCard size={14} /> Paiement</span>
            </div>
          </div>
        </section>

        <section className="public-section client-moments-section">
          <div className="section-heading">
            <span>Moments cles</span>
            <h2>Chaque etape importante du parcours client est mise en avant de facon simple et concrete.</h2>
          </div>
          <div className="client-moment-grid">
            {customerMoments.map((moment) => (
              <article key={moment.value} className="client-moment-card">
                <span className="client-moment-index">{moment.value}</span>
                <h3>{moment.title}</h3>
                <p>{moment.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-proof-grid public-proof-grid-client">
          <article className="public-proof-card public-proof-card-client">
            <span>Clarte</span>
            <h3>Le client comprend tout de suite qu il peut chercher, comparer et reserver.</h3>
            <p>Les contenus parlent d actions concretes plutot que de promesses vagues, ce qui rend la page plus utile pour un vrai utilisateur.</p>
          </article>
          <article className="public-proof-card public-proof-card-client">
            <span>Confiance</span>
            <h3>La structure renforce l idee d une plateforme serieuse et simple a utiliser.</h3>
            <p>Le visiteur est guide par des messages plus semantiques, plus credibles et mieux alignes avec les objectifs definis dans le rapport.</p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default memo(ClientSpacePage);
