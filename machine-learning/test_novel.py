import pandas as pd
import joblib
import numpy as np

# 1. Chargement du modèle
try:
    model = joblib.load('modele_prediction_paiement.pkl')
    print("✅ Modèle chargé avec succès.")
except FileNotFoundError:
    print("❌ Erreur : Le fichier 'modele_prediction_paiement.pkl' est introuvable.")
    exit()

# 2. Définition des colonnes (DOIT être dans le même ordre que l'entraînement)
columns = [
    'delai_reservation_jours', 
    'score_fiabilite_client', 
    'moyenne_notes_donnees', 
    'anciennete_compte_jours', 
    'nombre_total_rdv_client', 
    'score_distance_geo'
]

# 3. Création des scénarios réels
print("\n🔥 EXÉCUTION DU STRESS TEST :")

scenarios_data = [
    # Scénario 1 : Le "Profil Parfait" (Vieux client, fidèle, habite à côté)
   [0, 1.0, 5.0, 1000, 50, 0.1], 
    
    # Scénario 2 : Le "Profil à Risque" (Nouveau, score bas, très loin, réservé 1 mois à l'avance)
    [30, 0.15, 2.0, 1, 0, 150.0],
    
    # Scénario 3 : Le "Profil Moyen" (Compte récent mais bon score de fiabilité)
    [5, 0.80, 4.0, 30, 2, 5.0]
]

scenarios = pd.DataFrame(scenarios_data, columns=columns)

# 4. Prédictions et Probabilités
preds = model.predict(scenarios)
probs = model.predict_proba(scenarios)

# 5. Affichage des résultats
print("-" * 50)
for i, p in enumerate(preds):
    label = "✅ VALIDÉ AUTOMATIQUEMENT" if p == 1 else "⚠️ VÉRIFICATION REQUISE (Risque)"
    confiance = probs[i][p] * 100
    
    print(f"Scénario {i+1} :")
    print(f"  Résultat  : {label}")
    print(f"  Confiance : {confiance:.2f}%")
    print("-" * 50)