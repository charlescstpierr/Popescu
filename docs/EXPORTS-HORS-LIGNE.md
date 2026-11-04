# Petits fichiers hors ligne

## Livraison courante

Le point d'entrée reste `release/Toma_Popescu_JOUER.html`. Il contient tout le JavaScript et le CSS dans des blocs classiques: aucun module ES, chargement de script, `fetch`, serveur, Node.js ou réseau n'est nécessaire pour jouer. Les images se trouvent à côté, dans `release/assets/`. Les 32 fichiers de `dist/assets/` sont recopiés octet par octet, y compris leurs métadonnées et signatures. Les sources `dist/` et `art/` restent intactes.

Le HTML passe de 27 424 615 à 643 861 octets. Le plus gros fichier actif du dossier est `assets/opening-approved.png`, à 2 798 954 octets. L'archive complète n'est pas réduite à la taille du HTML: il faut toujours télécharger toutes les images.

1. Télécharger le dépôt complet en ZIP ou le dossier `release/` complet.
2. Extraire tous les fichiers. Ne pas lancer le jeu depuis l'aperçu d'une archive.
3. Ouvrir `release/Toma_Popescu_JOUER.html` dans un navigateur de bureau. Si seul le dossier `release/` est partagé, ouvrir son `Toma_Popescu_JOUER.html`.
4. Garder `assets/` au même niveau que le HTML. Ne pas ouvrir `dist/index.html` directement: cette version source emploie des modules ES et se sert par HTTP.

`OFFLINE_MANIFEST.json` contient les tailles et SHA-256 des fichiers actifs. `archives/` contient uniquement une ancienne version de `main`, clairement nommée; ce dossier n'est pas nécessaire au jeu courant et n'est pas inclus dans le manifeste hors ligne. Les anciens rapports qui indiquent un monofichier à ce chemin décrivent un format historique.

## Sauvegardes et mise à jour

Fermer le jeu, garder une copie de l'ancien dossier, puis remplacer la version courante en conservant le même chemin complet du HTML, le même navigateur et le même profil. Ce changement d'emballage conserve le format v15 du candidat combiné ainsi que les clés `toma-popescu-v1` et `toma-popescu-run-v1`. La mise à jour combinée du jeu migre les anciennes sauvegardes v13/v14 vers v15 lors de leur lecture. Les scripts d'export ne migrent, ne suppriment ni ne réinitialisent les données du navigateur.

Le comportement de `localStorage` sur `file://` dépend du navigateur. Conserver le chemin réduit le risque de changer de stockage, mais ne garantit pas que tous les navigateurs l'autorisent. Déplacer ou renommer le dossier, utiliser un autre profil ou passer du Site au fichier local peut rendre les anciennes sauvegardes invisibles. La reprise du Site vers un fichier local n'est pas une migration automatique.

## Régénérer

Depuis la racine du dépôt, avec Python 3, sans nouveau paquet:

```bash
python3 scripts/export-offline.py
```

Le script réécrit le point d'entrée courant, les copies exactes des images, `LIRE-MOI.txt` et `OFFLINE_MANIFEST.json`. Le résultat est déterministe. Il ne modifie ni les sources ni les archives. Les autres fichiers éventuellement présents dans le dossier ne sont pas supprimés.

Pour l'export facultatif en un seul HTML:

```bash
python3 scripts/export-standalone.py
```

La sortie est `generated/standalone/Toma_Popescu_JOUER.html`. Ce répertoire est ignoré par Git et ne représente jamais une deuxième version courante. Le script accepte un chemin de sortie explicite, sauf le point d'entrée réservé de `release/`. Il conserve exactement le contenu du monofichier approuvé, soit 27 424 615 octets et SHA-256 `132f3279f0d1daa8a8fc7f253921085dfbdf478fded933ee86300dd5fa680f96` pour ce candidat.

Les deux exports partagent `scripts/offline_bundle.py`; leur seule différence est l'emplacement des images, URL relative ou données embarquées. Aucun atlas n'est reconstruit.

## Vérifier

La suite nécessite Node.js et Python 3, sans paquet Python externe. Les trois tests de fumée graphiques du dossier hors ligne et le test natif de publication atomique des captures sont ignorés avec une raison explicite lorsque `@napi-rs/canvas` n'est pas installé; les tests du moteur, de l'export et de rejet des sorties dangereuses continuent. Sans Canvas, la suite complète indique quatre tests natifs ignorés, dont trois dans le sous-ensemble du dossier hors ligne. Avec Canvas, les 1 270 tests de ce candidat sont exécutés sans aucun test ignoré. Pour une validation graphique, ce paquet de QA doit déjà être disponible. Aucun test ne l'installe automatiquement.

```bash
npm test
node scripts/inspect-standalone.cjs /tmp/toma-offline.png
node scripts/inspect-companion-standalone.cjs /tmp/toma-companion.png
node scripts/inspect-lamborghini-standalone.cjs /tmp/toma-lamborghini.png
```

Les inspecteurs acceptent en troisième argument un HTML différent, y compris le monofichier généré. Ils utilisent l'adaptateur DOM et Canvas natif existant, résolvent les images par rapport au HTML, et refusent les sources réseau. Les tests déplacent aussi le dossier dans un chemin contenant des espaces, puis vérifient le démarrage, les images, le rendu répété sans mutation, les pauses et la sauvegarde/reprise des systèmes du jeu.

Cette QA native ne simule pas les politiques de stockage ou de sécurité d'un navigateur. Le contrôle `file://` par navigateur réel était bloqué par la politique de protocole de l'outil; aucun contournement n'a été utilisé. Le toucher, les safe areas et les performances sur téléphone physique restent à vérifier.
