import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_auc_score, roc_curve, classification_report

# 1. Chargement du modèle et des données de test
model = joblib.load('modele_prediction_paiement.pkl')
df = pd.read_csv('IAmodel.csv').sample(50000) # On prend 50k lignes au hasard pour le test

# Nettoyage rapide pour le test
X_test = df.drop(['id_rendez_vous', 'cible_paiement'], axis=1)
y_actual = df['cible_paiement']

# 2. Prédictions
y_pred = model.predict(X_test)
y_probs = model.predict_proba(X_test)[:, 1] # Probabilités pour la classe 1

# 3. RÉSULTAT 1 : La Matrice de Confusion (Vision Efficace)
cm = confusion_matrix(y_actual, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Matrice de Confusion : Est-ce que l\'IA se trompe souvent ?')
plt.ylabel('Réalité (0=No-Show, 1=Payé)')
plt.xlabel('Prédiction de l\'IA')
plt.show()

# 4. RÉSULTAT 2 : Score AUC-ROC (Le verdict définitif)
# Un score de 0.5 = Hasard / 1.0 = Parfait. 
# Si tu es entre 0.75 et 0.85, ton modèle est excellent.
auc = roc_auc_score(y_actual, y_probs)
print(f"\n⭐ VERDICT DÉFINITIF (Score AUC) : {auc:.4f}")

# 5. Rapport détaillé
print("\nDÉTAILS DES PERFORMANCES :")
print(classification_report(y_actual, y_pred))