import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      login(token, user);
      toast.success(`Bienvenue, ${user.name} !`);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'professional') navigate('/pro/dashboard');
      else navigate('/client/dashboard');
    } catch (err) {
      const msg = err.response && err.response.data
        ? err.response.data.message
        : 'Identifiants incorrects';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">SmartAppoint</h2>
          <p className="text-muted">Connectez-vous à votre compte</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="exemple@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Mot de passe</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mt-2"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <hr />
        <p className="text-center text-muted mb-0">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary fw-semibold">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;