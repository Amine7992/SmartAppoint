const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/predict', async (req, res) => {
  try {
    const response = await axios.post('http://127.0.0.1:5001/predict', req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur IA:', error.message);
    res.status(500).json({ error: 'Erreur serveur IA' });
  }
});

module.exports = router;