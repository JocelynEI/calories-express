# Recette V1.8 — 19 septembre 2026

## Ce qui a été vérifié pendant le développement

| Vérification | Résultat |
| --- | --- |
| `npm run test:logic` | 82 tests, tous verts (22 + 15 + 14 + 14 + 17) |
| Compilation TypeScript du domaine, mode `strict` | aucune erreur |
| Contrôle de syntaxe de tous les `.ts`/`.tsx` | aucune erreur |
| Tests rejoués sous `TZ=UTC` et `TZ=Pacific/Auckland` | identiques : aucune dérive de fuseau |
| Contrastes de la palette (WCAG) | texte ≥ 4,5:1, traits et icônes ≥ 3:1 |
| Icône relue à 180, 120, 76, 48 et 32 px | lisible à toutes les tailles |

**Ce qui n’a pas pu être vérifié ici** : l’application n’a pas été lancée. Le
registre npm n’était pas accessible depuis l’environnement de développement
(`403` sur une dépendance transitive d’Expo), donc ni `npm install`, ni
`npx expo start`, ni `npm run check`, ni `npm run test:activity-ui` n’ont pu
tourner. Le rendu réel, les animations et la mise en page sur téléphone
restent à valider par le parcours ci-dessous.

## À faire au premier lancement

```bash
bash ~/Downloads/Calories-Express-V1.8-2026-09-19/Lancer-Calories-Express.command
```

Puis, dans le dossier du projet :

```bash
npm run check          # vérification TypeScript complète, avec les types d'Expo
npm run test:logic
npm run test:activity-ui
npx expo-doctor
```

## Parcours de test sur téléphone

### 1 · La reprise des données

1. Ouvre l’application avec le journal de la V1.7 déjà présent.
2. **Vérifie que les repas, l’activité, le profil et l’objectif sont retrouvés.**
   C’est le point le plus important : le slug Expo et les clés de stockage n’ont
   pas changé. Si le journal est vide, arrête-toi et signale-le.
3. Ouvre **Profil → Sauvegarder mes données → Préparer une sauvegarde** et
   vérifie que le texte contient bien tes repas.

### 2 · L’accueil

4. Le grand nombre du baromètre est **ce qu’il te reste**, pas ce que tu as saisi.
5. Au-dessus du repère, il affiche `+` et l’écart, avec un libellé sans jugement.
6. La ligne de trois chiffres sous l’anneau montre Mangé, Repère et Activité.
7. Le bouton (i) ouvre et referme l’explication du calcul, sans quitter l’écran.
8. La pastille d’objectif ouvre bien **Changer mon objectif**.
9. Avec un profil non enregistré, la carte de Jaws apparaît et mène au profil.

### 3 · La navigation par date

10. Les flèches sous ton prénom reculent et avancent d’un jour.
11. La flèche « suivant » est inactive sur aujourd’hui : **aucune journée future**.
12. Sur une journée passée, un bandeau ambre le rappelle.
13. Ajoute un repas depuis une journée passée : il est daté de **cette** journée
    et apparaît dans son journal, pas dans celui d’aujourd’hui.
14. Le bouton **Aujourd’hui** revient au jour en cours.
15. Dans Journal, les puces des sept dernières journées saisies fonctionnent.
16. Dans Progression, toucher une barre ouvre la journée correspondante.

### 4 · Modifier et refaire un repas

17. La flèche sur une carte de repas ouvre la modification : change le moment et
    une quantité, enregistre, vérifie le nouveau total.
18. Ferme la modification après un changement : la confirmation « abandonner les
    modifications » apparaît, et le repas d’origine reste intact.
19. Supprime une entrée depuis Journal : la confirmation s’affiche dans la carte.
20. Sur l’accueil, une puce **Refaire** recopie un repas habituel avec les mêmes
    aliments, daté de la journée consultée.
21. Modifie un repas saisi avant la V1.6 : l’application explique que la
    référence de calcul manque, au lieu d’inventer une quantité.

### 5 · Le poids

22. Dans Progression, note une pesée : elle concerne la **journée consultée**.
23. Note une deuxième valeur le même jour : elle remplace la première.
24. Essaie 12 kg puis 500 kg : les deux sont refusés avec un message clair.
25. Avec moins de deux pesées, la courbe annonce qu’elle attend des données.
26. Avec plusieurs pesées, **une seule ligne violette** est tracée ; les pesées
    restent en points gris.
27. La phrase de tendance ne promet **ni date, ni poids futur**.
28. « Retirer la pesée de cette journée » fonctionne et ne touche pas au journal.

### 6 · Les minutes de Jaws

29. Depuis l’accueil, lance une séquence : elle avance seule, scène par scène.
30. Les barres du haut se remplissent une par une.
31. Le bouton pause arrête l’avance ; reprendre repart où c’était.
32. Toucher à droite avance, à gauche recule ; **Précédent** et **Suivant** aussi.
33. La dernière scène montre Jaws, puis l’écran de fin propose Revoir et la
    séquence suivante.
34. Après lecture, la carte de la séquence porte **Déjà vue** et passe en fin de
    liste, sans jamais disparaître.
35. Vérifie qu’aucune séquence n’ajoute de minutes, de kcal ou d’activité au
    journal.
36. Coupe le Wi-Fi et les données mobiles, puis relance une séquence : **elle
    doit fonctionner exactement pareil**.
37. Les six séquences sont accessibles depuis Progression et depuis le Profil.

### 7 · Accessibilité

38. Profil → désactive **Animations**. Les séquences n’avancent plus seules et
    attendent « Suivant » ; les scènes s’affichent dans leur état final.
39. Active la réduction d’animations du téléphone : même comportement.
40. Active VoiceOver ou TalkBack : l’avance automatique est désactivée, le
    baromètre est annoncé avec le total, le repère et le restant, et chaque
    barre du graphique annonce sa journée.
41. Passe la taille de texte du système au maximum : les cartes de l’accueil, du
    journal et de la progression restent lisibles, sans texte coupé.

### 8 · Android

42. Ouvre une séquence, appuie sur **retour** : elle se ferme, l’application reste.
43. Recule d’une journée, appuie sur retour : tu reviens à aujourd’hui.
44. Va dans un autre onglet, appuie sur retour : tu reviens à Aujourd’hui.
45. Depuis l’accueil, retour quitte normalement l’application.
46. Ouvre **Ajouter un repas** avec une saisie en cours et appuie sur retour :
    la confirmation de la modale s’affiche, rien n’est perdu.

### 9 · Ce qui existait déjà

47. Recherche Ciqual hors connexion, recherche de marque en ligne, code-barres
    au clavier, photo d’étiquette, plat maison, pas, séance, total montre,
    bulles de Jaws après un repas : tout doit fonctionner comme en V1.7.

## Reste à faire avant une distribution publique

Les builds signés iOS et Android, les fiches des stores, les informations de
confidentialité, l’enregistrement de l’usage de l’API Open Food Facts et un
contact d’application ne sont pas couverts par cette version. Les exports
techniques ne sont pas des APK/IPA signés ni une publication.
