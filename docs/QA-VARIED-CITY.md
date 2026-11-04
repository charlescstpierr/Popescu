# QA — Ville variée, forêt et rivière

Validation du 4 novembre 2026. Décor conforme à la direction visuelle approuvée, sans changement de la simulation ni du format des sauvegardes.

## Changements

- Appartements de brique et condos à balcons avec étage en retrait; les garages, entrepôts, commerces et ruines conservent leurs dimensions variées.
- Commerces identifiables par leur enseigne, vitrine et jardinière.
- Forêts mêlant conifères et feuillus verts/dorés.
- Rivière peu profonde continue dans un couloir de rue existant, ponts larges aux croisements et pierres de gué entre les ponts. L'eau reste franchissable. Des pontons soutiennent les découvertes déjà placées au bord de l'eau.
- Les grands éléments de premier plan deviennent transparents lorsqu'ils masquent Toma.
- Les images entièrement hors écran ne sont plus construites, sans changer les pixels visibles.

## Vérifications

- `npm test`: **778/778** réussis, aucun échec ou test ignoré.
- Neuf tests ciblés couvrent la rivière, les ponts, les condos, les feuillus, l'occultation, les pontons, le cache et la compatibilité du monde.
- **405 zones** produites avec cinq graines, dont des coordonnées négatives, sont identiques octet par octet à la version précédente. Identifiants, types, positions, dimensions, collisions, découvertes et objets détruits restent inchangés.
- Le rendu réel est inspecté à **320 × 844 et 390 × 844** dans sept scènes: ville, condo, forêt, pont, gué, rivière à coordonnées négatives et passage derrière un arbre. Le script impose les dimensions et vérifie que chaque position de Toma est praticable.
- Le rendu ne modifie pas l'état de jeu. Les images avec et sans élimination des objets hors écran sont identiques pixel par pixel.
- Limites inchangées: **48 tuiles de terrain et 96 images d'objets**. Les scènes mesurées utilisent 10–44 images d'objets après préchauffage. Le rendu natif préchauffé est d'environ **1–4 ms/image**; la première image, qui construit le terrain, demande environ **90–200 ms**. Ces mesures ne sont pas celles d'un téléphone.
- Le HTML autonome a été régénéré puis exécuté: démarrage, images embarquées, découvertes, pause/reprise, sauvegarde/reprise, attaques des boss et épilogue de Charles passent.
- Revue indépendante du code, des tests et des images: aucun blocage relevé.

## Limites

La prévisualisation navigateur locale a renvoyé une connexion refusée, y compris avec un serveur démarré dans sa session. Aucun accès n'a été contourné. La validation navigateur, le toucher, les safe areas et la performance sur appareil physique ne sont donc pas revendiqués.

Les sources de génération du monde, de collision, de sauvegarde, de scénario et de dialogue n'ont pas été modifiées. La rivière est volontairement franchissable pour préserver toutes les anciennes positions sauvegardées et tous les trajets des ennemis.

## Reproduction

```sh
npm test
node scripts/inspect-varied-city.mjs proof/varied-city
python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html
node scripts/inspect-standalone.cjs proof/varied-city/standalone.png
```

Les inspections natives utilisent la dépendance optionnelle `@napi-rs/canvas` déjà documentée dans le dépôt. Le script génère son rapport de rendu JSON dans le dossier de sortie choisi. Les JSON de preuve ne font pas partie de cette livraison.
