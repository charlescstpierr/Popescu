# Échap depuis les réglages — 4 novembre 2026

Rapport historique du 4 novembre. La base, les nombres de tests et les tailles d’export ci-dessous décrivent ce candidat antérieur, pas la livraison courante. Voir [la validation combinée du 5 novembre](QA-PLAYTEST-INTEGRATION-2026-11-05.md) sur main `dc2519e8e5b67552ddea4a1d5e3b520de531dfc9`, après les PR #44, #45 et #46.

## Défaut reproduit

Dans le vrai navigateur, Échap ne ferme pas les paramètres lorsque le curseur Volume ou une case conserve le focus. Le bouton Retour fonctionne. `dist/app.js` quittait le gestionnaire clavier dès que la cible était un `HTMLInputElement`, avant de traiter Échap.

## Correction limitée

Le garde-fou laisse maintenant passer uniquement Échap, uniquement dans l’écran Paramètres et uniquement pour les quatre contrôles présents : Volume, Son et musique, Effets visuels réduits, Répliques pendant l’action. La branche Échap existante revient à la pause; elle ne reprend pas la partie et ignore les pressions répétées.

Les autres touches de ces contrôles ne sont pas interceptées. Un champ de texte sans lien avec les paramètres conserve ses touches, y compris Échap. Les cibles de réglages périmées sur d’autres écrans ne peuvent ni déclencher la pause ni passer un dialogue. Aucune modification visuelle, de préférence, du moteur, de sauvegarde ou de commande tactile.

## Tests

L’adaptateur DOM de test reconnaît désormais les éléments input du HTML réel et ceux créés par `createElement('input')`. Les anciens tests utilisaient des objets génériques et ne pouvaient donc pas exercer le garde-fou `instanceof HTMLInputElement`.

Cinq assertions de fermeture ont échoué sur le code original. Les huit tests ciblés passent après correction : les quatre contrôles, maintien d’Échap, autres touches natives, champs de texte étrangers et cibles de réglages périmées. Les snapshots du moteur restent identiques pendant la fermeture et la pause; les préférences ne changent pas.

`npm test` : **1 278 tests réussis, zéro échec, zéro test ignoré**. La revue indépendante a exécuté **44 tests ciblés**, sans échec ni test ignoré, et n’a trouvé aucun défaut bloquant. Le dossier hors ligne a été régénéré dans la copie isolée.

La validation après correction est celle du vrai contrôleur dans un adaptateur DOM, pas une nouvelle interaction dans un navigateur. Le problème initial a été constaté dans le vrai navigateur. Aucune publication n’est effectuée par ce correctif; le test final en navigateur devra suivre le flux autorisé.
