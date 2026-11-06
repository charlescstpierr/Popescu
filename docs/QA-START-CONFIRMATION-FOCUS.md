# Nouvelle partie : focus de la confirmation native

## Portée et cause vérifiée

Base GitHub : `2fa23c755f594f35735c8521133ff57981d1f76b` (main, PR #72).

Le contrôleur créait le jeton de démarrage avant `window.confirm`. Si la boîte native déclenchait `blur`, puis rendait le focus avant de retourner `true`, le jeton restait annulé. `mayStart()` quittait alors silencieusement le démarrage, même après OK. Le cas est reproduit avec le vrai contrôleur, le vrai moteur et le vrai stockage transactionnel; seuls les événements de la surface navigateur sont simulés.

La correction borne l'exception de blur à l'appel synchrone de confirmation. Elle ne réarme jamais un ancien jeton. Annuler conserve son sens; un focus qui ne revient pas, un onglet caché, pagehide, une navigation plus récente ou une interruption après la confirmation empêchent toujours le remplacement. Les gardes à l'intérieur du verrou de sauvegarde restent intactes. Les images, écrans et textes sont inchangés.

La confirmation de jeu sans sauvegarde utilise la même protection. L'accord explicite reste requis, et une partie lancée dans ce mode reste non persistante.

## Vérifications automatisées

- Nouvelle suite de 15 tests : 3 échecs attendus sur la base, puis 15 réussites avec la correction.
- 124 tests ciblés réussis : confirmation, démarrage et verrou, records, sortie de pause.
- `npm test` : 1 683 tests réussis, 0 échec, 0 test ignoré.
- `scripts/export-offline.py` et `scripts/export-standalone.py` exécutés. Le dossier hors ligne courant et son manifeste sont régénérés; le monofichier facultatif reste non versionné.
- Les tests vérifient aussi que les gains d'une ancienne partie sont crédités une fois et qu'une annulation conserve les octets de sauvegarde.

## Contrôle navigateur et limites

Une origine locale distincte, `127.0.0.1:8782`, a servi uniquement une copie de test. Les 95 fichiers `dist` de la base ont été vérifiés contre le manifeste GitHub exact. Une nouvelle sauvegarde synthétique a été créée par l'interface; le stockage du Site privé personnel n'a pas été ouvert.

Sur Chromium, la base démarre normalement depuis Pause → Recommencer → OK et Menu → Nouvelle partie → OK, y compris par un clic natif sur OK. Le cycle problématique de focus n'a pas été observé avec cette version de Chromium. Après rechargement du candidat, Menu → Nouvelle partie → Annuler conserve l'écran de menu et les détails de la sauvegarde de test.

Le contrôle navigateur complet du candidat n'est pas revendiqué : le lanceur d'aperçu géré disponible utilise une autre origine contenant une sauvegarde dont la provenance n'a pas été confirmée. Cette sauvegarde a été laissée intacte. Les deux aperçus ont été arrêtés.

Aucun téléphone physique n'a été testé. Le défaut de focus est démontré par les tests, mais son lien avec le signalement exact de l'utilisateur reste à confirmer. Si son navigateur supprime entièrement `window.confirm`, ce correctif ne résout pas ce second cas et ne traite jamais un `false` comme un accord.
