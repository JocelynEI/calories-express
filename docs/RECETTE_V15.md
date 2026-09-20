# Vérification V1.5 — 17 septembre 2026

## Vérifications automatisées

- TypeScript strict : `npm run check`.
- 42 assertions historiques, 22 tests de régression V1.4 et 15 tests V1.5.
- Expo Doctor : 21 contrôles sur 21 réussis.
- Export des bundles iOS, Android et Web avec Expo SDK 57.
- Import Ciqual 2025 : 3 339 lignes à énergie numérique ; cas énergie manquante,
  macronutriments non chiffrés, préparation et quantités testés.
- Vérification HTTP du nouveau service : recherche `yaourt nature` et code exact
  `3277390015076` avec résultats exploitables. Requêtes simulées pour panne, erreur
  429, erreur 503, délai dépassé, annulation, cache et limite locale.
- Le contrôle en ligne a aussi détecté que citer les mots entre guillemets renvoyait
  zéro résultat. Les mots sont désormais envoyés sans guillemets ; ce cas est couvert.

Les tests V1.5 couvrent le crédit calorique, ses modifications et suppressions,
les modes fixe et manuel, les séances habituelles exclues du crédit, les pas
séparés, le changement de jour, le poids mémorisé, les anciennes séances, les
bulles limitées et désactivées, les phrases avec quantités, les références Ciqual
et le nouveau format de réponse Open Food Facts.

Ces vérifications ne remplacent pas un test d’interaction sur iPhone et Android.
Aucun test natif sur téléphone réel n’a été effectué dans cet environnement.
L’export produit du JavaScript/Hermes et des ressources, pas une app signée.

## Parcours sur téléphone à réaliser

1. Démarrer avec le lanceur. Vérifier l’accueil Jaws et l’absence de voix.
2. Créer/enregistrer un profil, ou retrouver le profil précédent si Expo Go
   conserve son espace de stockage. Ne pas désinstaller Expo Go pour la mise à jour.
3. Vérifier que l’ancien mode fixe est conservé. Depuis Modifier l’objectif,
   sélectionner Calculer avec mon profil → Ajusté à ma journée → Enregistrer.
4. Noter le repère, saisir 30 minutes de marche modérée. Vérifier le message Jaws,
   les kcal actives, et l’égalité base + crédit = repère. À 80 kg, crédit attendu 112 kcal.
5. Modifier en 60 minutes : crédit attendu 224 kcal à 80 kg ; une seule séance.
   Supprimer : retour à la base. Une séance habituelle doit afficher ses kcal,
   sans les ajouter au repère.
6. Saisir 2000 puis 6500 pas : le total doit être 6500, sans crédit calorique doublé.
7. Revenir au mode fixe, puis manuel : les kcal de séance restent visibles mais
   n’augmentent pas la valeur choisie. Tester aussi maintien et prise de poids.
8. Ajouter un repas : « 150 g de riz cuit et 2 œufs ». Sélectionner Riz blanc,
   cuit, sans sel ajouté : 155 kcal / 100 g, soit 233 kcal après arrondi à 150 g.
   Sélectionner Oeuf dur : 134 kcal / 100 g, deux pièces indicatives de 50 g
   donnent 134 kcal. Total attendu : 367 kcal. Vérifier avant d’enregistrer.
9. Vérifier la bulle après repas pendant la journée, la fermer et ouvrir une idée.
   Consulter l’idée ne doit pas créer une séance. Vérifier Pas aujourd’hui, puis
   désactiver les conseils. La préférence doit persister au redémarrage.
10. Sans connexion Internet, trouver « pâtes cuites » et une banane. La recherche
    de marques doit expliquer son échec et laisser les estimations locales utilisables.
11. Avec Internet, rechercher une marque ou un code-barres. Vérifier le nom,
    l’unité sur l’étiquette, puis la quantité. Mémoriser le produit et le réutiliser.
12. Saisir manuellement 150 kcal / 100 g et 250 g : résultat 375 kcal. Tester une
    portion à 500 kcal et 0,5 portion : résultat 250 kcal. Macronutriments facultatifs.
13. Modifier une quantité ajoutée : Appliquer doit actualiser le total. Une saisie
    inachevée ne doit pas être ignorée lors de la validation finale.
14. Tester fermeture d’un brouillon, clavier ouvert, petite largeur, texte agrandi,
    réduction des animations, passage en arrière-plan et retour le lendemain.
15. Vérifier les mêmes repères sur Accueil, Journal et Progression. Le graphique
    utilise le profil actuel et l’activité de chaque date, pas un ancien profil figé.
16. Fermer et rouvrir : repas, séances, aliments personnels, mode de calcul et
    préférences doivent être conservés. Tester une ancienne sauvegarde V1.3/V1.4.

## Limites connues

Recherche lexicale, sans analyse IA de recette libre. Une préparation ambiguë
reste à choisir. Les pièces sans poids de référence demandent des grammes.
Open Food Facts et Ngrok restent des services externes. Les anciens poids/intensités
non enregistrés ne peuvent pas être reconstruits : les hypothèses sont signalées.
Les pas, séances et quantités sont saisis par l’utilisateur, sans capteur connecté.
La validation réelle de la fluidité et des modales reste à faire sur téléphone.
