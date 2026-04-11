import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt

# 1. Charger le modèle et les données de test réelles (les 20%)
model = joblib.load('modele_prediction_paiement.pkl')
df_inconnu = pd.read_csv('IAmodel_test_pfe.csv')

# 2. Séparer X et Y
y_actual = df_inconnu['cible_paiement']
X_inconnu = df_inconnu.drop(['cible_paiement'], axis=1)

# Note : 'poids_fidelite' est déjà dans le CSV si tu as sauvegardé X_test après calcul
# Sinon, recalcule-le ici :
if 'poids_fidelite' not in X_inconnu.columns:
    X_inconnu['poids_fidelite'] = X_inconnu['score_fiabilite_client'] * np.log1p(X_inconnu['nombre_total_rdv_client'])

# 3. Prédictions
y_pred = model.predict(X_inconnu)

# 4. Affichage de la Matrice
cm = confusion_matrix(y_actual, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Risque', 'Validé'], yticklabels=['No-Show', 'Payé'])
plt.title('Matrice de Confusion sur Données Inconnues (20%)')
plt.show()

print(classification_report(y_actual, y_pred))
