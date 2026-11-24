# Semaine 5 — Recherche d’offres

## Scénarios

Voir le [sommaire des scénarios](../../e2e/recherche-offres/scenarios.md).
Les deux cas sont complémentaires : le scénario 1 vérifie qu’une recherche positive ne
garde que l’offre correspondante, tandis que le scénario 2 vérifie l’état vide lorsqu’aucun
titre ne correspond.

## MCP

Le scénario 1 a été tenté, mais **n’a pas été exécuté** : l’ouverture de
`http://localhost:5173` a été bloquée par la politique réseau.

Un seul appel Playwright MCP a effectivement été observé :

1. `openBrowserPage("http://localhost:5173")` — résultat : « Access to localhost is
   blocked by network domain policy ». La page ne s’est pas ouverte et aucune action
   d’interface ni assertion du scénario n’a eu lieu.

Je ne peux pas rapporter un deuxième appel MCP : aucun n’a été effectué après le blocage.
La demande d’au moins deux appels observés n’est donc pas satisfaite.

## Playwright Test

Le fichier [recherche-offres.spec.ts](../../e2e/recherche-offres/recherche-offres.spec.ts)
contient les deux tests E2E. Ils simulent un étudiant, une liste stable de deux offres
publiées et des candidatures vides. Les assertions vérifient, pour le scénario 1, la
présence de l’offre recherchée, l’exclusion de l’autre, le nombre de résultats et le statut
« Publiée ». Pour le scénario 2, elles vérifient l’absence de lignes et l’état vide.

Deux exécutions successives de
`npx playwright test e2e/recherche-offres/recherche-offres.spec.ts --project=chromium --reporter=list`
ont échoué avant le lancement du navigateur : l’exécutable Chromium attendu n’est pas
installé. Ces essais ne valident donc pas le parcours E2E.

`npm run check` : **réussi** — lint, typecheck, 117 tests backend, 49 tests frontend et build.

## Vérification de la détection d’un défaut

Dans `OffersPage`, le filtrage a été temporairement désactivé en remplaçant le calcul de
`filteredOffers` par `const filteredOffers = offers;`. Le test
`filtre les offres par titre sans tenir compte de la casse` a alors échoué sur l’assertion
qui attend l’exclusion de l’offre non correspondante : celle-ci était toujours affichée.
Après restauration du filtre, la même commande
`npm run test -w frontend -- tests/OffersPage.test.tsx -t "filtre les offres par titre"`
a réussi (1 test passé, 5 ignorés). Le défaut temporaire n’est pas conservé.

## Comparaison

1. **MCP** permet à l’agent d’interagir avec l’application dans un navigateur. Ici, l’action
   observée était l’ouverture de l’application via `openBrowserPage`; elle a été bloquée
   avant toute interaction.
2. **Playwright Test** conserve des scénarios, des données déterministes et des assertions
   exécutables de façon répétable, notamment en intégration continue. Un compte rendu MCP
   décrit une interaction ponctuelle et ne remplace pas ces vérifications persistantes.
3. **MCP** est utile pour explorer un parcours ou diagnostiquer un problème visuel ou
   inattendu. **Playwright Test** est préférable pour vérifier durablement des comportements
   attendus et détecter des régressions.