# Recette V3.2 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : mon environnement ne peut pas installer
les dépendances npm. Les écrans ci-dessous ont été redessinés à l'identique
dans un navigateur, avec les vraies couleurs et les vraies tailles du thème,
mais ce n'est pas l'application elle-même.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous | 170 tests, 0 échec |
| Références TypeScript | 78 fichiers, 0 erreur |
| Textes bruts, API dépréciées, graisses de police | 50 fichiers, rien à signaler |
| Styles inutilisés dans l'accueil | aucun |

### Ce que les tests ont exigé

Deux garde-fous écrits pour les versions précédentes ont refusé la V3.2 tant
que je ne les avais pas remis à jour, et c'est exactement leur rôle :

- celui de la V2.4 vérifiait la présence des trois bandeaux « Ma journée »,
  « Mon activité », « Mes repas ». Il vérifie désormais l'ordre de lecture —
  jauge, puis bulles, puis repas — et que les séquences vidéo et le conseil
  illustré ne sont pas revenus sur l'accueil ;
- celui de la V2.9 vérifiait que l'activité passait avant les repas. Il
  vérifie maintenant que l'estimation s'ouvre au-dessus de la liste des repas,
  et que les deux boutons portent un libellé complet pour les lecteurs
  d'écran (« Ajouter un repas », « Ajouter une activité »), même si le texte
  affiché est raccourci faute de place.

Le test de l'écran d'accord refuse en plus, explicitement, les formulations
familières de la version précédente.

## Aperçu visuel

Quatre états regardés : l'accueil rempli, l'accueil après appui sur « Une
activité », une journée vide, et l'écran d'accord réécrit.

Ce que l'aperçu confirme : tout l'accueil tient au-dessus de la barre de
navigation — jauge, les deux chiffres, les deux boutons — alors que la V3.1
demandait de faire défiler pour atteindre les repas.

## À vérifier de ton côté

1. Ouvre l'accueil. Le centre de la jauge doit annoncer **ce qu'il te reste**,
   avec le total en petit dessous.
2. Dépasse ton repère (ajoute un gros repas) : le centre doit passer à
   « AU-DESSUS DE » suivi de l'écart, jamais un nombre négatif.
3. Les deux bulles doivent afficher leur chiffre, leur détail et leur bouton
   sans qu'aucun texte ne soit coupé.
4. La bulle « Dépensé » doit additionner **pas et séances** dans sa deuxième
   ligne.
5. Touche « Une activité » : la phrase à compléter s'ouvre juste en dessous,
   avec la liste des activités déjà dépliée. « Annuler » la referme.
6. Touche le corps de la bulle « Dépensé » (pas le bouton) : l'écran complet
   de l'activité doit s'ouvrir.
7. Touche « Un repas » : le formulaire d'ajout doit s'ouvrir comme avant.
8. Journée sans rien : les deux bulles affichent 0, « Aucun repas noté » et
   « Pas à renseigner », sans que rien ne ressemble à un reproche.
9. Agrandis les textes dans les réglages d'accessibilité du téléphone, puis
   rouvre l'accueil : les bulles doivent rester lisibles, quitte à ce que le
   texte passe sur deux lignes.
