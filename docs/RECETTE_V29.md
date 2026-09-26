# Recette V2.9 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : mon environnement ne peut pas installer
les dépendances npm. La police Plus Jakarta Sans ne peut pas non plus être
chargée dans mes aperçus. Le seul test qui compte reste le tien.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous | 153 tests, 0 échec |
| Références TypeScript | 73 fichiers, 0 erreur |
| Textes bruts, API dépréciées, graisses de police | 48 fichiers, rien à signaler |

### Ce que les nouvelles assertions protègent

- **La question et la phrase sont dans le code.** « Combien ai-je dépensé ? »,
  « J'ai fait … pendant … », « kilocalories dépensées » : si l'un de ces textes
  disparaît, le test échoue. C'est la formulation qui fait comprendre le bloc,
  pas le composant.
- **Les deux blancs de la phrase s'ouvrent au toucher.** Une phrase qu'on ne
  peut pas remplir serait pire qu'un formulaire.
- **L'ordre de l'accueil.** Le test lit les trois titres de l'accueil et exige
  « Ma journée », puis « Mon activité », puis « Mes repas ». C'est le cœur de
  la V2.9 : personne ne doit plus descendre pour trouver l'estimation.
- **Aucune activité proposée ne peut afficher 0 kcal.** Les huit choix de la
  liste sont chiffrés par le moteur, sans profil, avec le poids moyen — si une
  activité était ajoutée sans valeur MET, le test le dirait avant toi.
- **Chaque durée donne un chiffre qui monte.** 10, 15, 20, 30, 45, 60, 90 min :
  le test vérifie que la dépense croît avec le temps passé.
- **La phrase reste du français.** Chaque activité a une tournure avec son
  article (« du vélo », « de la natation », « de l'aquagym ») et le test refuse
  toute activité qui n'en aurait pas : « J'ai fait Natation » ne se dit pas.
- **Le cas de départ.** 30 minutes de natation, sans rien avoir réglé : 245 kcal.

## Aperçu visuel

Faute de pouvoir lancer l'application, j'ai redessiné le bloc à l'identique
dans un navigateur, avec les vraies couleurs, tailles et espacements du thème,
et je l'ai regardé dans cinq états : à l'ouverture, liste des activités
ouverte, liste des durées ouverte, phrase la plus longue possible
(« de la course à pied » + « 90 min »), et après enregistrement.

Ce que l'aperçu a montré :

- la phrase la plus longue passe sur deux lignes, sans rien couper ;
- les huit activités tiennent en trois rangées et repoussent le résultat vers
  le bas — c'est pour cela que la liste se referme dès qu'un choix est fait ;
- le chiffre reste le plus gros élément de la carte dans tous les états.

## À vérifier de ton côté

1. Ouvre l'accueil : après le baromètre, le deuxième bloc doit être
   « Mon activité » et poser la question « Combien ai-je dépensé ? ».
2. Touche « de la natation » : la liste s'ouvre, un choix la referme, et le
   chiffre change sous tes yeux.
3. Touche « 30 min » : même chose avec les durées.
4. « Enregistrer cette séance » : Jaws félicite, et « Estimer une autre
   séance » revient à la phrase.
5. Sans profil rempli, le bandeau jaune doit annoncer le poids moyen de 70 kg.
6. « Intensité, poids, montre : tout régler » doit toujours ouvrir le
   formulaire complet, sans rien avoir perdu.
7. Descends : « Mes repas » suit, avec tout ce qu'il contenait avant.
