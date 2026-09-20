# Vérifications V1.4 — 16 septembre 2026

## Vérifié pendant le développement

| Contrôle | Résultat |
| --- | --- |
| Installation dans une copie isolée de V1.3 | Réussie |
| TypeScript, `npm run check` | Sans erreur |
| Tests historiques | 42 assertions réussies |
| Nouveaux tests V1.4, `npm run test:logic` | 22 tests réussis |
| Expo Doctor | 21/21 contrôles réussis |
| Export web et bundles Hermes iOS/Android | Réussis |
| Recherche sur Open Food Facts, environnement de test | 12 produits reçus et reconnus |
| Lecture par code-barres en API v3.6 | Structure nutritionnelle reçue et interprétée |
| Exemple réseau « Yaourt nature » | 78,5 kcal/100 g → 98 kcal pour 125 g, arrondi |
| Syntaxe du lanceur Mac | `bash -n` réussi |

Les tests couvrent les g/ml/portions et décimales, les modifications de quantité
sans cumul d’arrondis, les références absentes et le vrai zéro, l’énergie kJ,
les schémas Open Food Facts ancien et v3.6, les macronutriments manquants,
les réponses malformées, le cache, les limites, l’annulation et le délai réseau,
la migration des aliments et activités, le remplacement du total de pas, les
séances modifiées sans doublon et les dates/durées invalides.

L’objectif automatique reste séparé des activités enregistrées. Les anciens
tests vérifient aussi le déficit appliqué une fois, les objectifs manuels, les
modes maintien/prise, les suggestions françaises et les préférences de Jaws.

Le premier test réel par code-barres a révélé que l’API v3.6 remplace `nutriments`
par `nutrition.aggregated_set`. Le client a été corrigé pour lire cette structure.
Un test vérifie qu’une portion non normalisée ou un produit préparé ne soit pas
traité comme 100 g de produit tel que vendu.

Les appels réseau de développement ont utilisé `world.openfoodfacts.net` avec
l’authentification publique de test indiquée par la documentation. Aucune donnée
n’a été écrite dans Open Food Facts. Les données réseau temporaires ne sont pas
embarquées dans l’application ; ses tests automatisés utilisent des cas fictifs.

## À valider sur le téléphone

Les compilations et tests de calcul ne valident pas l’affichage ni les interactions
sur un vrai téléphone. Aucune validation visuelle ou tactile iOS/Android n’est
revendiquée. L’accès navigateur au serveur local était bloqué dans cet environnement
lors de la version précédente ; ce contrôle n’est pas considéré comme acquis.

| Parcours | Résultat attendu |
| --- | --- |
| Profil vide → Modifier l’objectif | Ouverture du profil à compléter |
| Perte → maintien → prise | Aperçu cohérent, mise à jour du baromètre après sauvegarde |
| Objectif manuel + changement de direction | Valeur gardée explicitement, incohérence signalée si nécessaire |
| Annuler le changement d’objectif | Ancien profil et journal conservés |
| Libre : 150 kcal/100 g, 250 g | 375 kcal dans le repas puis dans le journal |
| Libre : 500 kcal/portion, 0,5 portion | 250 kcal |
| Quantité tapée mais non appliquée | Total précédent expliqué et enregistrement bloqué jusqu’à Appliquer |
| Plusieurs aliments, retrait du premier | Quantités des autres aliments conservées |
| Recherche nom/marque et code-barres saisi | Choix du produit, contrôle de l’unité, calcul de quantité |
| Produit absent, réseau coupé ou recherche lente | Message compréhensible, saisie Libre disponible |
| Changer la requête pendant une recherche | Ancienne réponse ignorée |
| Macronutriments laissés vides | Bilan signalé partiel, aucune fausse complétude |
| Mémoriser puis oublier un aliment | Référence retirée, repas déjà enregistrés conservés |
| 2 000 pas puis 6 500 pas | 6 500 pas au total, pas d’addition |
| Séance 15 min → modifier 20 min | Une seule séance de 20 min |
| Séance → supprimer → annuler/confirmer | Confirmation respectée, total recalculé |
| Idée d’activité → renseigner la séance | Pas de saisie automatique sans validation |
| Changement de jour avec saisie en cours | Message demandant d’enregistrer ou annuler |
| Quitter un repas ou une activité en cours | Choix de continuer ou quitter sans cette saisie |
| Relancer l’app | Objectif, repas, aliments et activité conservés |
| Effacer et recréer le profil | Repas réels conservés |
| Graphique | Tirets foncés visibles sur les barres bleues et ambre ; point sur aujourd’hui |
| Petite largeur, grande police et clavier | Champs et boutons atteignables sans chevauchement |
| Réduction des mouvements et arrière-plan | Animations limitées, aucune voix |

## Limites de cette livraison

Version Expo Go, sans IPA/APK signés ni publication dans les stores. Stockage
local, sans synchronisation cloud ni import Santé/montre. Valeurs collaboratives
à vérifier ; petit catalogue initial encore indicatif. Les trois idées d’activité
sont des contenus écrits, pas un programme sportif personnalisé ni un Tabata à
intensité maximale. Les conseils de Jaws ne sont pas générés par un service distant.
