from pathlib import Path
import os

from flask import Flask, jsonify, request
import joblib
import pandas as pd

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'modele_prediction_paiement.pkl'
FEATURE_COLUMNS = [
    'delai_reservation_jours',
    'score_fiabilite_client',
    'moyenne_notes_donnees',
    'anciennete_compte_jours',
    'nombre_total_rdv_client',
    'score_distance_geo',
]

# Chargement unique du modele au demarrage
model = joblib.load(MODEL_PATH)


@app.get('/health')
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': MODEL_PATH.exists(),
        'model_path': str(MODEL_PATH),
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
            row = {column: float(features.get(column, 0)) for column in FEATURE_COLUMNS}
        elif isinstance(features, list):
            if len(features) != len(FEATURE_COLUMNS):
                return jsonify({
                    'status': 'error',
                    'message': f'{len(FEATURE_COLUMNS)} variables sont attendues.'
                }), 400
            row = {column: float(value) for column, value in zip(FEATURE_COLUMNS, features)}
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
