# Recette V1.9 — 20 septembre 2026

## Vérifié pendant le développement

| Vérification | Résultat |
| --- | --- |
| `npm run test:logic` | 95 tests, tous verts (22 + 15 + 14 + 14 + 18 + 12) |
| Compilation du domaine, mode `strict` | aucune erreur |
| Contrôle de syntaxe de tous les `.ts`/`.tsx` | aucune erreur |
| Un seul pilote d'animation par fichier | vérifié par test sur `StoryScene`, `StoryPlayer` et `OnboardingScreen` |
| Logo relu à 170, 96, 56 et 34 px, sur fond clair et sombre | lisible partout |
| Les six étapes rendues en maquette et relues | mise en page validée |

**Non vérifié ici** : l'application n'a pas été lancée — le registre npm reste
inaccessible depuis l'environnement de développement. Les animations réelles,
le clavier et le défilement restent à valider sur téléphone.

## Le parcours d'accueil

### Premier lancement

1. Le parcours s'ouvre tout seul, sur l'étape **Bienvenue**. L'anneau du logo se dessine.
2. La flèche retour est invisible sur la première étape.
3. **Passer** est disponible dès la première étape et ferme le parcours sans rien enregistrer.
4. Étape **Prénom** : la barre affiche un quart. Le champ est facultatif — « Continuer » fonctionne à vide.
5. Ce que tu tapes apparaît en direct sous « Bonjour … ».
6. Étape **Objectif** : les trois cartes arrivent en cascade ; la sélection se voit.
7. Étape **Chiffres** : le clavier ne cache pas le bouton ; les champs montent avec lui.
8. Laisse un champ vide et touche Continuer : le message indique **quel** champ, et le champ se souligne en rouge.
9. Saisis 12 ans : le message parle d'âge adulte. Saisis 500 kg : le message donne les bornes.
10. Étape **Activité** : quatre cartes ; « Voir mon repère » mène à la dernière.
11. Étape **Repère** : l'anneau se remplit, le nombre monte, puis le calcul se déplie.
12. Vérifie que le repère annoncé **correspond** à celui de l'accueil juste après.
13. « C'est parti » enregistre le profil et ouvre l'application.

### Ce qui ne doit pas arriver

14. Quitte le parcours en cours (Passer) : **aucun profil n'est enregistré**, et le journal reste intact.
15. Relance l'application : le parcours **ne réapparaît pas**.
16. Si tu mets à jour depuis la V1.8 avec un profil déjà enregistré, le parcours **ne s'affiche jamais**.

### Rejouer

17. **Profil → Refaire la création de mon profil** : le parcours repart à zéro.
18. Va jusqu'à l'étape 3 puis touche **Passer** : ton profil et ton journal sont **inchangés**.
19. Refais-le en entier : le profil est remplacé, le journal est conservé.
20. Sur Android, le bouton retour referme le parcours rejoué.

### Accessibilité

21. Profil → désactive **Animations** : les étapes s'affichent sans mouvement, tout reste utilisable.
22. Avec VoiceOver ou TalkBack : la barre est annoncée comme une progression, les cartes comme des boutons radio.
23. Taille de texte au maximum : les six étapes restent lisibles et défilent.

## Le logo

24. Sur l'écran d'accueil du téléphone, l'icône claire se distingue des icônes sombres.
25. Sur Android, l'icône adaptative a un fond lavande, et l'icône monochrome reste lisible.

## Le reste

26. Rejoue la recette V1.8 (`docs/RECETTE_V18.md`) : séquences, dates, poids, repas.
