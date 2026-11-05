# Quatre créatures : direction d’animation

Base : main `8db2fe06fe594cb23b8c0b70d0c74ec2dcbe602d`. Ce lot exclut Toma, Charles, les boss principaux et les correctifs de lisibilité encore séparés.

## Direction retenue

Conserver les corps entiers, contours foncés, couleurs et accessoires existants. Ajouter des poses peintes dédiées plutôt que déformer des morceaux de l’ancien corps ou superposer des fondus fantômes. Six poses par créature : repos, deux pas opposés, anticipation, action, récupération. La simulation reste inchangée; les étapes visuelles utilisent les horloges d’attaque déjà sauvegardées.

- **Paon Paparazzi** : silhouette haute, éventail vert/bleu et appareil doré. Parade, appareil porté à l’œil, déclenchement, satisfaction. Son cadre dangereux garde exactement sa géométrie; la lumière ne doit pas couvrir l’animal.
- **Crapaud Alpha** : corps ocre trapu, gorge rose, bandeau noir et sifflet. Petits pas lourds, compression, suspension, réception épuisée. La trajectoire et le point d’impact restent ceux du moteur.
- **Rat Huissier** : corps brun, gilet turquoise, sac violet et reçus blancs. Marche pressée, préparation du reçu, trois émissions rythmées, retour à sa liasse.
- **Caméléon Discount** : corps bas vert, veste violette, lunettes et queue dorées. Pas furtifs, bouche ouverte pendant l’anticipation, langue depuis la bouche, rétraction. Le camouflage et le corridor de collision restent identiques.

## Cohérence et garde-fous

Les quatre créatures récupèrent le retour de dégâts, le charme et la barre de vie des autres ennemis. Les repères s’alignent sur leur silhouette, y compris sur le crapaud aérien. Aucun nouveau calcul de dégâts, aucun état d’animation persistant ni nouveau format de sauvegarde.

La feuille est générée avec l’outil d’image intégré depuis l’atlas approuvé; le rangement des figures utilise un script reproductible sans retouche de leur peinture ou de leur alpha. Les anciens dessins restent conservés. L’atlas consommé par le jeu est versionné séparément.

La vérification comprend tests de poses/ancres/camouflage, géométrie et sauvegardes inchangées, captures du vrai Renderer, planches de personnages, séquences d’attaque, coût de rendu et revue visuelle indépendante. Une séquence Canvas native ne prouve pas la fluidité sur téléphone.
