# Travestia, candidat local non publié

## Contenu
- Chameau entier approuvé, jupe rouge, maquillage, barbe, veste et bottes. Douze peintures conservées dans un atlas transparent; aucune image de Toma remplacée.
- Apparition proposée à 4 minutes, puis au plus une toutes les 4 minutes; un seul Travestia actif. 680 PV de base avec progression existante, récompenses de boss.
- Préparation annoncée et immobile: 1,2 seconde, ou 4,2 secondes quand l'échange démarre. Queue en hélicoptère pendant 1,4 seconde, récupération inoffensive pendant 1,2 seconde, puis reprise de la poursuite. Cercle de danger de 105 px identique au calcul des dégâts. Une frappe au maximum par cible et par attaque. Charme et Mode avion interrompent l'attaque.
- Trois échanges espacés de 18 secondes minimum. Premier: « Vas-y Toma, je sais que tu veux toucher ma queue, touche-la Toma » puis « FUCKK ! ». Les suivants reprennent les taquineries demandées et « T’es pas ben, men !! ». Aucun dialogue modal créé par le boss. Les réglages existants peuvent masquer les échanges.
- La course suit le déplacement réel, l'arrêt montre la pose immobile. Les pauses figent les images; le moteur de rendu ne modifie pas la simulation.

## Vérification
95 tests Node réussis. Tests spécifiques: dégâts annoncés, esquive, une frappe par attaque, interruptions, récupération, pause, limite de population, récompenses, apparition, ordre des échanges et réservation de leur lisibilité. Régression graphique native: 65 entrées complètes Toma, 64 poses de course et 64 de grand écart, aucun changement d'état par le rendu, caches bornés. Les fichiers hero et les anciens assets sont identiques à la copie de référence.

Preuves: `proof/travestia-phases.png` montre le véritable Renderer à 390×844 par panneau; `proof/travestia-gameplay.mp4` montre le véritable moteur et une retraite sans dégâts. Cette vidéo est une simulation de rendu, pas une capture d'un téléphone ou de l'interface DOM complète. Elle ne présente pas le son ni les bulles de dialogue de l'interface.

Le HTML autonome a été régénéré dans `release/Toma_Popescu_JOUER.html`. Aucun déploiement ni envoi au dépôt. Les réglages de durée, puissance et apparition sont des choix d'implémentation ajustables, pas des chiffres imposés par l'utilisateur.

## Revue indépendante
La revue a confirmé l'apparence, les phases, l'immobilisation et la correspondance du cercle avec les dégâts. Trois petites remarques ont été corrigées: seconde barre de PV, course basée sur l'horloge, chevauchement possible des répliques. Les tests correspondants passent.

## Limites
Le contrôle tactile, les performances iPhone/Android et les bulles DOM en navigateur physique restent à vérifier. Les réactions prioritaires au vrai cri du coq conservent leur comportement antérieur et peuvent interrompre un échange.
