# Recette V3.1 — ce qui a été vérifié

## Ce que je ne peux pas faire

Je n'ai jamais exécuté l'application : mon environnement ne peut pas installer
les dépendances npm. Je n'ai pas non plus pu créer de tableur Google ni
publier le script Apps Script — cette partie-là, tu es le seul à pouvoir la
faire, et c'est elle qu'il faudra vérifier en premier.

## Vérifications automatiques

| Vérification | Résultat |
| --- | --- |
| Logique métier et garde-fous | 170 tests, 0 échec |
| Références TypeScript | 77 fichiers, 0 erreur |
| Textes bruts, API dépréciées, graisses de police | 49 fichiers, rien à signaler |

### Ce que les nouvelles assertions protègent

Le journal de test ne vaut que par ce qu'il ne laisse pas passer. Les tests
essaient donc de le contourner, de six façons :

- un nom d'action bricolé qui contiendrait un aliment
  (`repas-ajoute: 250 g de pâtes`) ;
- un nom d'action qui contiendrait un poids (`poids-82`) ;
- un prénom ou une adresse mail à la place du numéro de visiteur ;
- un aliment à la place du numéro de version ;
- un champ ajouté après coup à un message valide (`poids`, `aliment`) ;
- une largeur d'écran exacte au lieu de la catégorie.

Chaque tentative doit produire `null` ou un refus, et c'est vérifié une par
une. Un test relit aussi le fichier de configuration pour s'assurer que
l'adresse du journal part **vide** du dépôt, et un autre relit le script
Google pour vérifier qu'il applique le même filtre que l'application.

Trois tests couvrent l'accord : rien ne part sans un oui, rien ne part hors du
web, rien ne part sans adresse ; et la question ne se pose ni deux fois, ni
après un refus, ni là où il n'y a pas de journal.

Un test de plus vérifie que les repères sont posés **par paires** — ouverture
du formulaire et abandon, profil commencé et profil terminé — parce qu'un
seul des deux ne dirait rien.

Enfin, l'ancienne suite a fait son travail : elle a refusé la V3.1 tant que le
nouveau réglage n'était pas déclaré dans les valeurs par défaut.

## Aperçu et simulation

J'ai simulé une visite complète en passant par le vrai code du domaine —
ouverture, création de profil, séance estimée puis enregistrée, formulaire de
repas ouvert puis abandonné — et vérifié qu'aucun des treize messages n'était
refusé. Le tableau qui en résulte est dans l'image jointe, à côté de l'écran
qui demande l'accord, redessiné à l'identique.

## À vérifier de ton côté

**Avant d'avoir configuré quoi que ce soit**, l'application doit se comporter
exactement comme la V3.0 : aucune question à l'ouverture, aucun réglage
« Aider au test » dans Profil. Si tu vois l'un des deux, c'est que l'adresse
n'est pas vide.

**Une fois le tableur en place** (suis `docs/JOURNAL_DE_TEST.md`) :

1. Ouvre le site : la question doit apparaître avant tout le reste.
2. Réponds « Non merci ». Navigue, ajoute un repas. **Aucune ligne** ne doit
   arriver dans le tableur.
3. Va dans Profil, active « Aider au test ». Change d'écran : les lignes
   doivent apparaître en quelques secondes.
4. Ouvre le formulaire de repas et ferme-le sans valider : tu dois voir
   `ouvre-ajout-repas` puis `ajout-repas-abandonne`.
5. Relis les colonnes du tableur : aucune ne doit contenir un aliment, un
   chiffre de calories ou un poids. Si tu en vois un, arrête tout et
   dis-le-moi.
6. Ouvre le site sous Expo Go ou sur ton téléphone : aucune question, aucune
   ligne.
7. Coupe l'interrupteur dans Profil : les lignes doivent cesser immédiatement.
