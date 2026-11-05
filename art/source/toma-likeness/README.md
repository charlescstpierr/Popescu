# Toma : correction de ressemblance

Huit feuilles transparentes éditées le 5 novembre 2026 avec le générateur d'images intégré, après la demande de corriger le personnage à partir de quatre nouvelles photos de référence. Les photos privées ne sont pas copiées dans ce dépôt. `prompts.json` conserve les consignes de génération; les premières propositions E à barbe trop épaisse ont été rejetées puis corrigées.

Chaque feuille contient quatre colonnes et trois rangées : huit pas, puis station debout, demi-descente, descente profonde et grand écart. Toutes les figures restent complètes et connectées, du crâne aux bottes, avec les deux mains et l'arme. La ressemblance retient le grand front, le crâne rasé, le nez arrondi, les lèvres visibles et la barbe courte des références. Les lunettes restent sur le crâne dans toutes les vues.

`scripts/prepare-hero-likeness.py` construit `toma-whole-v7.png` et `hero-frames.js`. Le script enregistre chaque figure entière avec une échelle uniforme par feuille; il ne découpe ni ne transforme un membre. `registration.json` contient les points mesurés et les boîtes. Les ouvertures des canons frontaux sont relevées explicitement; les autres directions utilisent l'extrémité de l'arme. Le secours est encodé sans perte depuis les peintures E courantes.

Les directions et les timings restent identiques à v6. Les 96 peintures donnent 104 entrées, car la préparation debout non utilisée est dupliquée dans chaque vue. Les sources et atlas v5/v6 ne sont ni remplacés ni effacés.
