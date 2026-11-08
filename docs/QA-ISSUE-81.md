# Limite d'attente des scènes au calme

Ticket [#81](https://github.com/charlescstpierr/Popescu/issues/81).

## Reproduction et correction

Le moteur réel ouvre `street:bench`. Une préparation d'attaque d'orang-outan suspend la deuxième réplique. Un avertissement de horde, puis `reactToCrow()` quatre secondes plus tard, occupent la parole.

Avant correction, la reproduction produit exactement ces sorties.

```text
8.1s {"scene":"street:bench","active":"Men, farmes ta criss de gueule !","skip":false,"roundTrip":true}
8.301s {"scene":"street:bench","active":"Un pigeon occupe déjà la place.","skip":false}
```

`flushSpeech` contrôle désormais l'expiration avant son retour pour réplique active ou répliques désactivées. Le contrôle ne dépend plus du danger encore présent. L'annulation existante retire le curseur et garde la réaction indépendante.

## Validation

Les dix tests de `tests/scene-calm-deadline.test.js` utilisent le vrai moteur. Avant correction, deux passent et huit échouent. Après correction, les dix passent.

Ils couvrent les interruptions par les vrais événements, le seuil exact de huit secondes, 8,1 secondes, le calme avant et après le seuil, la sauvegarde/restauration, une sauvegarde v15, la pause, les répliques désactivées et une scène sans attente de calme. Les captures après annulation restent valides et ne contiennent aucun curseur orphelin.

`npm test` passe avec 1 849 tests, dont 1 795 réussis, aucun échec et 54 ignorés faute de `@napi-rs/canvas`.

`python3 scripts/export-offline.py` et `python3 scripts/export-standalone.py` réussissent. La reproduction a aussi été exécutée dans le moteur extrait du JavaScript assemblé de chacun des deux HTML, sous Node VM. Les deux expirent à huit secondes, conservent la réaction active avec son budget de lecture, retirent le curseur et ne reprennent pas la scène après le retour au calme. Les tests d'export vérifient leur contenu commun et les images identiques aux sources.

## Limites

Aucun changement graphique, d'animation ou de texte. Aucun essai navigateur ou téléphone physique. Les skills deslop/control ne sont pas disponibles dans cette session; le diff a été relu directement. Aucun sous-agent, merge ou suivi automatique de PR.
