import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', prenom: '', email: '', password: '',
    password_confirmation: '', role: 'client',
    phone: '', cin: '', adresse: '', city: '',
    specialite: '', description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Compte créé ! Vous pouvez vous connecter.');
      navigate('/login');
    } catch (err) {
      // Afficher le vrai message d'erreur renvoyé par le backend
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue lors de la création du compte.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isPro = form.role === 'professional';

  return (
    <div className="auth-bg">
      <div className="auth-card auth-card-wide">
        {/* ===== LOGO OPTIMISÉ ===== */}
        <div className="auth-logo-wrap">
          <img
            src="/logo.png"
            alt="SmartAppoint Logo"
            className="auth-logo-standalone"
          />
          <div>
            <h1 className="auth-brand">SmartAppoint</h1>
            <p className="auth-tagline">Gestion intelligente de rendez-vous</p>
          </div>
        </div>

        <h2 className="auth-title">Créer un compte</h2>
        <p className="auth-subtitle">Rejoignez SmartAppoint dès aujourd'hui</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-two-col">
            <div className="auth-field">
              <label className="auth-label">Nom</label>
              <input type="text" name="name" className="auth-input" placeholder="Votre nom" value={form.name} onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label className="auth-label">Prénom</label>
              <input type="text" name="prenom" className="auth-input" placeholder="Votre prénom" value={form.prenom} onChange={handleChange} required />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">CIN</label>
            <input type="text" name="cin" className="auth-input" placeholder="Numéro de carte d'identité" value={form.cin} onChange={handleChange} required />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input type="email" name="email" className="auth-input" placeholder="exemple@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="auth-field">
            <label className="auth-label">Je suis un(e)</label>
            <select name="role" className="auth-input auth-select" value={form.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="professional">Professionnel</option>
            </select>
          </div>

          {isPro && (
            <div className="auth-pro-block">
              <p className="auth-pro-label">📋 Informations professionnelles</p>
              <div className="auth-field">
                <label className="auth-label">Spécialité</label>
                <input type="text" name="specialite" className="auth-input" placeholder="Ex : Médecin, Coiffeur..." value={form.specialite} onChange={handleChange} required={isPro} />
              </div>
            </div>
          )}

          <div className="auth-two-col">
            <div className="auth-field">
              <label className="auth-label">Mot de passe</label>
              <input type="password" name="password" className="auth-input" placeholder="Min. 6 car." value={form.password} onChange={handleChange} required />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirmer</label>
              <input type="password" name="password_confirmation" className="auth-input" placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-divider"><span>ou</span></div>
        <p className="auth-footer">
          Déjà inscrit ? <Link to="/login" className="auth-link">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
