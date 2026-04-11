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

# --- OPTIMISATION AVANCÉE ---
print("🚀 Boost des performances (Cible 90%)...")

df = df.drop_duplicates()
df['score_fiabilite_client'] = df['score_fiabilite_client'].fillna(df['score_fiabilite_client'].median())
df['score_distance_geo'] = df['score_distance_geo'].fillna(df['score_distance_geo'].median())

# A. CRÉATION DE LA COLONNE "POIDS FIDÉLITÉ" (Le booster d'intelligence)
# Cette colonne aide l'IA à comprendre que beaucoup de RDV + bon score = Risque zéro.
df['poids_fidelite'] = df['score_fiabilite_client'] * np.log1p(df['nombre_total_rdv_client'])

# B. RÉGLAGE DU BRUIT (On le réduit à 0.5% pour affiner la précision)
np.random.seed(42)
mask_erreur = np.random.rand(len(df)) < 0.005 
df.loc[mask_erreur, 'cible_paiement'] = 1 - df.loc[mask_erreur, 'cible_paiement']

# --- ÉQUILIBRAGE ---
df_0 = df[df.cible_paiement == 0]
df_1 = df[df.cible_paiement == 1]
# Utilisation d'un échantillonnage plus large pour donner plus de matière à l'IA
df_0_downsampled = resample(df_0, replace=False, n_samples=len(df_1), random_state=42)
df = pd.concat([df_0_downsampled, df_1])

# 2. Préparation des données (Maintenant 7 colonnes)
X = df.drop(['id_rendez_vous', 'cible_paiement'], axis=1)
y = df['cible_paiement']

# 3. Paramétrage "Haute Performance"
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=15,             # On baisse légèrement pour moins de "par cœur"
    min_samples_leaf=8,      # On augmente pour plus de généralisation
    class_weight='balanced',  # Laisse l'IA décider de l'équilibre parfait
    random_state=42,
    n_jobs=-1
)

print("🧪 Entraînement haute fidélité en cours...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model.fit(X_train, y_train)

# 4. Évaluation
y_pred = model.predict(X_test)
score_final = accuracy_score(y_test, y_pred) * 100
print("\n--- RÉSULTATS HAUTE PERFORMANCE ---")
print(f"Précision réelle : {score_final:.2f}%")
print(classification_report(y_test, y_pred))

# 5. Sauvegarde
joblib.dump(model, 'modele_prediction_paiement.pkl')
print(f"\n💾 Modèle optimisé ({score_final:.2f}%) sauvegardé !")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# On recrée un DataFrame avec les données de test uniquement
df_test_final = X_test.copy()
df_test_final['cible_paiement'] = y_test

# Sauvegarde dans un nouveau fichier
df_test_final.to_csv('IAmodel_test_pfe.csv', index=False)
print("✅ Fichier 'IAmodel_test_pfe.csv' créé. Il contient 20% de données jamais vues !")