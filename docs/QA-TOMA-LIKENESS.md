# Toma : ressemblance corrigée, 5 novembre 2026

L'utilisateur a signalé que le personnage ne ressemblait plus à Toma et a fourni quatre nouvelles photos. L'examen a montré que les trois vues ajoutées par v6 avaient accentué des écarts déjà visibles dans les anciennes faces : barbe et menton massifs, front tassé et sourcils trop agressifs. Les 65 entrées v5 n'avaient pas été altérées par v6; elles étaient encore identiques dans l'ancien atlas.

## Correction

Les huit vues sources ont été rééditées à partir des photos, afin de conserver une identité commune dans les quatorze directions. Le crâne rasé et le front sont plus hauts, le nez et la bouche restent lisibles, le visage est moins carré et la barbe est courte. Les lunettes sur le crâne sont cohérentes entre les vues. Le vêtement, l'arme, les corps entiers et les poses de marche et de grand écart sont conservés.

`toma-whole-v7.png` contient 96 peintures complètes et 104 entrées de métadonnées. Les atlas historiques v5/v6 et leurs sources restent inchangés. Aucun membre n'est assemblé ni déformé. La préparation est reproductible octet pour octet pour l'atlas, les points enregistrés et les métadonnées. Le secours en cas de chargement raté est encodé sans perte depuis les nouvelles figures E, et non depuis l'ancien visage.

Les cellules restent à 144 × 128, ancre `[65,111]`; les angles, le moteur, la phase de marche, les règles de visée, les temps de grand écart et la sauvegarde ne changent pas. Le nouvel atlas garde les dimensions 1152 × 2048, sans augmentation de mémoire décodée par rapport à v6.

## Vérifications du candidat isolé

- Le test du chargement de l'atlas corrigé a d'abord échoué sur v6, puis passé sur v7. Le secours est comparé pixel par pixel au rendu de l'atlas courant.
- La préparation des images a été relancée : mêmes octets pour le PNG, les métadonnées et l'enregistrement.
- Rendu natif : 112 poses de marche, 112 poses de grand écart, 14 directions, 120 vérifications de canons proches de l'arme peinte. Hauteur entre 70 et 83 px, largeur de marche entre 33 et 64 px. Huit phases distinctes, arrêt stable, maintien du grand écart identique, descente du sommet du crâne de 10 px pour E.
- Comparaison de 8 secondes à 30 images/s, moteur et renderer réels avec graine et commandes identiques : les 240 positions, directions et phases sont exactement identiques entre v6 et v7. Les canons sont réenregistrés sur les nouvelles peintures.
- Revue visuelle indépendante de toutes les poses, du tour complet et des retournements rapides par images extraites : meilleure ressemblance et aucune rupture bloquante de crâne, d'échelle ou d'anatomie. Réserve mineure : tête SE légèrement plus large, expression S encore un peu sévère.
- La suite complète séquentielle passe **1 469 tests**, zéro échec et zéro test ignoré. Le lancement `npm test` parallèle a d'abord connu trois interruptions de processus natifs (fumée hors ligne déplacée, scenery-art, publication atomique des captures). La cause de ces interruptions n'est pas établie; aucune assertion n'a été assouplie. Le nouveau test attend explicitement le décodage de l'image avant de comparer ses pixels.
- Dossier hors ligne et monofichier facultatif reconstruits depuis le candidat.

## Limites

Ces preuves proviennent de Canvas natif et d'une revue de captures séquentielles. Elles ne remplacent ni une lecture vidéo en temps réel ni un essai dans un navigateur mobile ou sur téléphone physique. La ressemblance est une appréciation visuelle, pas une mesure biométrique. Le grand portrait des dialogues est traité dans un chantier distinct; cette correction ne le remplace pas.

## Intégration sur la base publiée

Le patch source s'applique sans conflit à main `97a58931459bb08bc4e960a8e1229c51d65406ed`, arbre `3b45aca59fd7ccfccf5caa28a24fccb8a87b8d5a`. Les 545 fichiers matérialisés ont été vérifiés contre leurs empreintes Git avant modification. Les 54 fichiers historiques non matérialisés restent présents dans l'arbre distant et ne sont pas supprimés.

Le moteur, le renderer, les nouveaux monstres, l'arrivée de Charles, les sauvegardes, l'audio, les commandes et le correctif d'explosion de cette base sont préservés. Le dossier hors ligne et le monofichier facultatif sont reconstruits depuis la version combinée. Le rendu natif combiné retrouve les mêmes 112 poses de marche, 112 poses de grand écart, 14 directions et 120 points de canon contrôlés. La suite globale séquentielle combinée passe **1 541 tests**, sans échec ni test ignoré, en 81,9 secondes. Aucune publication du Site n'est effectuée par cette préparation.


## Livraison combinée avec les dialogues

Le candidat final associe ces sprites au nouveau portrait de dialogue `dialogue-toma.png`, fondé sur les mêmes quatre photos. Le portrait et les sprites ont été comparés indépendamment. Voir [QA-SPEAKER-PORTRAITS-2026-11-05.md](QA-SPEAKER-PORTRAITS-2026-11-05.md) pour la sélection du locuteur, la reprise et les résultats finaux du candidat combiné.
