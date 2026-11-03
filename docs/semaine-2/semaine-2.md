# Choix

- Ajouter la gestion des candidatures de bout en bout : API, base de données et interface.
- Réserver les candidatures aux étudiants et empêcher les doublons ou les candidatures sur une offre non publiée.
- Prévoir le retrait d’une candidature uniquement lorsqu’elle est encore en cours.
- Conserver les statuts techniques en anglais dans l’API et les traduire en français dans l’interface.

# Résultat

La consultation, la création, la persistance et le retrait des candidatures fonctionnent.
Les contrôles d’accès, les doublons et les offres non publiées sont gérés. La principale
limite restante est l’absence de gestion côté interface pour les traitements administratifs
des candidatures.

# Modifications

- Backend : ajout du modèle, repository, service, contrôleur, mapper et route des candidatures.
- Frontend : ajout de la page, du tableau, du hook, du service et des libellés associés.
- Documentation : mise à jour de l’API et ajout du scénario de test manuel.
- Tests : ajout de tests backend sur les règles métier et d’un test frontend sur l’affichage et le retrait.

# Validation fonctionnelle

Les cas suivants ont été essayés avec succès :

1. Candidater à une offre publiée avec un message facultatif.
2. Retrouver la candidature après rechargement.
3. Afficher le statut « En cours ».
4. Retirer une candidature en cours.
5. Refuser les doublons, les offres non publiées et le retrait d’une candidature traitée.

# Qualité

Les règles d’accès sont vérifiées côté backend, les réponses API sont validées côté frontend
et les statuts restent cohérents entre les couches. La logique métier est séparée des
contrôleurs et les libellés français sont centralisés. Aucun problème bloquant n’a été relevé.

# Tests et commandes

- `npm test` : tests backend et frontend configurés, avec couverture des candidatures.
- Test backend ajouté : création, retrait, doublon, offre non publiée et contrôle du rôle étudiant.
- Test frontend ajouté : affichage des statuts français et appel de retrait.
- Scénario manuel `docs/semaine-2/tests e2e.md` : les cinq étapes ont été validées.

Exemple couvert : une candidature existante renvoie `409 APPLICATION_EXISTS`, tandis
qu’une candidature retirée peut être recréée.
