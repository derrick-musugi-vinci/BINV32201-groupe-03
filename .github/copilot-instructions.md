# Instructions Copilot pour Gesta

## Commandes

Les commandes suivantes se lancent depuis la racine du dépôt. Le projet utilise Node.js
22.14 ou plus récent et npm workspaces.

```bash
npm ci
npm run setup       # première installation : backend/.env puis base SQLite de démonstration
npm run dev         # API sur http://localhost:3000 et frontend sur http://localhost:5173
```

Vérifications disponibles :

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check       # lint + typecheck + tests + build
```

Pour cibler un workspace ou un test précis :

```bash
npm run test -w backend -- tests/companies.test.ts
npm run test -w frontend -- tests/CompaniesPage.test.tsx
npm run test -w backend -- -t "nom du test"
npm run test -w frontend -- -t "nom du test"
```

La base de développement peut être initialisée ou recréée avec `npm run db:init` et
`npm run db:reset`. Arrêter le serveur avant `db:reset`, notamment sous Windows. Le fichier
`.npmrc` contient `ignore-scripts=true` pour éviter la compilation native inutile de
`better-sqlite3`; ne pas le retirer sans raison.

## Architecture

Gesta est une application web en deux workspaces :

- `backend/` : API Express/TypeScript et SQLite via `better-sqlite3`.
- `frontend/` : application React/TypeScript servie par Vite.
- `docs/architecture.md` décrit les parcours et reste la référence détaillée.

En développement, le frontend appelle `/api/...`; le proxy Vite retire `/api` avant de
transmettre au backend sur le port 3000.

Le backend suit le flux :

```text
main.ts -> app.ts -> middlewares -> controllers -> services -> repositories -> SQLite
                                      mappers : DBO <-> métier <-> DTO
```

- `main.ts` charge la configuration, initialise la base et démarre le serveur.
- `app.ts` assemble les dépendances et les routes.
- Les contrôleurs valident les paramètres et construisent les réponses HTTP.
- Les services portent les règles métier et ne reçoivent jamais `Request` ou `Response`.
- Les repositories contiennent les requêtes SQL et retournent des DBO.
- Les mappers convertissent les DBO en objets métier puis en DTO d’API.
- `authenticate` établit `req.user`; `authorize` applique une règle d’accès; le
  `errorHandler` convertit les erreurs en `{ "error": { "code", "message" } }`.
- Les règles d’accès nommées doivent être centralisées dans
  `backend/src/services/permissions.ts`, puis appliquées côté backend. Le masquage d’une
  route dans le frontend ne remplace jamais cette vérification.

Le frontend suit le flux :

```text
pages -> hooks -> services/utils -> models
  \-> components
```

`App.tsx` appelle `useAuth` une seule fois et transmet la session aux pages. Les services
font les appels HTTP et valident les JSON avec les type guards; les hooks exposent l’état
prêt à afficher; les composants réutilisables ne connaissent pas les routes.

## Conventions spécifiques

### API, authentification et erreurs

- Le jeton est envoyé tel quel dans `Authorization`, sans préfixe `Bearer`.
- Le jeton ne contient que `kind` et `id`; l’identité, les rôles et les entreprises sont
  relus en base à chaque requête.
- Le mode `DEMO_AUTH_ENABLED=true` est réservé au développement local et est interdit avec
  `NODE_ENV=production`.
- Utiliser `throw new HttpError(status, code, message)` pour les erreurs attendues; laisser
  le middleware central produire le format JSON commun.
- Conserver les statuts et codes métier de l’API documentés dans `backend/API.md`.
- Mettre à jour `backend/API.md` et le fichier de requête correspondant dans `backend/http/`
  lorsqu’une route ou son contrat change.

### Backend et base de données

- Les imports relatifs backend se terminent par `.ts`; TypeScript les réécrit en `.js` au
  build. Respecter `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` et
  `noUnusedParameters`.
- Les fonctions `createX(...)` assemblent les repositories et services par injection de
  dépendances; conserver ce modèle pour rendre les tests composables.
- Les migrations sont des fichiers `backend/src/db/migrations/NNN_nom.sql`, appliqués une
  seule fois dans l’ordre alphabétique. Pour toute évolution, ajouter une nouvelle
  migration et ne jamais modifier une migration déjà appliquée.
- Les contraintes structurelles (clés étrangères, unicités, valeurs autorisées) vont dans
  SQLite; les règles métier et transitions de statut vont dans les services.
- Les statuts sont stockés en codes anglais (`PUBLISHED`, etc.); les libellés français
  sont une responsabilité de l’interface.
- Les tests backend utilisent Vitest et Supertest avec SQLite en mémoire via
  `backend/tests/helpers/testApp.ts`; ils ne doivent pas utiliser la base de développement.
  `seedIds.ts` fournit les identifiants stables des données de démonstration.

### Frontend et tests

- Le frontend utilise React Router, CSS simple et des composants sans bibliothèque UI.
- Les réponses API doivent passer par les helpers et type guards existants plutôt que par
  des assertions non vérifiées.
- Une réponse 401 doit passer par `onUnauthorized` afin de supprimer la session et
  revenir à la connexion.
- Les tests frontend utilisent Vitest, jsdom et Testing Library; les appels réseau sont
  simulés par les helpers de `frontend/tests/helpers/`.
- Les codes de statut restent en anglais dans les données; les textes affichés à
  l’utilisateur restent en français.

## Références de travail

- [README.md](../README.md) : installation, fonctionnalités existantes et limites du mode
  démo.
- [docs/architecture.md](../docs/architecture.md) : parcours complets par couche.
- [backend/API.md](../backend/API.md) : contrat HTTP et erreurs.
- [docs/seed.md](../docs/seed.md) : utilisateurs, entreprises et offres de démonstration.
- [.github/pull_request_template.md](./pull_request_template.md) : vérifications attendues
  dans une proposition de changement.
