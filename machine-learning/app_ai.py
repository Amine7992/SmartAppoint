from pathlib import Path
import os

from flask import Flask, jsonify, request
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'modele_prediction_paiement.pkl'
BASE_FEATURE_COLUMNS = [
    'delai_reservation_jours',
    'score_fiabilite_client',
    'moyenne_notes_donnees',
    'anciennete_compte_jours',
    'nombre_total_rdv_client',
    'score_distance_geo',
]
FEATURE_COLUMNS = [*BASE_FEATURE_COLUMNS, 'poids_fidelite']

# Chargement unique du modele au demarrage
model = joblib.load(MODEL_PATH)
if hasattr(model, 'n_jobs'):
    model.n_jobs = 1


def enrich_features(row):
    normalized = {column: float(row.get(column, 0)) for column in BASE_FEATURE_COLUMNS}
    normalized['poids_fidelite'] = float(
        row.get(
            'poids_fidelite',
            normalized['score_fiabilite_client'] * np.log1p(normalized['nombre_total_rdv_client'])
        )
    )
    return normalized


@app.get('/health')
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': MODEL_PATH.exists(),
        'model_path': str(MODEL_PATH),
        'feature_columns': FEATURE_COLUMNS,
    })


@app.post('/predict')
def predict():
    try:
        data = request.get_json(force=True) or {}
        features = data.get('features')

        if features is None:
            return jsonify({
                'status': 'error',
                'message': "Le champ 'features' est requis."
            }), 400

        if isinstance(features, dict):
            row = enrich_features(features)
        elif isinstance(features, list):
            if len(features) not in (len(BASE_FEATURE_COLUMNS), len(FEATURE_COLUMNS)):
                return jsonify({
                    'status': 'error',
                    'message': f'{len(BASE_FEATURE_COLUMNS)} ou {len(FEATURE_COLUMNS)} variables sont attendues.'
                }), 400
            columns = BASE_FEATURE_COLUMNS if len(features) == len(BASE_FEATURE_COLUMNS) else FEATURE_COLUMNS
            row = enrich_features({column: float(value) for column, value in zip(columns, features)})
        else:
            return jsonify({
                'status': 'error',
                'message': "Le champ 'features' doit etre un objet ou une liste."
            }), 400

        df_input = pd.DataFrame([row], columns=FEATURE_COLUMNS)
        prediction = int(model.predict(df_input)[0])
        probabilities = model.predict_proba(df_input)[0]

        return jsonify({
            'status': 'success',
            'prediction': prediction,  # 1 = assistera, 0 = risque d'absence
            'risk_score': float(probabilities[0]),
            'attendance_score': float(probabilities[1]),
            'confiance': float(max(probabilities) * 100),
            'features_used': row,
        })
    except Exception as exc:
        return jsonify({'status': 'error', 'message': str(exc)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('FLASK_AI_PORT', '5001')))
