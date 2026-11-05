# Revue indépendante des animations de Charles

## Verdict

**Favorable sur le candidat final examiné : aucun défaut bloquant identifié.** Revue effectuée après réception du nouvel atlas et du code intégré, et non sur la base seule. Elle ne vaut pas validation de performances mobiles ni de navigateur.

## Base et protocole

Base locale : `popescu-charles-site-publish-1334`, contenu du site v42 / PR #59 (`993b70b`). Candidat : `popescu-charles-motion-1343`.

Le script indépendant `scripts/inspect-charles-motion.mjs` utilise les vrais `Game` et `Renderer`, déclenche l’arrivée par franchissement du seuil 1199,99 → 1200 s, conserve sept témoins dont quatre EGO déjà actifs et capture onze secondes de simulation à 24 Hz. Il ne touche à aucun stockage de navigateur. L’extension après huit secondes couvre intro→hover puis hover→shock_warning.

Exécution :

```
node scripts/inspect-charles-motion.mjs /tmp/charles-motion-candidate
node scripts/inspect-charles-motion.mjs /tmp/charles-motion-baseline /chemin/vers/popescu-charles-site-publish-1334
```

Pour limiter la mémoire du processus de QA, chaque variante peut être exécutée séparément avec `QA_VARIANT=390x844`, `390x844-reduced`, `320x568` ou `320x568-reduced`.

Chaque exécution complète produit quatre MP4 silencieux, quatre planches de vingt images et 265 PNG par variante : 390×844 et 320×568, effets normaux et réduits. Les planches utilisent des snapshots PNG indépendants, pas des surfaces Canvas mutables réutilisées. Les poses du rapport proviennent de `renderer.charles.pose`, avec repli sur l’ancien helper pour la base.

Assertions : rendu sans modification de sauvegarde, restauration identique aux vingt points de contrôle, un seul claquement, zéro ennemi après disparition, zéro élimination ajoutée, record de survie figé à 1200 s. Le rapport JSON contient poses, populations, phases, sons et tailles de caches.

## Résultats

- Suite Charles indépendante du candidat : **103/103 tests réussis**, aucun ignoré. Journal local : `/tmp/charles-motion-final-tests.log`.
- Quatre variantes candidates terminées dans `/tmp/charles-motion-candidate`.
- Quatre variantes de base terminées. Après un arrêt SIGKILL du second rendu groupé de base, les trois variantes restantes ont été relancées dans des processus séparés et ont terminé. Cause de cet arrêt non établie; ce n’est pas une preuve de défaut du rendu de production. Les premiers rendus de base sur huit secondes avaient tous terminé.
- Comparaison exacte base/candidat : mêmes événements sonores et heures, mêmes caches, mêmes populations et phases aux vingt points de chaque variante. Pas de changement de `engine.js`, `charles.js` ou `run-save.js`.
- Toutes les nouvelles poses sont peintes par un unique `drawImage` de cellule complète, avec translation uniquement. Pas de rotation, déformation, assemblage de membres ou fondu entre corps. Le secours utilise toujours les anciennes peintures si l’atlas échoue.

## Inspection visuelle réellement effectuée

Planches candidates intégrales 390×844 normale, 320×568 normale et réduite examinées, ainsi que la planche de base 320×568. Le vol entre depuis la gauche, le freinage et le redressement deviennent progressifs, la main monte puis claque et revient. Le visage reste ancré pendant les changements de pose. La cape change effectivement de peinture plutôt que de subir une déformation.

Le corps, la tête et la main restent dans le champ utile après l’entrée volontaire depuis le bord gauche. À 320×568, le claquement se lit près du visage; son cercle est centré sur la main et non sur l’ancienne position des doigts. Les ennemis disparaissent ensemble pendant que Toma et la compagne restent visibles. Le mode réduit conserve le geste et réduit son cercle, sans nouvel effet plein écran. Aucun saut gênant observé aux passages intro→hover et hover→shock_warning.

Les MP4 ont été décodés avec FFmpeg. Le 390×844 réduit a été examiné en planche de vidéo échantillonnée à 2 Hz jusqu’à onze secondes; le claquement 320×568 normal a été examiné sur vingt images adjacentes extraites de la vidéo à partir de 3,3 s, agrandies sans lissage. Cela confirme l’ancrage du cercle pendant snap→recoil et la disparition. FFprobe confirme 265 images, 24 Hz et les dimensions prévues. Il s’agit d’une inspection de photogrammes décodés, pas d’un visionnement temps réel avec audio.

## Empreintes du code et de l’art examinés

- `dist/charles-art.js` : `95f2f9e27721afc5bf88e30ed80c6837cec8b7413802c41c19001ec2df013913`
- `dist/charles-effects.js` : `c62918ac4be6f5661116be6ea97ad70da0fbca70e99a5fc7438e4c0809a219eb`
- `dist/renderer.js` : `dcd6b56ed85ebca1bb8ad87fd27393942533a85b48b30011b4bd61ae237ff3cd`
- `dist/assets/charles-motion-v1.png` : `8e0f52851b916b1af85a0b203b056996b08ee6d9b58b947467debb5b5e065bc4`
- `dist/charles-motion-frames.js` : `d960c0db1e8d94f063afc8ae4f5abe8c0a6cad8d4befd52c9510284f2dd09ffd`

## Limites

Canvas natif hors ligne uniquement. Pas de validation du DOM/HUD navigateur, du tactile, d’un téléphone physique ou de performances mobiles. Les MP4 sont silencieux. Cette revue ciblée ne remplace pas la suite complète, la reconstruction des exports ni la vérification du site publié, réalisées séparément par l’intégrateur.
