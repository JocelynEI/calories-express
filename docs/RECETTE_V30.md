# Recette V3.0 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : mon environnement ne peut pas installer
les dépendances npm. La police Plus Jakarta Sans ne peut pas non plus être
chargée dans mes aperçus. Le seul test qui compte reste le tien.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous | 157 tests, 0 échec |
| Références TypeScript | 73 fichiers, 0 erreur |
| Textes bruts, API dépréciées, graisses de police | 48 fichiers, rien à signaler |

### Ce que les nouvelles assertions protègent

- **Rien n'est prérempli.** L'activité et la durée partent à `null`, et le test
  refuse toute valeur par défaut. Si quelqu'un remettait « natation, 30 min »
  au démarrage, la vérification échouerait.
- **Rien n'est mémorisé d'une séance à l'autre.** Après l'enregistrement, tout
  se vide — le test suit l'enchaînement `recordActivity` → `reset`.
- **Aucun chiffre sur une phrase incomplète.** L'estimation n'existe que si les
  deux blancs sont remplis : pas de 0 kcal trompeur, et le bouton
  « Enregistrer » n'apparaît pas avant.
- **Le premier blanc s'ouvre tout seul**, et choisir l'activité enchaîne sur la
  durée : on ne laisse personne devant une phrase à moitié écrite.
- **Côté repas aussi.** La quantité consommée ne vaut plus « 100 » par défaut ;
  le champ part vide, l'exemple reste en gris, et le formulaire refuse
  toujours de partir sans quantité.
- Les garde-fous de la V2.9 tiennent toujours : ordre des blocs sur l'accueil,
  huit activités toutes chiffrables sans profil, durées croissantes, tournures
  françaises pour chaque activité.

## Aperçu visuel

Le bloc a été redessiné à l'identique dans un navigateur — vraies couleurs,
vraies tailles, vrais espacements — et regardé dans ses cinq états : au repos,
phrase vide, activité choisie, phrase complète, séance enregistrée.

Ce que l'aperçu a corrigé : « Aquagym / Aquafitness » et « Circuit /
Fractionné » faisaient passer la liste de trois à quatre rangées. Les
pastilles portent désormais un nom court — « Aquagym », « Fractionné »,
« Course » — tandis que le nom complet reste celui du formulaire et celui
qu'annonce le lecteur d'écran.

## À vérifier de ton côté

1. Ouvre l'accueil. Sous le baromètre, « Mon activité » ne doit montrer qu'un
   bouton violet « Ajouter une activité » et une ligne d'explication. Aucun
   sport, aucune durée, aucun chiffre.
2. Touche le bouton : la phrase s'ouvre avec ses deux blancs gris, et la liste
   des activités s'ouvre toute seule.
3. Choisis une activité : elle se met en violet dans la phrase, et les durées
   s'enchaînent aussitôt.
4. Tant qu'il manque une réponse, **aucun chiffre ne doit apparaître**, et il
   ne doit pas y avoir de bouton « Enregistrer ».
5. Choisis une durée : le chiffre arrive, le bouton aussi.
6. Enregistre : Jaws félicite. Touche « Ajouter une autre activité » — la
   phrase doit repartir **vide**, sans se souvenir du sport précédent.
7. « Annuler » doit refermer le bloc et tout effacer.
8. Dans « Ajouter un repas » puis « Saisir mes valeurs », le champ de quantité
   doit être vide, avec un exemple en gris. Laisse-le vide et touche
   « Ajouter cet aliment » : un message doit te le réclamer.
