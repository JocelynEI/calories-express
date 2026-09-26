# Le journal de test — mode d'emploi

Pendant la phase de test, la **version web** peut écrire une ligne dans un
tableur à chaque action importante. Tu vois ainsi le parcours de chaque
testeur : ce qu'il ouvre, ce qu'il réussit, ce qu'il abandonne.

Rien n'est envoyé tant que trois conditions ne sont pas réunies : la personne
a dit oui, on est bien sur le site, et l'adresse du journal est renseignée
dans `src/config/test-journal.ts`. Par défaut, cette adresse est vide : la
V3.1 livrée n'envoie rien et ne pose aucune question.

## Ce qui part, et ce qui ne part jamais

Six colonnes, pas une de plus :

| Colonne | Contenu | Exemple |
| --- | --- | --- |
| Date et heure | L'horodatage | 2026-09-26T18:04:11.201Z |
| Visiteur | Un numéro tiré au sort (toujours dix signes, commençant par un chiffre) | 3f9dp2a1ck |
| Visite | Un numéro pour cette ouverture | 0q7b4x2zem |
| Action | Un nom pris dans une liste fermée | repas-ajoute |
| Version | La version de l'application | 3.1.0 |
| Appareil | telephone, tablette ou ordinateur | telephone |

Ne peuvent pas sortir de l'application : les aliments, les quantités, les
calories, le poids, la taille, l'âge, l'objectif, le prénom, les photos. Ce
n'est pas une promesse, c'est une mécanique : `src/domain/telemetry.ts`
n'accepte que ces six champs et rejette tout message qui en contient un autre.
Le script Google fait le même contrôle de son côté.

## Les actions notées

**Écrans** — `ecran-accueil`, `ecran-journal`, `ecran-progression`, `ecran-profil`.

**Repas** — `ouvre-ajout-repas`, `repas-ajoute`, `repas-modifie`,
`ajout-repas-abandonne`, `aliment-cherche`, `etiquette-scannee`.

**Activité** — `ouvre-activite`, `activite-commencee`, `seance-estimee`,
`seance-enregistree`, `activite-abandonnee`.

**Profil** — `profil-commence`, `profil-termine`, `profil-passe`.

**Divers** — `premiere-ouverture`, `erreur-affichee`.

Les deux paires qui apprennent le plus : `ouvre-ajout-repas` contre
`repas-ajoute` (combien ouvrent le formulaire sans aller au bout), et
`profil-commence` contre `profil-termine` (où décroche la création de profil).

## Mise en place — 15 minutes, une seule fois

1. Va sur [sheets.new](https://sheets.new) : un tableur vide s'ouvre.
   Nomme-le « Journal de test — Calories Express ».
2. Menu **Extensions > Apps Script**. Un éditeur de code s'ouvre dans un
   nouvel onglet.
3. Efface tout ce qu'il contient, et colle à la place le contenu du fichier
   `docs/journal-de-test.gs` de ce dossier.
4. Clique sur l'icône de disquette pour enregistrer.
5. En haut à droite : **Déployer > Nouveau déploiement**. Clique sur la roue
   dentée, choisis **Application web**.
6. Règle « Exécuter en tant que » sur **moi**, et « Qui a accès » sur
   **tout le monde**. C'est nécessaire : tes testeurs ne sont pas connectés à
   ton compte Google.
7. **Déployer**. Google demande une autorisation la première fois : accepte
   (« Paramètres avancées » puis « Accéder à… » si l'écran d'avertissement
   apparaît — c'est ton propre script).
8. Copie l'**URL de l'application web**. Elle ressemble à
   `https://script.google.com/macros/s/AKfycb.../exec`.
9. Colle-la dans `src/config/test-journal.ts`, entre les apostrophes.
10. Republie le site (partie 6 du fichier de commandes).

## Vérifier que ça marche

Ouvre ton site, accepte la question, navigue entre deux écrans. Recharge le
tableur : les premières lignes doivent apparaître en quelques secondes. Si
rien n'arrive, vérifie dans l'ordre : l'adresse collée se termine bien par
`/exec`, le déploiement est réglé sur « tout le monde », et le site a bien été
republié après avoir collé l'adresse.

## Lire les résultats dans Excel

Dans le tableur : **Fichier > Télécharger > Microsoft Excel (.xlsx)**. Tu
obtiens un fichier que tu peux ouvrir à côté de ton fichier de suivi, filtrer
par visiteur, ou trier par action.

Pour compter rapidement une action précise, colle cette formule dans une
cellule vide, en remplaçant le nom entre guillemets :

    =NB.SI(D:D;"repas-ajoute")

## Arrêter le journal

Trois façons, de la plus douce à la plus définitive :

- Chaque testeur peut couper l'envoi depuis **Profil > Aider au test**.
- Toi : vide `TEST_JOURNAL_URL` dans `src/config/test-journal.ts` et republie
  le site. Plus rien ne part, et la question n'est plus posée.
- Côté Google : **Déployer > Gérer les déploiements > Archiver**. L'adresse
  cesse de répondre.

Quand le test est fini, pense à supprimer le tableur : ce sont des données
d'usage de personnes réelles, même sans leur nom, et elles n'ont plus de
raison d'exister une fois les corrections faites.
