const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d’authentification manquant' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabaseClient = supabase.default || supabase;

    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData?.user?.id) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    const { data: userTable, error } = await supabaseClient
      .from('utilisateur')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (error || !userTable) {
      console.error('Erreur base de données:', error);
      return res.status(403).json({ error: 'Utilisateur non reconnu' });
    }

    req.supabaseAuthToken = token;
    req.user = {
      id: authData.user.id,
      email: authData.user.email,
      role: userTable.role,
    };

    next();
  } catch (err) {
    console.error('Erreur serveur auth:', err);
    return res.status(500).json({ error: 'Erreur interne authentification' });
  }
};

module.exports = { auth };