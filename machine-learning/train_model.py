import pandas as pd
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils import resample

# 1. Chargement
try:
    df = pd.read_csv('IAmodel.csv')
    print(f"✅ Dataset chargé : {len(df)} lignes trouvées.")
except FileNotFoundError:
    print("❌ Erreur : 'IAmodel.csv' introuvable.")
    exit()

# --- NETTOYAGE SANS COLONNE SUPPLÉMENTAIRE ---
print("🧹 Optimisation du modèle sur les 6 variables d'origine...")

df = df.drop_duplicates()
# On remplace les vides par la médiane pour ne pas fausser les prédictions
df['score_fiabilite_client'] = df['score_fiabilite_client'].fillna(df['score_fiabilite_client'].median())
df['score_distance_geo'] = df['score_distance_geo'].fillna(df['score_distance_geo'].median())

# Bruit léger pour le réalisme (1%)
np.random.seed(42)
mask_erreur = np.random.rand(len(df)) < 0.01 
df.loc[mask_erreur, 'cible_paiement'] = 1 - df.loc[mask_erreur, 'cible_paiement']

# --- ÉQUILIBRAGE ---
df_0 = df[df.cible_paiement == 0]
df_1 = df[df.cible_paiement == 1]
df_0_downsampled = resample(df_0, replace=False, n_samples=len(df_1), random_state=42)
df = pd.concat([df_0_downsampled, df_1])

# 2. Préparation des données (On garde UNIQUEMENT les 6 colonnes de base)
X = df.drop(['id_rendez_vous', 'cible_paiement'], axis=1)
y = df['cible_paiement']

# 3. Entraînement équilibré (Ratio 1.5 pour ne pas être trop sévère)
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,           # Profondeur modérée pour mieux généraliser
    min_samples_leaf=15,    # Groupes plus grands pour accepter les bons profils
    class_weight={0: 1.5, 1: 1}, # Sévérité ajustée : protège le pro sans bloquer tout le monde
    random_state=42
)

print("🧪 Entraînement en cours...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model.fit(X_train, y_train)

# 4. Évaluation
y_pred = model.predict(X_test)
print("\n--- RÉSULTATS (6 VARIABLES) ---")
print(f"Précision réelle : {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred))

# 5. Sauvegarde
joblib.dump(model, 'modele_prediction_paiement.pkl')
print("\n💾 Modèle standard (6 colonnes) sauvegardé !")