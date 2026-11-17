# Audit des tests des candidatures (EF-32 et EF-33)

| Cas à vérifier | Test existant et assertion utile | Manque confirmé ou constat écarté |
|---|---|---|
| Refus d'une candidature à une offre non publiée | [`applications.test.ts`](../../backend/tests/applications.test.ts#L59) vérifie le statut `409` et le code `OFFER_NOT_PUBLISHED`. | Manque écarté |
| Retrait d'une candidature déjà traitée | [`applications.test.ts`](../../backend/tests/applications.test.ts#L102) vérifie le statut `409` et le code `APPLICATION_PROCESSED`. | Manque écarté |
| Accès aux candidatures d'un autre étudiant | [`applications.test.ts`](../../backend/tests/applications.test.ts#L15) vérifie que la liste contient uniquement la candidature de Lucas. | Manque écarté |
| Retrait d'une candidature en cours appartenant à un autre étudiant | Aucun test ne vérifiait ce cas d'ownership. | **Manque confirmé** |
| Affichage et retrait d'une candidature côté frontend | [`ApplicationsPage.test.tsx`](../../frontend/tests/ApplicationsPage.test.tsx#L54) vérifie les libellés français et l'appel `DELETE`. | Manque écarté pour ce périmètre |

## Test ajouté

Le test ajouté dans [`applications.test.ts`](../../backend/tests/applications.test.ts#L111) tente de retirer la candidature en cours d'Inès avec le jeton de Lucas. Il vérifie que l'API répond avec le statut `404` et le code `NOT_FOUND`.

Commande exécutée :

```text
npm run test -w backend -- tests/applications.test.ts
```

Résultat : **9 tests passés**. Aucun défaut applicatif n'a été révélé.

## Recherche par mot-clé des offres (EF-30)

### TDD

Avant l'implémentation, des tests backend et frontend ont été ajoutés pour décrire le
comportement attendu :

- recherche d'une expression dans le titre, sans distinguer les majuscules et les
  minuscules ;
- suppression des espaces au début et à la fin ;
- combinaison avec le filtre par période ;
- maintien de la visibilité des offres pour un étudiant ;
- liste vide en cas d'absence de correspondance et message adapté côté frontend ;
- refus d'un paramètre `q` répété.

Les tests ont d'abord été exécutés avant toute modification du code applicatif. Ils ont
été vus en échec : **4 tests backend** et **2 tests frontend** échouaient, car le backend
ignorait `q` et le champ de recherche n'existait pas encore. Après l'implémentation, ces
tests sont passés.

Les tests proposés étaient pertinents avant de donner l'accord pour l'implémentation :
ils couvraient les règles métier principales, les limites d'entrée et l'intégration
frontend/backend, tout en vérifiant que la visibilité existante n'était pas contournée.

### Recherche : cas essayés

- recherche multi-mots avec espaces extérieurs : `  API REST  ` ;
- recherche sans tenir compte de la casse ;
- recherche combinée avec `period=P2` ;
- recherche par un étudiant, limitée aux offres `PUBLISHED` ;
- recherche sans correspondance ;
- recherche vide composée uniquement d'espaces ;
- paramètre `q` répété ;
- affichage du champ de recherche et du message
  `Aucune offre ne correspond à votre recherche.`.

### Validation

La commande suivante a été exécutée :

```text
npm run check
```

Résultat : **succès complet** : lint, typecheck, **122 tests backend**, **50 tests
frontend** et build de production.

### Problèmes restants

Aucun problème restant dans le périmètre de la séance. La recherche approximative et la
gestion particulière des accents restent volontairement hors périmètre, conformément aux
règles retenues.