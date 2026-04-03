import { useState } from 'react';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [pwdForm, setPwdForm] = useState({
    current: '',
    newPwd:  '',
    confirm: '',
  });

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd,  setSavingPwd]  = useState(false);
  const [msgInfo, setMsgInfo] = useState(null);
  const [msgPwd,  setMsgPwd]  = useState(null);

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePwdChange = e =>
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setMsgInfo(null);
    try {
      await api.put('/users/profile', form);
      setMsgInfo({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch {
      setMsgInfo({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePwd = async () => {
    setMsgPwd(null);
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setMsgPwd({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (pwdForm.newPwd.length < 6) {
      setMsgPwd({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    setSavingPwd(true);
    try {
      await api.put('/users/password', {
        current_password: pwdForm.current,
        new_password: pwdForm.newPwd,
      });
      setMsgPwd({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch {
      setMsgPwd({ type: 'error', text: 'Mot de passe actuel incorrect.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AM';

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar">
          <h1 className="page-title">Mon profil</h1>
        </header>

        <div className="profile-grid">

          {/* Carte avatar */}
          <div className="profile-avatar-card">
            <div className="profile-big-avatar">{initials}</div>
            <p className="profile-avatar-name">{user?.name || '—'}</p>
            <p className="profile-avatar-role">Client</p>
            <p className="profile-avatar-email">{user?.email || '—'}</p>
          </div>

          {/* Infos personnelles */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">
              <User size={16} /> Informations personnelles
            </h2>

            <div className="profile-field">
              <label className="profile-label">Nom complet</label>
              <input
                className="profile-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Votre nom"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">
                <Mail size={13} /> Adresse email
              </label>
              <input
                className="profile-input"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@exemple.com"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">
                <Phone size={13} /> Téléphone
              </label>
              <input
                className="profile-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            {msgInfo && (
              <p className={`profile-msg ${msgInfo.type}`}>{msgInfo.text}</p>
            )}

            <button
              className="profile-save-btn"
              onClick={handleSaveInfo}
              disabled={savingInfo}
            >
              <Save size={14} />
              {savingInfo ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>

          {/* Mot de passe */}
          <div className="profile-section-card">
            <h2 className="profile-section-title">
              <Lock size={16} /> Modifier le mot de passe
            </h2>

            <div className="profile-field">
              <label className="profile-label">Mot de passe actuel</label>
              <input
                className="profile-input"
                name="current"
                type="password"
                value={pwdForm.current}
                onChange={handlePwdChange}
                placeholder="••••••••"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Nouveau mot de passe</label>
              <input
                className="profile-input"
                name="newPwd"
                type="password"
                value={pwdForm.newPwd}
                onChange={handlePwdChange}
                placeholder="••••••••"
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Confirmer le mot de passe</label>
              <input
                className="profile-input"
                name="confirm"
                type="password"
                value={pwdForm.confirm}
                onChange={handlePwdChange}
                placeholder="••••••••"
              />
            </div>

            {msgPwd && (
              <p className={`profile-msg ${msgPwd.type}`}>{msgPwd.text}</p>
            )}

            <button
              className="profile-save-btn"
              onClick={handleSavePwd}
              disabled={savingPwd}
            >
              <Save size={14} />
              {savingPwd ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Profile;
