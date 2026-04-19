const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { mapProfessional } = require('./helpers');
const { getProfessionalReviewStatus } = require('../services/adminProfessionalReviewStore');

const CATEGORIES = [
  {
    id: 'informatique',
    label: 'Informatique & Technologie',
    icon: '💻',
    keywords: ['developpeur', 'dev', 'informatique', 'data', 'cybersecurite', 'devops', 'ux', 'ui', 'designer', 'systeme', 'reseau', 'it ', 'cloud', 'ia', 'intelligence artificielle', 'software', 'web', 'mobile', 'fullstack', 'frontend', 'backend', 'chef de projet it'],
  },
  {
    id: 'sante',
    label: 'Sante & Medecine',
    icon: '🩺',
    keywords: ['medecin', 'docteur', 'dentiste', 'kine', 'kinesitherapeute', 'psychologue', 'infirmier', 'infirmiere', 'pharmacien', 'chirurgien', 'pediatre', 'cardiologue', 'dermatologue', 'gynecologue', 'ophtalmologue', 'orthopediste', 'sante', 'medical', 'therapeute', 'osteopathe'],
  },
  {
    id: 'industrie',
    label: 'Industrie & BTP',
    icon: '🏗️',
    keywords: ['ingenieur', 'electricien', 'plombier', 'architecte', 'maintenance', 'soudeur', 'mecanicien', 'btp', 'construction', 'industrie', 'technicien', 'climatisation', 'chauffage', 'menuisier', 'macon', 'peintre en batiment'],
  },
  {
    id: 'commerce',
    label: 'Commerce & Management',
    icon: '📊',
    keywords: ['comptable', 'comptabilite', 'financier', 'finance', 'rh', 'ressources humaines', 'marketing', 'commercial', 'auditeur', 'audit', 'management', 'gestionnaire', 'entrepreneur', 'consultant', 'business', 'vente', 'achat', 'logistique commerciale'],
  },
  {
    id: 'droit',
    label: 'Droit & Administration',
    icon: '⚖️',
    keywords: ['avocat', 'notaire', 'juriste', 'huissier', 'greffier', 'droit', 'juridique', 'legal', 'administration', 'administratif', 'fonctionnaire', 'magistrat', 'conseil juridique'],
  },
  {
    id: 'education',
    label: 'Education & Formation',
    icon: '🎓',
    keywords: ['professeur', 'enseignant', 'formateur', 'coach', 'scolaire', 'orthophoniste', 'educateur', 'orientation', 'tutorat', 'formation', 'pedagogie', 'moniteur', 'precepteur'],
  },
  {
    id: 'artisanat',
    label: 'Artisanat & Services',
    icon: '🔧',
    keywords: ['coiffeur', 'coiffeuse', 'estheticien', 'photographe', 'cuisinier', 'chef', 'menuisier', 'peintre', 'artisan', 'couturier', 'bijoutier', 'reparateur', 'nettoyage', 'garde enfant', 'gardien', 'menage'],
  },
  {
    id: 'transport',
    label: 'Transport & Logistique',
    icon: '🚚',
    keywords: ['chauffeur', 'livreur', 'logistique', 'transport', 'douane', 'agent douane', 'pilote', 'conducteur', 'transitaire', 'fret', 'demenagement', 'coursier'],
  },
];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getCategoryFromSpecialite = (specialite) => {
  const lower = normalizeText(specialite);
  if (!lower) return null;

  for (const category of CATEGORIES) {
    if (category.keywords.some((keyword) => lower.includes(keyword))) {
      return category.id;
    }
  }

  return null;
};

const isValidatedProfessional = (professional) => {
  const reviewedStatus = getProfessionalReviewStatus(professional?.id);
  if (reviewedStatus) return reviewedStatus === 'validated';

  const validation = normalizeText(professional?.validation);
  return ['valide', 'validated'].includes(validation);
};

const safelyMatchesCategory = (professional, categoryId) => {
  try {
    return isValidatedProfessional(professional) && getCategoryFromSpecialite(professional?.specialite) === categoryId;
  } catch (error) {
    console.warn('Skipping professional during category filtering:', professional?.id, error?.message || error);
    return false;
  }
};

module.exports.CATEGORIES = CATEGORIES;
module.exports.getCategoryFromSpecialite = getCategoryFromSpecialite;

router.get('/specialites', (req, res) => {
  res.json(CATEGORIES.map(({ id, label, icon, keywords }) => ({
    id,
    label,
    icon,
    exemples: keywords.slice(0, 4),
  })));
});

router.get('/specialites/:id/professionals', async (req, res) => {
  try {
    const { id } = req.params;
    const category = CATEGORIES.find((item) => item.id === id);

    if (!category) {
      return res.status(404).json({ error: 'Categorie introuvable' });
    }

    const { data, error } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('role', 'professional');

    if (error) throw error;

    const professionals = (data || []).filter((professional) => safelyMatchesCategory(professional, id));

    res.json({
      categorie: { id: category.id, label: category.label, icon: category.icon },
      professionals: professionals.map((professional) => mapProfessional(professional)),
    });
  } catch (err) {
    console.error('GET /specialites/:id/professionals error', err?.message || err, err);
    res.status(500).json({ error: 'Impossible de recuperer les professionnels' });
  }
});

module.exports.router = router;
