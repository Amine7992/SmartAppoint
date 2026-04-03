import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import ProSidebar from '../../components/pro/ProSidebar';
import api from '../../api/axios';
import './ProServices.css';

const EMPTY_FORM = { name: '', description: '', duration: '', price: '' };

const ProServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/pro/services')
      .then(r => setServices(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name || !form.duration) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/pro/services/${editId}`, form);
        setServices(prev => prev.map(s => s.id === editId ? { ...s, ...form } : s));
      } else {
        const res = await api.post('/pro/services', form);
        setServices(prev => [...prev, res.data]);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleEdit = (svc) => {
    setForm({ name: svc.name, description: svc.description || '', duration: svc.duration, price: svc.price || '' });
    setEditId(svc.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce service ?')) return;
    try {
      await api.delete(`/pro/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pro-layout">
      <ProSidebar />
      <main className="pro-main">
        <header className="pro-topbar">
          <h1 className="pro-page-title">Mes services</h1>
          <button className="pro-btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
            <Plus size={15} style={{ marginRight: 6 }} />
            Ajouter un service
          </button>
        </header>

        {/* Form */}
        {showForm && (
          <div className="pro-panel svc-form-panel">
            <h2 className="pro-panel-title" style={{ marginBottom: 18 }}>
              {editId ? 'Modifier le service' : 'Nouveau service'}
            </h2>
            <div className="svc-form-grid">
              <div className="svc-field">
                <label className="svc-label">Nom du service *</label>
                <input className="svc-input" name="name" value={form.name} onChange={handleChange} placeholder="Ex: Consultation générale" />
              </div>
              <div className="svc-field">
                <label className="svc-label">Durée (min) *</label>
                <input className="svc-input" name="duration" type="number" value={form.duration} onChange={handleChange} placeholder="30" />
              </div>
              <div className="svc-field">
                <label className="svc-label">Prix (DT)</label>
                <input className="svc-input" name="price" type="number" value={form.price} onChange={handleChange} placeholder="50" />
              </div>
              <div className="svc-field svc-field-full">
                <label className="svc-label">Description</label>
                <input className="svc-input" name="description" value={form.description} onChange={handleChange} placeholder="Description du service…" />
              </div>
            </div>
            <div className="svc-form-actions">
              <button className="pro-btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button className="svc-btn-cancel" onClick={() => { setShowForm(false); setEditId(null); }}>
                <X size={14} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Services list */}
        <div className="pro-panel">
          <div className="pro-panel-header">
            <h2 className="pro-panel-title">Services proposés</h2>
          </div>
          {loading ? (
            <p className="pro-loading">Chargement…</p>
          ) : services.length === 0 ? (
            <div className="pro-empty">
              <p>Aucun service ajouté. Cliquez sur "Ajouter un service" pour commencer.</p>
            </div>
          ) : (
            <div className="svc-list">
              {services.map(svc => (
                <div key={svc.id} className="svc-card">
                  <div className="svc-card-icon">{svc.name?.charAt(0).toUpperCase()}</div>
                  <div className="svc-card-info">
                    <p className="svc-card-name">{svc.name}</p>
                    {svc.description && <p className="svc-card-desc">{svc.description}</p>}
                    <div className="svc-card-meta">
                      <span>{svc.duration} min</span>
                      {svc.price && <span className="svc-price">{svc.price} DT</span>}
                    </div>
                  </div>
                  <div className="svc-card-actions">
                    <button className="svc-btn-edit" onClick={() => handleEdit(svc)}><Edit2 size={14} /></button>
                    <button className="svc-btn-del"  onClick={() => handleDelete(svc.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProServices;
