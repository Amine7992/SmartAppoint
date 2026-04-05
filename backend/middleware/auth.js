const jwt = require('jsonwebtoken');
// On importe supabase. Si ton fichier est dans le même dossier 'backend', 
// vérifie si le chemin est bien '../supabase' ou './supabase'
const supabase = require('../config/supabase'); 

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d’authentification manquant' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // On va chercher le rôle dans TA table 'utilisateur'
    // Note: On utilise 'supabase.default' au cas où tu as utilisé "export default"
    const supabaseClient = supabase.default || supabase;

    const { data: userTable, error } = await supabaseClient
      .from('utilisateur')
      .select('role')
      .eq('id', decoded.sub)
      .single();

    if (error || !userTable) {
      console.error("Erreur base de données:", error);
      return res.status(403).json({ error: 'Utilisateur non reconnu' });
    }

    req.supabaseAuthToken = token;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: userTable.role, // Ici, il trouvera enfin "professional"
    };

    next();
  } catch (err) {
    console.error("Erreur serveur auth:", err);
    return res.status(500).json({ error: 'Erreur interne authentification' });
  }
};

module.exports = { auth };