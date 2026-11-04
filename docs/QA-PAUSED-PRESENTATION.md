# QA — dialogues de rencontre en pause

## Présentation intégrée

Les scènes explicitement identifiées de Charles, Péli Zodiaque, Travestia et l’invocation de la Blonde IA utilisent les grands portraits approuvés, un cadre violet/doré, un texte crème lisible et l’indication « SCÈNE EN PAUSE ». Le véritable décor Canvas reste visible. Les portraits conservent leur contexte quand Toma répond; son nom reste celui du locuteur actif.

L’ouverture, le tutoriel, les dialogues ordinaires et les avertissements courts pendant le combat gardent leur présentation précédente. Le module visuel ne modifie ni la simulation ni les gestionnaires de commandes.

Les marges transparentes des PNG sont cadrées par SVG, sans modifier les images. La visibilité du SVG est pilotée par l’attribut `hidden` réel. Si une image échoue, les répliques et les commandes restent utilisables. Le rang 1 de la compagne peut revenir à son ancien portrait du même rang. Les rangs 2 à 5 utilisent leurs portraits existants, jamais celui d’un autre rang.

Le texte dispose d’une zone défilable au clavier et au toucher, séparée des commandes de 44 px minimum. Les styles sont limités à cette variante et prévoient les zones sûres, les écrans courts, le paysage et les effets réduits. Le dialogue est nommé par le locuteur; les images et le cartouche décoratif ne sont pas lus en double par leur texte alternatif.

## Vérifications ciblées

13 tests de présentation couvrent les quatre personnages, les réponses de Toma, les cinq rangs de compagne, le chargement et l’échec des images, les rappels périmés, la remise à zéro, les dialogues ordinaires, les attributs SVG et les garanties CSS. Des empreintes SHA-256 fixes protègent les cinq anciens portraits et l’atlas complet des niveaux de la compagne.

15 compositions diagnostiques natives ont été examinées. Le décor provient du vrai moteur de rendu; son état et ses pixels restent identiques entre deux rendus au même instant. Les répliques principales viennent du code courant avec le bon curseur. Les rangs 2 à 5 de la compagne passent par une sauvegarde et une restauration avant la présentation.

Formats inspectés: 390 × 844, 320 × 568, 430 × 932, cas de contrainte 320 × 320, et application de 460 × 390 en paysage. Les cas de zones sûres comprennent 44 px en haut et 34 px en bas, ainsi que 44 px à gauche et à droite en paysage. Les longues répliques et l’image indisponible sont des cas de contrainte explicitement synthétiques.

## Limites

Les images diagnostiques ne sont pas des captures de navigateur ou de téléphone. L’alpha et le cadrage des portraits sont composités réellement avec Canvas natif, mais l’interface est une composition indicative des dimensions CSS, avec des polices locales de diagnostic. Aucun moteur CSS de navigateur n’a été validé. Les annonces de lecteurs d’écran, le toucher physique, les zones sûres sur appareil et les performances mobiles restent à contrôler.

Les quatre PNG fournis ont été copiés sans modification. Charles vient de l’extraction approuvée. Pour les trois autres, la préparation artistique conserve l’identité et la pose de la maquette, avec une petite continuation reconstruite des vêtements ou plumes sous le cartouche retiré. En portrait, les bords inférieurs sont masqués par le panneau de dialogue. Sur les écrans très courts et en paysage, le portrait devient plus petit dans une colonne latérale; un fondu masque son bord inférieur. Cette adaptation conserve la lisibilité et les commandes plutôt qu’une composition identique à tous les formats.
