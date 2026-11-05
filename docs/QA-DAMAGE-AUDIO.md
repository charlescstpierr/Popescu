# QA : signal sonore de dégâts sous charge

Correctif du ticket #48, préparé le 5 novembre 2026 sur le contenu de main
`196365e2a1f221d869500fb4ba2359bb09b528c9`, après la PR #47, puis intégré
sur `ee3e054f9260df5e711f28bb8806aea1501178d8` après la fusion du correctif
clavier #41. L'intégration conserve intégralement les changements du HUD.

## Défaut et correction

Le son `hit` partageait les huit crédits des tirs et ramassages, renouvelés à
18 crédits par seconde. La reproduction du ticket ne lui laisse que 0,7 crédit,
avec seulement 12 voix actives : aucun des deux composants du signal ne partait.
Les effets ordinaires pouvaient également évincer un signal de dégâts déjà lancé.

`hit` contourne maintenant ce quota ordinaire. Sa priorité vaut 1, contre 0 pour
les effets ordinaires et 3 pour les autres signaux protégés. Les deux règles
d'admission, plafond SFX et plafond global, respectent cette hiérarchie.
L'admission de la musique conserve sa politique antérieure.

La protection est bornée : si toutes les places sont occupées par la musique et
des signaux de priorité supérieure, le nouveau signal de dégâts peut être refusé.
Il ne les interrompt pas et ne fait pas dépasser les plafonds. Aucun son n'est
mis en attente pour être rejoué plus tard hors de son contexte.

Les plafonds restent à 32 voix globales et 14 voix SFX. L'intervalle minimal de
`hit` reste de 0,17 seconde. Le moteur n'est pas modifié : les contacts refusés
pendant l'invulnérabilité restent silencieux, avec les durées de 0,55 seconde pour
le gaz et 0,72 seconde ailleurs.

## Contenu conservé

Les deux composants de `hit`, leurs fréquences, enveloppes, durée et niveaux sont
inchangés. Les bus et le volume utilisateur ne changent pas. « Égo de guerre »,
la musique du menu et tous les autres timbres conservent leurs définitions et
empreintes. Aucun dessin, réglage de dégâts, fréquence d'ennemi ni format de
sauvegarde n'est modifié.

## Vérifications

- Six tests nouveaux échouaient sur la base avant la correction du quota et de
  la priorité : signal perdu, éviction par les effets ordinaires, capacité
  réservée inutilisée et trois parcours de dégâts réels.
- La revue indépendante a reproduit un second problème au plafond global des
  voix. Un test rouge a précédé la correction de cette admission.
- Les 23 tests audio passent. Ils couvrent quota épuisé, priorité, plafonds,
  maintien des deux composants, son inchangé, répétitions, pause, muet,
  destruction, dégâts de contact, bouclier et gaz avec le vrai moteur.
- La suite complète du correctif avant intégration passe en exécution séquentielle :
  `node --test --test-concurrency=1 tests/*.test.js`, 1 402 tests réussis,
  aucun échec et aucun test ignoré, en 78,3 secondes. La configuration du projet
  n'est pas modifiée; les limites des lancements parallèles sont détaillées
  ci-dessous.
- Après intégration sur #41, la même commande complète passe avec **1 442 tests
  réussis**, aucun échec ni test ignoré, en 76,2 secondes. Les 425 fichiers
  matérialisés de la nouvelle base avaient été comparés aux empreintes GitHub,
  sans différence. Les 54 fichiers historiques non matérialisés restent intacts
  dans le dépôt distant.
- La revue indépendante du combiné approuve l'intégration : 137 tests ciblés
  réussissent. Un contrôle supplémentaire relie le vrai contrôleur au vrai
  AudioManager avec DOM/AudioContext simulés : dégâts sous quota épuisé, muet
  par Espace, réactivation, pause par Espace et annulation au changement de focus
  restent compatibles. Le contrôleur et les tests de #41 sont inchangés.
- Les cas de plafond global injectent volontairement 20, 24 ou 28 voix musicales.
  Ce sont des tests de résistance de l'allocateur, pas une mesure de charge
  naturelle en partie.
- La revue indépendante approuve le delta final, avec 23 tests audio réussis et
  3 510 allocations synthétiques vérifiées. Dix simulations supplémentaires de
  80 secondes avec les partitions réelles plafonnent à 19 voix dans le menu et
  25 en combat, sans éviction par `hit` d'un signal supérieur.
- Le dossier hors ligne est régénéré. Les 32 ressources de `dist/assets/` et
  leurs copies dans `release/assets/` restent identiques octet par octet.

## Limites

Les lancements parallèles de la suite ont rencontré des arrêts de processus
dans `tests/scenery-art.test.js` et, sur une relance, dans le contrôle natif du
dossier hors ligne. La cause exacte n'est pas établie. Les deux tests du décor
passent isolément; le groupe de 17 tests natifs du décor, des pouvoirs et du
dossier hors ligne passe également. Aucun test n'a été désactivé ou modifié pour
contourner ces échecs.

La vérification utilise Node 24.22.1, le vrai AudioManager et un AudioContext
simulé. Aucune écoute réelle sur navigateur, casque ou téléphone n'a été faite.
Les empreintes de la composition et du WAV approuvé sont vérifiées, mais elles
ne prouvent pas le confort ni l'équilibre perçu du mix en partie. Une écoute
comparative reste à faire avant toute conclusion de qualité auditive.
