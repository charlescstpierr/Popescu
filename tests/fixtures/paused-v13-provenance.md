# Fixtures de compatibilité v13

Source : fichiers vérifiés du dépôt `charlescstpierr/Popescu`, commit `0cf1b385c5c15fe8c001590b042be29260b04e25`, identiques à la copie de travail du Site au début de cette modification.

- `run-save-v13-source.txt` : copie octet pour octet de `dist/run-save.js` avant modification. SHA-256 `c6cb539418aeb97259ced387f76267c9dee9ec0232604fb4e30a1deefbd8f406`. Le test l'importe dans un dossier temporaire avec ses dépendances relatives, puis vérifie que ce lecteur original rejette les sauvegardes et enveloppes v14 sans les remplacer.
- `paused-charles-v13-recover.json` : sauvegarde produite par les vrais `Game` et `captureRun` v13. Seed 72, victoire à 1200 secondes, démarrage explicite de Charles, mises à jour immobiles de 0,01 seconde jusqu'à sa première phase recover. Le curseur vaut 3 et la réplique Toma d'index 2 possède encore du temps de lecture après une interruption urgente. SHA-256 `157733b940e64ca6c7408ee02679ee429f2cc547c7489b26daa35a41d4b7b17c`.

Le moteur producteur original avait le SHA-256 `f238a37c37ba836c1ff21d819aa2c7ddca68bb52d64a2dd2fb8fefa910e4354c`. Le test de continuation fait naturellement avancer la simulation avec un déplacement vertical; il ne supprime ni ne force l'expiration de la réplique héritée.
