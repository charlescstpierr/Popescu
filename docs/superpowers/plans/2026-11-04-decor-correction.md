# Décor fidèle à la direction approuvée: plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Rendre la variété visible dans le vrai jeu et rapprocher rivière, ponts et ville de la maquette approuvée.
**Architecture:** Rendu uniquement autant que possible; géométrie, identités des objets et sauvegardes conservées. Module indépendant pour la rivière, façade et mobilier dans CityArt.
**Tech Stack:** JavaScript ES natif, Canvas 2D, Node tests et Canvas natif pour QA.
**Spec:** `docs/DECOR-CORRECTION.md` et maquette `Toma_Popescu_Ville_Variee_Proposition.png` déjà approuvée.

## Global Constraints
- Garder déplacements, collisions, sauvegardes, personnages et limites 48 tuiles / 96 images.
- Aucun déploiement sans coordination avec le responsable.

## Review Focus
- Départ 390×844 avec plusieurs graines: façades réellement visibles.
- Coordonnées négatives et raccords de rivière aux tuiles.
- Occultation de Toma et des attaques par les nouveaux détails.
- Anciennes positions sauvegardées et obstacles identiques.
- Coût de première image et caches après préchauffage.

### Task 1: Rivière et pont
- [x] Tests des courbes continues, banques dans le corridor et traversée inchangée.
- [x] Module de rendu distinct pour rochers, eau, pont avec profondeur et balustrade.
- [x] Tests, captures et mesure de coût.

### Task 2: Visibilité du quartier
- [x] Captures initiales sur plusieurs graines avant toute modification.
- [x] Tests des détails et dimensions partagés, aucune mutation du monde.
- [x] Façades/mobilier différenciés et meilleure composition près du départ dans les limites existantes.
- [x] Captures comparatives identiques, tests complets et export autonome.

### Task 3: Revue indépendante
- [x] Comparer les pixels à la maquette et rechercher les régressions de parcours et sauvegarde.
- [x] Rendre les captures et le patch au responsable; conserver les limites de validation.
