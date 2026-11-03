# Péli Zodiaque — ascendant câlin

Boss majeur inspiré du concept approuvé : pélican anthropomorphe blanc, petite bedaine, plumet mauve, veste et short violets étoilés, grand bec orange et cartes de tarot. Aucun dessin existant de Toma ou d’un autre personnage n’est remplacé.

## Rencontre

Première arrivée à six minutes, annoncée cinq secondes avant. La prochaine rencontre est prévue sept minutes après son apparition. Péli et Travestia ne sont jamais ajoutés simultanément par le calendrier : un boss déjà vivant retarde le prochain, avec un nouveau compte à rebours lisible. Le dernier direct conserve le boss déjà présent au lieu de superposer les deux.

Péli possède 760 PV de base, ajustés par la progression existante. Sa défaite donne les mêmes récompenses de boss que Travestia : expérience, gemmes, soin et coffre. Il ne remplace pas une espèce ordinaire et les réservations de place ne retirent jamais un boss vivant.

## Attaques

- **Câlin cosmique** : ailes ouvertes et couloir fixe pendant 1,25 s, puis charge de 0,65 s. Un pas de côté permet de sortir du couloir. Les murs arrêtent le déplacement. Aucune poursuite de la cible pendant la charge.
- **Cercle du zodiaque** : préparation de 1,4 s, puis anneau en expansion pendant 1,25 s. L’ouverture reste au même angle que pendant la préparation. Le centre et l’ouverture ne sont pas une zone de dégâts.
- **Tarot rétrograde** : préparation de 1,1 s, trois cartes partent dans des directions fixes puis reviennent en 2,2 s. Il faut éviter le retour aussi. Les cartes sont indépendantes des projectiles de Toma.

Chaque attaque peut toucher Toma et sa compagne une seule fois. La récupération est inoffensive. Charme et Mode avion annulent l’attaque et sa réplique en attente, y compris au milieu d’une image. Les annonces et les dégâts partagent les mêmes dimensions. Les cartes ne créent aucune liste de projectiles persistante ; trois positions dérivées suffisent.

## Répliques et sauvegardes

Les échanges portent sur l’astrologie, le tarot, les câlins et l’ego fictif de Toma. Toma est Poissons ascendant Sagittaire. Ses réactions restent vulgaires, explosives et séparées, selon la demande. Les échanges n’ouvrent jamais un écran modal et respectent les réglages de bavardage.

La sauvegarde passe au schéma v5 et migre les parties v1 à v4 sans changer les records ni les découvertes. Direction verrouillée, progression de l’attaque, trajet des cartes, dégâts déjà reçus et réplique en attente sont conservés. Les positions incohérentes, attaques sans durée, doubles boss et états incomplets sont rejetés. Les calculs de visibilité restent bornés, même devant un état mémoire incohérent.

## Vérification

`npm test` couvre le moteur, la restauration de chaque phase, les interruptions, les récompenses, les plafonds et la progression. `node scripts/inspect-pelican.mjs proof/pelican` produit les vrais rendus Canvas du jeu à 390 × 844 et vérifie que le rendu ne modifie pas la simulation. L’export autonome doit être régénéré après une modification de `dist/`.

Les mesures Canvas natives ne certifient pas les performances ni les contrôles tactiles sur iPhone ou Android physiques.
