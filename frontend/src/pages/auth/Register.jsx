import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BadgeCheck, Camera, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { fileToDataUrl } from '../../utils/file';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', prenom: '', email: '', password: '',
    password_confirmation: '', role: 'client',
    phone: '', cin: '', adresse: '', city: '',
    specialite: '', description: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formats acceptes: JPG, PNG, WEBP.');
      e.target.value = '';
      return;
    }

    try {
      const preview = await fileToDataUrl(file);
      setAvatarFile(file);
      setAvatarPreview(preview);
    } catch {
      toast.error('Impossible de charger l apercu de la photo.');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };

      if (avatarFile) {
        payload.avatar_base64 = await fileToDataUrl(avatarFile);
        payload.avatar_content_type = avatarFile.type;
      }

      await api.post('/auth/register', payload);
      toast.success('Compte cree ! Vous pouvez vous connecter.');
      navigate('/login');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue lors de la creation du compte.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isPro = form.role === 'professional';

  return (
    <div className="auth-bg">
      <div className="auth-shell auth-shell-register">
        <div className="auth-card auth-card-wide auth-form-card">
          <div className="auth-card-top">
            <span className="auth-kicker auth-kicker-light">
              <Sparkles size={14} />
              Rejoindre SmartAppoint
            </span>
            <div className="auth-intro">
              <div>
                <h1 className="auth-page-title">Inscription</h1>
                <p className="auth-page-text">
                  Creez votre compte en quelques etapes et profitez d un espace moderne, fiable et adapte a votre profil.
                </p>
              </div>
              <span className="auth-trust-badge">
                <ShieldCheck size={16} />
                Profil securise
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

          <h2 className="auth-title">Creer votre compte</h2>
          <p className="auth-subtitle">Remplissez les informations essentielles pour rejoindre la plateforme.</p>

          <div className="auth-surface-note">
            Un formulaire plus clair pour demarrer avec une image plus serieuse et plus professionnelle.
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-section">
              <div className="auth-section-heading">
                <span>Profil</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Photo de profil (optionnel)</label>
                <label className="auth-upload-card">
                  <div className={`auth-upload-preview ${avatarPreview ? 'has-image' : ''}`}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Apercu du profil" />
                    ) : (
                      <span className="auth-upload-placeholder">
                        <Camera size={18} />
                        Ajouter une photo
                      </span>
                    )}
                  </div>
                  <span className="auth-upload-text">
                    {avatarFile ? avatarFile.name : 'Choisir une image JPG, PNG ou WEBP'}
                  </span>
                  <span className="auth-upload-hint">Vous pouvez creer le compte sans photo et l ajouter plus tard.</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                </label>
              </div>

              <div className="auth-two-col">
                <div className="auth-field">
                <label className="auth-label">Nom</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><UserRound size={16} /></span>
                    <input type="text" name="name" className="auth-input" placeholder="Votre nom" value={form.name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Prenom</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><UserRound size={16} /></span>
                    <input type="text" name="prenom" className="auth-input" placeholder="Votre prenom" value={form.prenom} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="auth-two-col">
                <div className="auth-field">
                  <label className="auth-label">CIN</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><BadgeCheck size={16} /></span>
                    <input type="text" name="cin" className="auth-input" placeholder="Numero de carte d identite" value={form.cin} onChange={handleChange} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Je suis un(e)</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><ShieldCheck size={16} /></span>
                    <select name="role" className="auth-input auth-select" value={form.role} onChange={handleChange}>
                      <option value="client">Client</option>
                      <option value="professional">Professionnel</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-form-section">
              <div className="auth-section-heading">
                <span>Acces au compte</span>
              </div>

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><Mail size={16} /></span>
                  <input type="email" name="email" className="auth-input" placeholder="exemple@email.com" value={form.email} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {isPro && (
              <div className="auth-pro-block">
                <p className="auth-pro-label">Informations professionnelles</p>
                <div className="auth-field">
                  <label className="auth-label">Specialite</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Sparkles size={16} /></span>
                    <input type="text" name="specialite" className="auth-input" placeholder="Ex : Medecin, Architecte, Coiffeur..." value={form.specialite} onChange={handleChange} required={isPro} />
                  </div>
                </div>
              </div>
            )}

            <div className="auth-form-section">
              <div className="auth-section-heading">
                <span>Securite</span>
              </div>

              <div className="auth-two-col">
                <div className="auth-field">
                  <label className="auth-label">Mot de passe</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><LockKeyhole size={16} /></span>
                    <input type="password" name="password" className="auth-input" placeholder="Minimum 6 caracteres" value={form.password} onChange={handleChange} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Confirmation</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><LockKeyhole size={16} /></span>
                    <input type="password" name="password_confirmation" className="auth-input" placeholder="Confirmez votre mot de passe" value={form.password_confirmation} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creation en cours...' : 'Creer mon compte'}
            </button>
          </form>

          <div className="auth-divider"><span>ou</span></div>
          <p className="auth-footer">
            Deja inscrit ? <Link to="/login" className="auth-link">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
