# Soutiens-gorge roses des orangs-outans

## Changement

Les orangs-outans portent le soutien-gorge rose du mockup approuvé. Les quatre phases de face montrent les bonnets et les bretelles. Les quatre phases de dos montrent les bretelles, la bande et le fermoir; les miroirs utilisent ces mêmes dessins.

Un seul fichier de l'application change : `dist/assets/orangutan-walk-v3.png`. Toutes les autres images et tous les modules JavaScript sont inchangés par cette modification. Les gorilles conservent exactement leur atlas d'origine.

L'atlas garde ses huit cellules de 128 × 128 px dans une image de 512 × 256 px. Les hauteurs par pose et le sol à 121 px sont conservés. La boucle de rendu et le cache ne changent pas. Le PNG passe de 172 138 à 176 008 octets (+3 870 octets), sans requête supplémentaire.

## Vérification du 3 novembre 2026

- `npm test` : 398/398 tests passent, dont deux nouveaux contrôles artistiques. Le premier contrôle a été exécuté sur l'ancien atlas et échouait faute de pixels roses sur le torse.
- La préparation reproduit le même atlas, SHA-256 `584b18fb91860df181d957ec36bf97b49cb132b7bfb029d23035281606899413`.
- Inspection native : huit cellules sans découpe aux bords, sol stable, seize combinaisons de phase/face/dos/miroir et scène 390 × 844 px.
- Une revue visuelle indépendante a inspecté les pixels du mockup, l'ancien atlas, le nouvel atlas, les contacts et la scène mobile. Aucun défaut bloquant trouvé. Elle confirme que seul l'atlas orangutan diffère dans `dist/`.
- L'inspection graphique générale conserve le rendu sans mutation de la simulation et le cache de terrain plafonné à 48 tuiles. Mesure locale : 7,13 ms/image sur Canvas natif, non représentative d'un téléphone.
- HTML autonome régénéré et exécuté avec l'adaptateur DOM/Canvas : démarrage, images embarquées, rendu, pause, sauvegarde/reprise et boss réussis.

L'édition générée conserve les poses et le style, sans promettre l'identité pixel par pixel de la fourrure. Aucun navigateur réel ou téléphone physique n'a été testé pour ce changement.

## Reproduire

```sh
node art/source/orangutan-bra/register-atlas.mjs
python3 scripts/export-standalone.py release/Toma_Popescu_JOUER.html
npm test
node scripts/inspect-orangutan.mjs /tmp/toma-orangutan-qa
node scripts/inspect-graphics.mjs /tmp/toma-graphics-qa
node scripts/inspect-standalone.cjs /tmp/toma-orangutan-standalone.png
```

Les deux scripts graphiques et la préparation utilisent `@napi-rs/canvas@0.1.100`, la dépendance facultative de QA existante. Le test standard reste sans dépendance.
