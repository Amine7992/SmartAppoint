import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      const { token, user } = res.data;

      if (token) {
        setError('');
        login(token, user);
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
      <div className="auth-card">
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

        <h2 className="auth-title">Connexion</h2>
        <p className="auth-subtitle">Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
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

          <div className="auth-field">
            <label className="auth-label">Mot de passe</label>
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-divider"><span>ou</span></div>

        <p className="auth-footer">
          Pas encore de compte ?{' '}
          <Link to="/register" className="auth-link">S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;