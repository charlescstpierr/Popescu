# Annulation d’un démarrage différé — ticket #40

Base actuelle vérifiée : main `451dedfbc12f1958c22673325bc489f31334c093`, après fusion des correctifs #43 et #44. Delta #40 préparé séparément, sans publication. La première validation avait été effectuée sur `f8d698ea4c038191ca4f24c2f855f2c71c009d22`.

Les 410 fichiers matérialisés correspondent exactement aux blobs du nouveau main. Le patch source #40 s’applique sans conflit; les modules, tests et outils de #43 et #44 restent inchangés. Les 54 entrées distantes absentes localement sont conservées intégralement dans SOURCE_MANIFEST. Une publication doit reprendre la tree distante et ne modifier que les huit chemins de ce delta, jamais traiter ces absences comme des suppressions.

## Comportement

Une tentative de Nouvelle partie ou Recommencer reste annulée après perte de focus, page masquée, pagehide ou navigation vers un autre écran. Retrouver le focus ou revenir au premier écran ne réactive pas cette tentative. Le chargement des images conserve ses protections existantes.

Le verrou de sauvegarde vérifie cette tentative avant de remplacer la partie ou créditer ses compteurs. Une annulation avant acquisition laisse le document intact. Les écritures ordinaires de visibilité/pagehide d’une ancienne partie toujours ouverte peuvent encore enregistrer son état inchangé.

Si l’écriture atomique a déjà terminé, le contrôleur ne tente jamais de restaurer l’ancien document. La nouvelle partie reste en pause de récupération, sans combat, et les compteurs de l’ancienne partie restent crédités exactement une fois. Un écran Crédits ou Réglages ouvert entre-temps reste affiché. Une nouvelle consultation de l’histoire garde sa propre partie temporaire. La première introduction reprend son dialogue seulement sur demande explicite.

Aucune modification de dessin, de texte du jeu, de clé de stockage, de format v15 ou de règle de combat. Le dossier hors ligne est régénéré depuis les sources.

## Vérifications

- `node --test tests/start-lock-cancellation.test.js` : 25 tests, dont 14 parcours avant acquisition, six après écriture, navigation vers l’histoire, confirmation de jeu sans sauvegarde, démarrage normal et première introduction.
- Sur le nouveau main 451dedfb avant correction : 24 des 25 tests échouent, principalement sur le HUD indésirable et le remplacement de la sauvegarde. Le démarrage normal réussit. Après correction : 25 tests réussis, aucun échec ou test ignoré.
- Les tests utilisent le vrai contrôleur, Game, LockedRunStore et le LockManager natif de Node 24.22.1. Seuls le DOM, le rendu et l’audio sont adaptés. Les tests natifs portent une raison explicite d’ignorance si Node ne fournit pas LockManager.
- `npm test` après régénération sur 451dedfb : **1 347 tests réussis, aucun échec, aucun test ignoré**. Revue indépendante du delta sur cette même base : 164 tests ciblés, puis 1 347 tests complets réussis, sans défaut bloquant détecté.
- `python3 scripts/export-offline.py`, puis `node scripts/inspect-standalone.cjs /tmp/toma-start-lock.png` : assemblage courant, images, démarrage, sauvegardes, reprise et rendu natif.
- `python3 scripts/export-standalone.py`, puis `node scripts/inspect-standalone.cjs /tmp/toma-start-lock-standalone.png generated/standalone/Toma_Popescu_JOUER.html` : export monofichier facultatif et même parcours natif réussis.
- `node scripts/verify-upgrade-draft.mjs` : 10 000 tirages, aucun doublon ni tirage dépourvu d’attaque ou de survie dans la charge vérifiée.
- Export courant : 649 392 octets, 32 images inchangées et 34 entrées du manifeste vérifiées. Monofichier facultatif : 27 430 146 octets, sous generated/standalone. Les deux exports sont identiques à l’intégration combinée #40/#43 précédemment revue; content précède speech et upgrade-draft précède engine.

Aucune reproduction dans un navigateur réel ou sur téléphone physique n’est revendiquée. Le délai après commit est contrôlé dans l’adaptateur du verrou afin de vérifier le comportement même si sa promesse termine après une nouvelle interaction.
