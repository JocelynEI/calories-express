# Vérification V1.7 — 19 septembre 2026

## Contrôles réalisés

- TypeScript strict : succès.
- 42 assertions historiques, 22 tests V1.4, 15 tests V1.5, 14 tests V1.6 et 14 tests V1.7 : succès.
- 7 tests des formulaires React réels : succès. Ils exécutent les changements de champs, changements de mode et validations avec des composants natifs remplacés par des hôtes de test ; ils ne vérifient pas le rendu natif.
- Expo Doctor : 21 contrôles sur 21 réussis.
- Export iOS, Android et Web avec Expo SDK 57 : succès. Exports lancés en mode hors ligne après installation des dépendances.
- Migration : conservation des anciennes séances, des pas, des valeurs de séance et des totaux journaliers après sérialisation puis relecture. Une entrée journalière corrompue n’efface pas les autres données.

Les tests des formulaires couvrent : poids fourni sans profil complet, profil alimentaire invalide mais poids valide, saisie de kcal sans poids, activité libre, refus de durée/kcal manquantes, zéro explicite, correction d’une séance en conservant son identifiant, remplacement de source, confirmation d’un total actif journalier et confirmation de son retrait.

Les tests métier couvrent aussi : toutes les activités et intensités proposées, kcal de pas et séances distinctes, dédoublonnage marche/pas, mise à jour et suppression, dates séparées, total montre qui remplace le cumul, total zéro, exclusion d’une activité habituelle, modes fixe/manuel/ajusté, maintien du déficit prévu et bilans partiels.

`react-test-renderer` émet son avertissement de dépréciation. Il est utilisé uniquement en développement, épinglé à la version de React ; il n’entre pas dans les écrans de l’application.

Aucun téléphone iOS ou Android physique n’est connecté à cet environnement.
La lisibilité, le clavier, les interactions tactiles et la persistance réelle dans
Expo Go restent à vérifier sur le téléphone. Les exports ne sont pas des APK/IPA signés.

## Parcours rapide sur le téléphone

1. Arrêter l’ancienne version avec Ctrl+C, extraire le nouveau ZIP dans Téléchargements et lancer la commande du README. Dans le bas du Profil, vérifier **version 1.7.0** pour ne pas tester un ancien dossier.
2. Dans **Mon activité → Ma séance**, choisir Marche, 30 min, poids 80 kg, intensité modérée : **≈112 kcal actives** avant validation. Enregistrer : félicitations de Jaws, séance et total visibles. Une durée ou un poids manquant doit expliquer quoi compléter.
3. Pour faire évoluer le repère alimentaire : **Activer l’ajustement avec mon activité → Calculer avec mon profil → Ajusté à ma journée → Enregistrer mon objectif**. Le bilan doit montrer la base + le crédit d’activité. Un mode fixe continue à afficher les kcal, sans déplacer le repère.
4. Dans **Mes pas**, saisir 6 000 pas, poids 75 kg, 2 000 habituels : **≈150 kcal actives**. Pour isoler ce test, supprimer la séance de l’étape 2. Ajouter une séance de vélo modéré, 20 min, 75 kg : **≈150 kcal** supplémentaires, soit **≈300 kcal** de dépense active totale et **250 kcal** de crédit ajusté.
5. Dans **Ma séance → Saisir mes kcal**, choisir Natation, 35 min, **280 kcal**, provenance Apple Watch. Enregistrer : 280 kcal pour cette séance, aucune estimation MET ajoutée à cette valeur. Sans autre saisie, le total est 280 kcal. Le profil n’est pas nécessaire pour recopier ces kcal.
6. Modifier cette séance à 300 kcal : une seule séance, total remplacé. Revenir à l’estimation : poids et intensité demandés, valeur montre abandonnée. Supprimer : le bilan se recalcule. Une ancienne séance sans kcal propose **Compléter les kcal de cette séance**.
7. Dans **Total montre**, saisir **620 kcal actives**, allocation habituelle **50**, provenance Apple Watch et confirmer « pas + séances inclus ». Le bilan devient **620**, quel que soit le cumul estimé précédent. Dans le mode ajusté et sans séances exclues, le crédit est **570**. Remplacer par 700 : total 700, pas 1 320. Ajouter ensuite une séance : le total montre reste 700 et le message demande de le mettre à jour si nécessaire.
8. Retirer le total montre avec confirmation : les pas et séances sont toujours présents et leur cumul estimé revient. Changer de jour : les valeurs ne se reportent pas. Fermer puis rouvrir Expo Go : les valeurs sauvegardées doivent revenir.
9. Modifier un champ puis tenter de changer de formulaire/date ou fermer : demande d’enregistrement/annulation, pas de perte silencieuse. Tester retour Android, petit écran, texte agrandi et clavier ouvert.
10. Vérifier que les repas, recettes et Jaws silencieux restent utilisables. Les parcours photo, aliments et confidentialité sont décrits dans `RECETTE_V16.md` ; leur intégration native n’a pas été revalidée dans cette version.

## Limites de calcul explicites

- Les kcal actives indiquent une estimation de dépense, pas une perte de graisse mesurée.
- Les paramètres MET et le modèle de pas sont détaillés dans `SOURCES_DONNEES.md`.
- Le dédoublonnage retient la plus grande valeur entre pas et séances incluses dans les pas. Sans horaires, il ne peut pas reconstituer exactement les périodes communes.
- Une valeur de montre est recopiée manuellement. Aucun capteur, HealthKit ou Health Connect n’est lu automatiquement.
- Un total actif journalier fait autorité pour la date tant qu’il est conservé. Il doit être actualisé après les nouvelles activités.
