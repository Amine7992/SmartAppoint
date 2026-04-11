import joblib
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report

# 1. Chargement
model = joblib.load('modele_prediction_paiement.pkl')
df_inconnu = pd.read_csv('IAmodel_test_pfe.csv')

# 2. Préparation (X et y)
y_actual = df_inconnu['cible_paiement']
X_inconnu = df_inconnu.drop(['cible_paiement'], axis=1)

# 3. Prédiction
y_pred = model.predict(X_inconnu)

# 4. Visualisation
cm = confusion_matrix(y_actual, y_pred)
plt.figure(figsize=(10, 7))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Prédit: RISQUE', 'Prédit: VALIDÉ'],
            yticklabels=['Réel: NO-SHOW', 'Réel: PAYÉ'])

plt.title('Validation sur Données Inconnues (Test Set)', fontsize=14)
plt.show()

print("\n📊 RAPPORT DE PERFORMANCE FINAL :")
print(classification_report(y_actual, y_pred))