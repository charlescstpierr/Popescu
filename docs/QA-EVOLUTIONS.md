# Évolutions et relances payantes

Reconstruction à partir du code GitHub `893adaf5715c891a6137427fd61094b3f5dc5105`, après la perte de la copie de travail précédente. Les captures approuvées ont servi de référence; il ne s’agit pas d’une récupération de cette copie perdue.

## Comportement

- Lamborghini et Selfie au rang 3 proposent **Lambo de milliardaire**. Une fois choisie, chaque voiture garde son attaque et émet deux salves de trois billets. Les billets et la voiture réutilisent les dessins existants.
- Blonde IA et Charisme au rang 3 proposent **Amour viral**. Un cœur peut frapper trois ennemis distincts au maximum, avec une liaison rose vers sa prochaine cible. Les dégâts et le charme existants sont conservés.
- Les évolutions sont des choix permanents uniques. Elles ne consomment pas les rangs des pouvoirs requis.
- Chaque niveau permet deux relances, à 5 puis 10 pièces. Une offre sans carte différente possible ne peut pas être rachetée. Le combat reste arrêté.
- Les pièces disponibles diminuent après achat; le compteur de dépenses permet de calculer toutes les pièces gagnées. Records et résultats comptent les pièces gagnées, y compris celles dépensées.

## Sauvegarde

La v7 garde les choix exacts, le hasard, la relance utilisée, les dépenses, les évolutions et les attaques en cours. Le calendrier de boss d’une sauvegarde v6 reste identique. Les sauvegardes plus anciennes conservent leur migration d’origine, puis reçoivent les nouveaux champs neutres.

Le contrôleur prépare la relance sur une copie arrêtée et enregistre les nouvelles cartes et leur coût dans une seule écriture. Tant que celle-ci n’a pas réussi, les cartes et le solde actifs restent inchangés. Un quota dépassé ou un conflit d’onglet conserve l’ancienne offre sans dépense. Les clics répétés et les sauvegardes de fermeture ne peuvent pas écraser un achat en cours.

## Vérifications

Le moteur, la sauvegarde et le contrôleur réel sont couverts: conditions des rangs, refus des doublons, deux salves de trois, plafond de trois cibles avant/après rechargement, prix et limite, nouveau niveau, cartes exactes après rechargement, interruption d’achat, double-clic, fermeture pendant achat, conflit d’onglet, crédits cumulés et conservation du directeur de boss.

Les rendus Canvas natifs 390 × 844 et 320 × 640 utilisent les vrais modules et images. Le rendu ne modifie pas la simulation. L’export HTML autonome est régénéré et testé avec l’adaptateur DOM/Canvas natif.

La prévisualisation navigateur gérée n’était pas disponible. Ces contrôles ne constituent donc pas une validation de la mise en page CSS dans un navigateur ni du toucher sur un téléphone physique.
