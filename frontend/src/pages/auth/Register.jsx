import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:                  '',
    prenom:                '',
    email:                 '',
    password:              '',
    password_confirmation: '',
    role:                  'client',
    phone:                 '',
    cin:                   '',
    adresse:               '',
    city:                  '',
    // Champs pro uniquement
    specialite:            '',
    description:           '',
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

  const isPro = form.role === 'professional';

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: 520 }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">SmartAppoint</h2>
          <p className="text-muted">Créer un nouveau compte</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Identité ── */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Nom</label>
            <input type="text" name="name" className="form-control"
              placeholder="Votre nom" value={form.name}
              onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Prénom</label>
            <input type="text" name="prenom" className="form-control"
              placeholder="Votre prénom" value={form.prenom}
              onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">CIN</label>
            <input type="text" name="cin" className="form-control"
              placeholder="Numéro de carte d'identité" value={form.cin}
              onChange={handleChange} required />
          </div>

          {/* ── Contact ── */}
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

          {/* ── Adresse ── */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Adresse</label>
            <input type="text" name="adresse" className="form-control"
              placeholder="Rue, numéro, quartier..." value={form.adresse}
              onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Ville</label>
            <input type="text" name="city" className="form-control"
              placeholder="Ex : Tunis, Sousse, Sfax..." value={form.city}
              onChange={handleChange} />
          </div>

          {/* ── Rôle ── */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Je suis un(e)</label>
            <select name="role" className="form-select"
              value={form.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="professional">Professionnel</option>
            </select>
          </div>

          {/* ── Champs pro (affichés uniquement si role === 'professional') ── */}
          {isPro && (
            <>
              <div className="alert alert-info py-2 px-3 mb-3" role="alert">
                <small>📋 Informations supplémentaires pour les professionnels</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Spécialité</label>
                <input type="text" name="specialite" className="form-control"
                  placeholder="Ex : Médecin généraliste, Coiffeur, Comptable..."
                  value={form.specialite} onChange={handleChange} required={isPro} />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Description de la spécialité</label>
                <textarea name="description" className="form-control" rows={3}
                  placeholder="Décrivez votre activité, vos services proposés..."
                  value={form.description} onChange={handleChange} />
              </div>
            </>
          )}

          {/* ── Mot de passe ── */}
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