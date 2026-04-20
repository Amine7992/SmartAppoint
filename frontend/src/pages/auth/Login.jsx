import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      const msg = 'Veuillez saisir votre email et votre mot de passe.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, refreshToken, expiresAt, user } = res.data;

      if (token) {
        setError('');
        login({ token, refreshToken, expiresAt }, user);
        toast.success(`Bienvenue, ${user.nom || 'utilisateur'} !`);
        if (user.role === 'admin') navigate('/admin/dashboard');
        else if (user.role === 'professional') navigate('/pro/dashboard');
        else navigate('/client/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur de connexion';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-shell">
        <div className="auth-card auth-form-card">
          <div className="auth-card-top">
            <span className="auth-kicker auth-kicker-light">
              <Sparkles size={14} />
              Espace securise SmartAppoint
            </span>
            <div className="auth-intro">
              <div>
                <h1 className="auth-page-title">Connexion</h1>
                <p className="auth-page-text">
                  Accedez a votre espace personnel pour gerer vos rendez-vous dans une interface plus claire et professionnelle.
                </p>
              </div>
              <span className="auth-trust-badge">
                <ShieldCheck size={16} />
                Acces protege
              </span>
            </div>
          </div>

          <div className="auth-logo-wrap">
            <img
              src="/logo.png"
              alt="SmartAppoint Logo"
              className="auth-logo-standalone"
            />
          </div>

          <h2 className="auth-title">Heureux de vous revoir</h2>
          <p className="auth-subtitle">Accedez a votre compte pour continuer sur la plateforme.</p>

          <div className="auth-surface-note">
            Connexion rapide, interface claire et acces securise a votre espace.
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-section">
              <div className="auth-section-heading">
                <span>Informations de connexion</span>
              </div>

              <div className="auth-field">
              <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    className="auth-input"
                    placeholder="exemple@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Mot de passe</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><LockKeyhole size={16} /></span>
                  <input
                    type="password"
                    name="password"
                    className="auth-input"
                    placeholder="Votre mot de passe"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="auth-divider"><span>ou</span></div>

          <p className="auth-footer">
            Pas encore de compte ?{' '}
            <Link to="/register" className="auth-link">S inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
