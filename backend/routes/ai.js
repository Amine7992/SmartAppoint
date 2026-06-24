const express = require('express');
const router = express.Router();
const axios = require('axios');

const aiPredictUrl = process.env.AI_PREDICT_URL ||
  (process.env.AI_SERVICE_URL
    ? process.env.AI_SERVICE_URL.replace(/\/predict\/batch\/?$/, '/predict')
    : 'http://127.0.0.1:5001/predict');

router.post('/predict', async (req, res) => {
  try {
    const response = await axios.post(aiPredictUrl, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Erreur IA:', error.message);
    res.status(500).json({ error: 'Erreur serveur IA' });
  }
});

module.exports = router;
