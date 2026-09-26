# Recette V2.8 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : mon environnement ne peut pas installer
les dépendances npm. La police Plus Jakarta Sans ne peut pas non plus être
chargée dans mes aperçus. Le seul test qui compte reste le tien.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous | 147 assertions, 0 échec |
| Références TypeScript | 73 fichiers, 0 erreur |
| Textes bruts, API dépréciées, graisses de police | 48 fichiers, rien à signaler |

### Ce que les nouvelles assertions protègent

- **Estimer n'est pas créditer.** Sans profil, la dépense s'affiche, mais le
  repère alimentaire du jour n'est pas augmenté.
- **Les anciennes séances ne bougent pas.** Une séance enregistrée sans
  intensité garde le calcul prudent d'avant, même si la saisie rapide propose
  désormais l'allure habituelle.
- **Un poids aberrant reste refusé** (hors 35–300 kg), alors qu'un poids absent
  est désormais accepté.
- **Aucune félicitation ne récompense un total bas.** Une journée à 900 kcal
  sur un repère de 2 100 reçoit un mot sur les trois repas notés, et le test
  vérifie que le mot « repère » n'y apparaît pas.
- **Aucun reproche au-dessus du repère** : le test refuse les mots « trop »,
  « dépassé », « attention », « excès ».
- **Le mot sur la régularité reste rare** : rien aux jours 1, 2, 4, 6.

## À vérifier sur ton téléphone

1. **Accueil → Mon activité.** Choisis « Natation », « 30 min ». Le chiffre
   doit apparaître sans rien saisir d'autre, puis Jaws te félicite.
2. **Sans profil** (Profil → Effacer mon profil) : le chiffre doit s'afficher
   quand même, avec la mention « poids moyen de 70 kg ».
3. **Avec ton profil rempli** : la mention disparaît et le chiffre change.
4. **En fin de journée**, avec trois repas notés : la carte « Belle journée »
   doit apparaître sur l'accueil.
5. **Le formulaire complet** (lien « Intensité, poids, montre : tout régler »)
   doit avoir gardé tous ses réglages.
