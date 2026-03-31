import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    password_confirmation: '', role: 'client', phone: '',
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
      const errors = err.response && err.response.data
        ? err.response.data.errors
        : null;
      if (errors) {
        Object.values(errors).forEach((e) => toast.error(e[0]));
      } else {
        toast.error('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: 480 }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">SmartAppoint</h2>
          <p className="text-muted">Créer un nouveau compte</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Nom complet</label>
            <input type="text" name="name" className="form-control"
              placeholder="Votre nom" value={form.name}
              onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input type="email" name="email" className="form-control"
              placeholder="exemple@email.com" value={form.email}
              onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Téléphone</label>
            <input type="tel" name="phone" className="form-control"
              placeholder="+216 XX XXX XXX" value={form.phone}
              onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Je suis un(e)</label>
            <select name="role" className="form-select"
              value={form.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="professional">Professionnel</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Mot de passe</label>
            <input type="password" name="password" className="form-control"
              placeholder="Min. 8 caractères" value={form.password}
              onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Confirmer le mot de passe</label>
            <input type="password" name="password_confirmation"
              className="form-control" placeholder="••••••••"
              value={form.password_confirmation}
              onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-success w-100 py-2 mt-1"
            disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <hr />
        <p className="text-center text-muted mb-0">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary fw-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;