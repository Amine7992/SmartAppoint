import { useState } from 'react';
import { Save, Settings } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../api/axios';

const AdminConfig = () => {
  const [form, setForm] = useState({
    platform_name:     'SmartAppoint',
    contact_email:     '',
    noshow_threshold:  '10',
    ai_enabled:        true,
    registration_open: true,
  });

  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const handleChange = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/admin/config', form);
      setMsg({ type: 'success', text: 'Configuration enregistrée avec succès.' });
    } catch {
      setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-page-title">Configuration</h1>
        </header>

        <div className="admin-panel" style={{ maxWidth: 600 }}>
          <h2 className="admin-panel-title" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} /> Paramètres généraux
          </h2>

          {[
            { label: 'Nom de la plateforme', name: 'platform_name',    type: 'text',   placeholder: 'SmartAppoint' },
            { label: 'Email de contact',     name: 'contact_email',    type: 'email',  placeholder: 'admin@smartappoint.tn' },
            { label: 'Seuil no-show (%)',    name: 'noshow_threshold', type: 'number', placeholder: '10' },
          ].map(field => (
            <div key={field.name} className="svc-field" style={{ marginBottom: 16 }}>
              <label className="svc-label">{field.label}</label>
              <input
                className="svc-input"
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0' }}>
            {[
              { label: 'Activer le module IA (prédiction no-show)', name: 'ai_enabled' },
              { label: 'Autoriser les nouvelles inscriptions',       name: 'registration_open' },
            ].map(toggle => (
              <label key={toggle.name} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name={toggle.name}
                  checked={form[toggle.name]}
                  onChange={handleChange}
                  style={{ width: 16, height: 16, accentColor: '#26215C' }}
                />
                <span style={{ fontSize: 13.5, color: '#374151' }}>{toggle.label}</span>
              </label>
            ))}
          </div>

          {msg && (
            <p style={{
              fontSize: 12.5, padding: '8px 12px', borderRadius: 7, marginBottom: 14,
              background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
              color:      msg.type === 'success' ? '#065f46' : '#991b1b',
            }}>{msg.text}</p>
          )}

          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Save size={14} />
            {saving ? 'Enregistrement…' : 'Enregistrer la configuration'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminConfig;
