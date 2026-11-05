# Cabane et joystick : correctif local du 5 novembre 2026

## Base et portée

Base d’intégration : `main` GitHub `97a58931459bb08bc4e960a8e1229c51d65406ed` après #56, arbre `3b45aca59fd7ccfccf5caa28a24fccb8a87b8d5a`, matérialisé par le commit local `bb08be7469b987a60ac7d39f4a3b6f94086c64ef`. Les 545 fichiers matérialisés correspondent aux blobs du manifeste publié de cette base. Les 54 fichiers distants non matérialisés restent inchangés dans le manifeste candidat.

Le correctif d’origine avait été validé sur `8e6e230516597ba7f06d1ec7f5312e5163a29498` avec 1 483 tests. Ses hunks source sont appliqués sans conflit sur #56; les anciens exports et manifestes ne sont pas repris. Les animations des ennemis et de Charles ainsi que le correctif d’avertissement d’explosion sont conservés. Cette intégration finale reprend le gel local Toma + portraits `605c88c71e7203bb986ec3fcd17a50cad6db0c71`, dont les 567 fichiers matérialisés correspondent exactement au manifeste combiné. Le seul conflit était le contexte de fin de `styles.css` : les six lignes portraits sont conservées, puis les neuf lignes Cabane sont ajoutées. Le diff indépendant confirme que les cinq fichiers source/adaptateurs ont exactement les mêmes lignes ajoutées et retirées que le correctif Cabane original. Aucun fichier graphique, module d’animation, moteur ou contenu des dialogues n’est modifié par cette intégration.

Cette livraison locale traite le ticket #54. Aucune publication, fusion ou modification du Site. Aucun accès aux sauvegardes personnelles. Les tests emploient des états construits et un stockage éphémère en mémoire.

## Changements

- La carte détaillée de découverte est déplacée dans la pause. Elle ne peut donc plus couvrir Toma, un ennemi ou une attaque pendant le combat. Nom, effet, durée, barre et explication d'approche restent accessibles avec le bouton Pause existant.
- Un résumé court remplace le sous-titre du chronomètre dans son empreinte existante : `CABANE PROCHE`, `SOIN · 16 s`, `LIEU ÉPUISÉ`. Les cinq découvertes sont couvertes. Le texte complet est également présent dans son libellé accessible. Le sous-titre habituel revient en l'absence de découverte et pendant l'épilogue Charles.
- Le résumé utilise une ligne de 12 px, une police monospace de 9 px et le minimum existant de 85 px. Il n'ajoute aucun panneau au terrain et ne masque pas le compteur par une ellipse. L'appréciation de sa lisibilité sur téléphone reste à faire.
- Le joystick mesure un rectangle CSS fondé sur les quatre `safe-area-inset-*`. Il borne son disque et toute la course de 33 px du pouce, avec dimensions DOM réelles, variante de 100 px et bordures. Une entrée dans la zone système, hors zone de mouvement ou dans une surface trop petite pour le contrôle n'est pas capturée.
- La bordure de l'app est déduite de l'origine CSS. Un redimensionnement annule la capture et la direction, comme un relâchement, une annulation ou la pause. Le placement horizontal au repos respecte aussi l'inset gauche.

Moteur, caméra, dégâts, soins, durées, illustrations et formats de sauvegarde sont inchangés.

## Vérifications

Commandes exécutées depuis la racine :

```sh
node --test tests/discovery-controls-layout.test.js tests/asset-loading-ui.test.js
node --check dist/app.js
python3 scripts/export-offline.py
python3 scripts/export-standalone.py
node --test --test-concurrency=1 tests/*.test.js
node scripts/inspect-standalone.cjs /tmp/cabane-offline.png
node scripts/inspect-standalone.cjs /tmp/cabane-standalone.png generated/standalone/Toma_Popescu_JOUER.html
git diff --check
```

- 16 nouveaux tests contrôleur/structure, plus 16 tests de chargement/entrée : 32 réussites.
- Suite complète de cette intégration, exécutée en séquentiel : 1 571 tests réussis, aucun échec ni test ignoré.
- Le premier passage avant correction échouait sur 7 des 14 cas initiaux. Un test ajouté ensuite reproduisait séparément le dépassement de 1 px lié à la bordure de l'app. Ils passent après correction.
- La matrice de géométrie couvre 320×568, 390×844 et 460×320, avec insets nuls et `{haut:44, bas:34, gauche:44, droite:12}`. Quatre points d'activation et huit directions sont vérifiés par cas, soit 192 positions du pouce, avec bornage du disque également.
- Entrées : second doigt ignoré, boutons préservés, relâchement, annulation, perte de capture, redimensionnement et pause. Les adaptateurs existants exposent désormais les métriques DOM utilisées par le vrai contrôleur.
- Découverte : proximité, effet actif après départ, cooldown, absence, pause, retour au jeu et Charles. Le HUD ne modifie pas l'état de simulation. Le soin reprend à 2 PV/s après la pause, sans écoulement pendant celle-ci.
- L'analyse du vrai HTML avec le parseur standard Python garantit que la carte détaillée appartient à la pause et non au HUD, et que le résumé partage le conteneur du sous-titre du chronomètre. Python 3 était déjà requis pour les tests d'export du dépôt.
- Revue indépendante du diff et exécution indépendante des 16 nouveaux tests : aucun défaut bloquant trouvé.
- Dossier hors ligne et monofichier facultatif régénérés puis exécutés avec l’adaptateur DOM et Canvas natif. Les 40 assets du gel Toma + portraits restent intacts. Le HTML hors ligne mesure 753 748 octets; le monofichier facultatif mesure 32 636 007 octets. Un second export hors ligne reproduit exactement les mêmes octets.

## Limites explicites

La géométrie DOM des tests est fournie par des fixtures. Ce n'est ni un moteur CSS, ni une validation navigateur, ni un contrôle tactile physique. Aucun navigateur n'a été utilisé : les restrictions antérieures de navigation ont été respectées. Les encoches physiques, le comportement du geste système, le rendu du petit compteur, les interactions de safe areas lors d'une rotation réelle et les performances sur téléphone restent à vérifier sur appareil.

La correction retire l'obstruction ajoutée par la carte de découverte. Elle ne prétend pas que les autres éléments préexistants du HUD ne peuvent jamais recouvrir une menace.
