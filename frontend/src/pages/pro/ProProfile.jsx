import { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Save, Briefcase, Shield, MapPin, FileText } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import VerificationBadge from '../../components/common/VerificationBadge';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import { getAvatarSrc, getUserInitials } from '../../utils/avatar';
import { fileToDataUrl } from '../../utils/file';
import '../client/Profile.css';
import './ProDashboard.css';

const SPECIALITY_OPTIONS = [
  'Medecin generaliste',
  'Dentiste',
  'Kinesitherapeute',
  'Psychologue',
  'Developpeur web',
  'Data scientist',
  'Designer UX/UI',
  'DevOps',
  'Comptable',
  'Conseiller financier',
  'Avocat',
  'Notaire',
  'Professeur',
  'Formateur professionnel',
  'Coiffeur',
  'Photographe',
  'Ingenieur mecanique',
  'Electricien',
  'Chauffeur',
  'Logisticien',
];

const getInitialForm = (user) => ({
  nom: user?.nom || '',
  prenom: user?.prenom || '',
  email: user?.email || '',
  phone: user?.phone || '',
  specialite: user?.specialty || user?.specialite || '',
  city: user?.city || '',
  adresse: user?.adresse || '',
  description: user?.description || '',
});

const ProProfile = () => {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState(getInitialForm(user));

  const [pwdForm, setPwdForm] = useState({
    current: '',
    newPwd: '',
    confirm: '',
  });

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msgInfo, setMsgInfo] = useState(null);
  const [msgPwd, setMsgPwd] = useState(null);
  const [isVerified, setIsVerified] = useState(
    Boolean(user?.verified || ['validated', 'valide'].includes(String(user?.validation || user?.status || '').toLowerCase()))
  );

  useEffect(() => {
    setForm(getInitialForm(user));
  }, [user]);

  useEffect(() => {
    let mounted = true;
    api.get('/users/profile')
      .then(({ data }) => {
        if (mounted && data) {
          updateUser(data);
          setIsVerified(Boolean(data?.verified || ['validated', 'valide'].includes(String(data?.validation || data?.status || '').toLowerCase())));
        }
      })
      .catch(() => {
        // Keep current user cache if profile refresh fails.
      });
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwdChange = (e) => setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMsgInfo({ type: 'error', text: 'Formats acceptes: JPG, PNG, WEBP.' });
      return;
    }

    setUploadingAvatar(true);
    setMsgInfo(null);
    try {
      const imageBase64 = await fileToDataUrl(file);
      const { data } = await api.post('/users/avatar', {
        image_base64: imageBase64,
        content_type: file.type,
      });
      updateUser(data);
      setMsgInfo({ type: 'success', text: 'Photo de profil mise a jour.' });
    } catch (error) {
      setMsgInfo({ type: 'error', text: error?.response?.data?.error || 'Impossible de televerser la photo.' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    setMsgInfo(null);
    try {
      const { data } = await api.delete('/users/avatar');
      updateUser(data);
      setMsgInfo({ type: 'success', text: 'Photo de profil supprimee.' });
    } catch (error) {
      setMsgInfo({ type: 'error', text: error?.response?.data?.error || 'Impossible de supprimer la photo.' });
    }
  };

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setMsgInfo(null);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data);
      setMsgInfo({ type: 'success', text: 'Profil professionnel mis a jour.' });
    } catch {
      setMsgInfo({ type: 'error', text: 'Erreur lors de la mise a jour du profil.' });
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
      setMsgPwd({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caracteres.' });
      return;
    }
    setSavingPwd(true);
    try {
      await api.put('/users/password', {
        current_password: pwdForm.current,
        new_password: pwdForm.newPwd,
      });
      setMsgPwd({ type: 'success', text: 'Mot de passe mis a jour avec succes.' });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch {
      setMsgPwd({ type: 'error', text: 'Mot de passe actuel incorrect.' });
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = getUserInitials(user, 'PR');
  const avatarSrc = getAvatarSrc(user);

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Mon profil</h1>
        </header>

        <div className="profile-grid">
          <div className="profile-avatar-card">
            <div className="profile-big-avatar profile-big-avatar-pro">
              {avatarSrc ? <img src={avatarSrc} alt={user?.name || 'Avatar'} /> : initials}
            </div>
            <p className="profile-avatar-name">{user?.name || '-'}</p>
            <div className="profile-avatar-name-row">
              <p className="profile-avatar-role profile-avatar-role-pro">Professionnel</p>
              <VerificationBadge verified={isVerified} compact />
            </div>
            <p className="profile-avatar-email">{form.specialite || 'Specialite non renseignee'}</p>
            <p className="profile-avatar-email">{user?.email || '-'}</p>
            <p className="profile-avatar-current-photo">
              {avatarSrc ? 'Photo actuelle visible' : 'Aucune photo actuellement'}
            </p>
            <label className="profile-avatar-upload">
              {uploadingAvatar ? 'Televersement...' : 'Ajouter une photo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
            </label>
            {avatarSrc && <button className="profile-avatar-upload" type="button" onClick={handleAvatarDelete}>Supprimer la photo</button>}
          </div>

          <div className="profile-section-card">
            <h2 className="profile-section-title"><User size={16} /> Informations personnelles</h2>
            <div className="profile-field"><label className="profile-label">Nom</label><input className="profile-input" name="nom" value={form.nom} onChange={handleChange} placeholder="Nom professionnel" /></div>
            <div className="profile-field"><label className="profile-label">Prenom</label><input className="profile-input" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Prenom professionnel" /></div>
            <div className="profile-field"><label className="profile-label"><Mail size={13} /> Adresse email</label><input className="profile-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="pro@smartappoint.com" /></div>
            <div className="profile-field"><label className="profile-label"><Phone size={13} /> Telephone</label><input className="profile-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+216 XX XXX XXX" /></div>
            <div className="profile-field">
              <label className="profile-label"><Briefcase size={13} /> Specialite</label>
              <input
                className="profile-input"
                name="specialite"
                value={form.specialite}
                onChange={handleChange}
                placeholder="Ex: Medecin generaliste, Developpeur web, Coiffeur..."
                list="specialites-list"
              />
              <datalist id="specialites-list">
                {SPECIALITY_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="profile-field"><label className="profile-label"><MapPin size={13} /> Ville</label><input className="profile-input" name="city" value={form.city} onChange={handleChange} placeholder="Ex: Tunis, Sfax, Sousse..." /></div>
            <div className="profile-field"><label className="profile-label"><MapPin size={13} /> Adresse</label><input className="profile-input" name="adresse" value={form.adresse} onChange={handleChange} placeholder="Adresse professionnelle" /></div>
            <div className="profile-field">
              <label className="profile-label"><FileText size={13} /> Description</label>
              <textarea
                className="profile-input profile-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Presentez votre activite, vos services ou votre experience."
                rows="4"
              />
            </div>
            {msgInfo && <p className={`profile-msg ${msgInfo.type}`}>{msgInfo.text}</p>}
            <button className="profile-save-btn profile-save-btn-pro" onClick={handleSaveInfo} disabled={savingInfo}><Save size={14} />{savingInfo ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
          </div>

          <div className="profile-section-card">
            <h2 className="profile-section-title"><Lock size={16} /> Securite du compte</h2>
            <div className="profile-field"><label className="profile-label">Mot de passe actuel</label><input className="profile-input" name="current" type="password" value={pwdForm.current} onChange={handlePwdChange} placeholder="********" /></div>
            <div className="profile-field"><label className="profile-label">Nouveau mot de passe</label><input className="profile-input" name="newPwd" type="password" value={pwdForm.newPwd} onChange={handlePwdChange} placeholder="********" /></div>
            <div className="profile-field"><label className="profile-label">Confirmer le mot de passe</label><input className="profile-input" name="confirm" type="password" value={pwdForm.confirm} onChange={handlePwdChange} placeholder="********" /></div>
            {msgPwd && <p className={`profile-msg ${msgPwd.type}`}>{msgPwd.text}</p>}
            <button className="profile-save-btn profile-save-btn-pro" onClick={handleSavePwd} disabled={savingPwd}><Shield size={14} />{savingPwd ? 'Modification...' : 'Modifier le mot de passe'}</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProProfile;
