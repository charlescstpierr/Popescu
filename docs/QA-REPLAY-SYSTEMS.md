# Records et historique, sans changement visuel

## Périmètre

Ajout non visuel au stockage local existant. Aucun écran, texte d'interface,
portrait, animation, paramètre de combat ou tirage aléatoire n'est modifié.
Les données sont prêtes pour une interface ultérieure à valider par mockup.
Le menu continue donc d'afficher son ancien record global.

## Données

L'enveloppe de sauvegarde conserve ses totaux. L'intégration du calendrier de
dialogue porte sa version à 11 et accepte toujours les sauvegardes v10. Le champ
facultatif `replay`, versionné séparément à 1, contient :

- `legacyBest` : l'ancien record global, conservé sans lui inventer une difficulté.
- `records` : les quatre difficultés, chacune séparée en `survival` et `endless`.
  Chaque catégorie garde ses meilleurs temps, nombre d'ennemis vaincus, pièces
  gagnées et niveau. Ces maxima peuvent provenir de parties différentes.
- `history` : les 20 résultats les plus récents. Un résultat contient l'identifiant
  de partie, la graine, la difficulté, le mode, l'issue, le temps exact, le niveau,
  les ennemis vaincus, les pièces gagnées, les rangs d'amélioration, les évolutions,
  les trophées et la cause fatale connue. Ce sont des résumés, pas un enregistrement
  des commandes permettant de rejouer la partie.

Le temps du record de survie est plafonné à 20 minutes. Le résumé conserve le temps
réel, y compris le petit dépassement d'une dernière étape de simulation. Le temps
infini inclut les 20 premières minutes, comme le chronomètre existant. Les pièces
sont celles gagnées au total, y compris celles dépensées en relances.

Une pause créditée met à jour les records, sans créer une fausse fin de partie.
Le remplacement d'une partie non terminée la marque comme abandonnée. Une victoire
et sa continuation infinie ont deux résultats distincts, liés par le même identifiant.
Les écritures répétées du même résultat le remplacent au lieu de le dupliquer.
L'entrée dans l'épilogue Charles et sa sortie conservent la victoire en survie.

## Cause fatale

Seul un coup accepté qui fait passer les PV à zéro ou moins enregistre sa source,
son instant et les PV retirés après protections. Les contacts, charges, frappes,
explosions, attaques de Travestia/Péli et ondes de coq transportent l'identifiant
et le type réels de l'attaquant lorsqu'ils sont connus.

Un nuage ancien ne contient pas son propriétaire : sa cause reste « gas », sans
inventer un attaquant. Une ancienne sauvegarde morte sans cause reste sans cause.
Une source non reconnue est conservée comme inconnue, jamais remplacée par une
explication supposée. Une guérison dans la même étape de simulation efface la
cause provisoire si le personnage survit.

## Persistance et compatibilité

Historique, records, totaux, instantané et marqueurs de crédit sont publiés dans
la même écriture atomique. Une erreur de quota ne modifie aucune de ces données.
Les verrous et contrôles de révision multi-onglets existants restent en place.
Une lecture d'une ancienne enveloppe ajoute la structure en mémoire seulement :
aucune réécriture ni attribution rétrospective automatique de l'ancien record.
Le prochain enregistrement effectif migre les métadonnées. Les versions anciennes
prises en charge restent lisibles, notamment la fixture réelle de version 3.

Les champs, catégories, rangs, sources et bornes sont validés avant utilisation.
L'historique est plafonné immédiatement à 20 résultats. Le plafond existant de
1 500 000 caractères pour une sauvegarde complète est maintenu.

## Vérification

- Baseline complète : 721 tests réussis avant modifications.
- 27 nouveaux tests : modes et difficultés, vraie provenance des attaques,
  guérison de dernière seconde, temps exact de fin, build détaché, relances,
  migration, déduplication, remplacement, limite d'historique, écritures refusées,
  capture avant attente du verrou, épilogue Charles et reprise infinie.
- `npm test` : 748 tests, aucun échec.
- Export autonome régénéré par `scripts/export-standalone.py`.
- `scripts/inspect-standalone.cjs` : démarrage, images intégrées, sauvegarde/reprise,
  découvertes, attaques des boss, directeur de boss et épilogue Charles réussis.
- Revue indépendante : aucune anomalie supplémentaire trouvée ; 59 tests ciblés
  et parcours manuel de persistance victoire → Charles → infini vérifiés.

L'inspection autonome utilise Node et Canvas natif. Ce n'est pas une validation
sur navigateur réel, écran tactile physique, ni une mesure du plaisir ou de la
rétention des joueurs. Aucune publication, fusion ou mise en production effectuée.
