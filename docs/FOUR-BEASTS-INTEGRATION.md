# Integration des quatre nouvelles bêtes

L’implémentation découle des quatre espèces approuvées et des dernières corrections du pouvoir du crapaud et du caméléon. Voir QA-FOUR-BEASTS.md pour le comportement et les preuves.

Modules : ego-beasts.js porte les machines d’état et la géométrie partagée; ego-entry.js les gabarits et les entrées dégagées; ego-art.js le rendu des corps et des attaques. L’engine initialise et ordonnance les espèces, les plafonds et les interruptions. Les compteurs ego/egoIndex sont sauvegardés en v15. Le calendrier des animaux déjà présents demeure séparé.

La branche de travail inclut les dialogues en pause v14 préparés avant ces animaux. Les points de rapprochement avec cette publication sont engine.js, run-save.js, app.js, actor-art.js, renderer.js et l’export autonome. Les sources dist et l’export doivent être régénérés ensemble avant publication. Aucun état de simulation n’est ajouté par le renderer.

Le caméléon utilise des champs bornés egoReveal et egoSample, pas une liste de positions. Son camouflage se base sur les données de décor, sans lecture de pixels. Le saut du crapaud utilise un point de chute fixe et une hauteur pure de présentation; les tirs tiennent compte de cette hauteur. Les deux autres attaques utilisent exactement la géométrie de l’avertissement pour tester les dégâts.
