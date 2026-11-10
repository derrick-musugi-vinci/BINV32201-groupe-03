### Inventaire

|  | Guide — feedforward | Senseur — feedback |
|---|---|---|
| **Inférentiel**<br>(interprété par une IA) | **Instructions Copilot** — `.github/copilot-instructions.md`<br>**Configuration de l’agent** — `settings.json`<br>**Copilot dans VS Code** — outil de génération assistée | **Agent Copilot** — interprétation des résultats de lint, de typage, des tests et du build |
| **Computationnel**<br>(règles ou calculs exécutables) | **Scripts npm** — `package.json`<br>**Configuration TypeScript** — `backend/tsconfig.json`<br>**Configurations Oxlint** — `backend/.oxlintrc.json`, `frontend/.oxlintrc.json` | **Oxlint** — `backend/.oxlintrc.json`, `frontend/.oxlintrc.json`<br>**TypeScript** — `backend/tsconfig.json`, configurations `frontend/tsconfig*.json`<br>**Vitest** — `backend/vitest.config.ts`, `frontend/package.json`<br>**Build TypeScript/Vite** — `backend/package.json`, `frontend/package.json` |

Le mécanisme inférentiel de guidage est constitué principalement du fichier
`.github/copilot-instructions.md`. Il donne à l’agent le contexte du projet, son
architecture, ses conventions et les commandes disponibles. Il impose par exemple que
les services backend ne reçoivent pas les objets `Request` et `Response`, que les erreurs
attendues utilisent `HttpError` et que les règles d’accès soient vérifiées côté backend.
Ces instructions ont été lues et utilisées pendant la séance, mais elles ne constituent
pas une vérification automatique.

La configuration `settings.json` complète ce guidage en définissant les permissions de
l’agent, l’auto-approbation des commandes et les limites de la sandbox. Elle demande par
exemple de ne pas activer l’auto-approbation globale et bloque les écritures hors du
workspace. Cette configuration a été consultée pendant la séance ; chaque restriction
n’a pas été testée séparément.

Le mécanisme inférentiel de génération correspond à l’utilisation de Copilot dans VS
Code : l’agent interprète les consignes et le contexte du dépôt pour produire une analyse
ou une proposition conforme. Pendant cette séance, il a servi à établir l’inventaire et
à rédiger ce document ; aucun fichier de code n’a été généré ou modifié.

Le premier mécanisme computationnel de feedback est la commande `npm run check`, définie
dans `package.json`. Elle enchaîne le lint, la vérification TypeScript, les tests et le
build. Elle impose donc qu’une modification passe successivement ces quatre contrôles.
Cette commande a été exécutée pendant la séance et s’est terminée avec succès.

Le lint est réalisé par Oxlint, avec les règles de
`backend/.oxlintrc.json` et `frontend/.oxlintrc.json`. Il vérifie notamment l’interdiction
des `any` explicites, les comparaisons strictes et, côté frontend, les règles React Hooks.
Le lint a été exécuté via `npm run check` et n’a produit ni erreur ni avertissement.

La vérification TypeScript est configurée dans `backend/tsconfig.json` et les fichiers
TypeScript du frontend. Elle impose notamment `strict`, `noUncheckedIndexedAccess`,
`noUnusedLocals` et `noUnusedParameters`. Elle a été exécutée via `npm run check` et a
réussi.

Les tests Vitest constituent un autre senseur computationnel. Ils vérifient le
comportement du backend et du frontend ; les tests backend utilisent SQLite en mémoire.
La séance a produit le résultat suivant : 10 fichiers backend et 115 tests réussis, puis
8 fichiers frontend et 48 tests réussis, soit 163 tests réussis au total.

Enfin, le build TypeScript/Vite vérifie que les deux workspaces peuvent être compilés et
empaquetés. Il a été exécuté via `npm run check` et a réussi, avec la génération du
répertoire `dist` du frontend. Aucun test dans un navigateur et aucun workflow CI
GitHub Actions n’ont été exécutés ou identifiés dans le dépôt.

### Couverture des exigences

Les exigences EF-32 et EF-33 ont été découpées en cas précis à partir du cahier des
charges. Les statuts utilisés par l’API sont `IN_PROGRESS`, `SELECTED`, `REJECTED` et
`WITHDRAWN`; ils correspondent respectivement à « En cours », « Retenue », « Non
retenue » et « Retirée » dans l’interface.

| Exigence | Cas à vérifier et résultat attendu | Test existant (fichier et nom) | Assertions utiles | Couverture |
|---|---|---|---|---|
| EF-32 | Cas normal : un étudiant candidate à une offre publiée, avec un message facultatif. La candidature est créée et son statut est « En cours ». | `backend/tests/applications.test.ts` — `crée une candidature sur une offre publiée` | `response.status` vaut `201`; `response.body.offerId` correspond à l’offre; le message est nettoyé; `response.body.status` vaut `IN_PROGRESS`. | **Couvert** |
| EF-32 | Limite de saisie : le message est facultatif et peut être vide; un message trop long doit être refusé avec `400 INVALID_BODY`. | Aucun test identifié pour le message vide ou le dépassement de 2000 caractères. | Aucune assertion existante sur ces deux limites. | **Absent** |
| EF-32 | Refus : une offre non publiée ne doit pas accepter de candidature. Le résultat attendu est `409 OFFER_NOT_PUBLISHED`. | `backend/tests/applications.test.ts` — `refuse une offre non publiée et les doublons actifs` | `nonPublished.status` vaut `409`; `nonPublished.body.error.code` vaut `OFFER_NOT_PUBLISHED`. | **Couvert** |
| EF-32 | Refus : une candidature en cours ou retenue ne doit pas être créée une seconde fois pour la même offre. Le résultat attendu est `409 APPLICATION_EXISTS`. | `backend/tests/applications.test.ts` — `refuse une offre non publiée et les doublons actifs` | `duplicate.status` vaut `409`; `duplicate.body.error.code` vaut `APPLICATION_EXISTS`. | **Couvert** |
| EF-32 | Cas normal : l’étudiant peut retirer une candidature encore en cours. Le résultat attendu est `204` et la candidature devient « Retirée ». | `backend/tests/applications.test.ts` — `retire une candidature en cours et permet une nouvelle candidature` | `withdrawn.status` vaut `204`. | **Partiel** : le statut `WITHDRAWN` n’est pas relu et vérifié après le retrait. |
| EF-32 | Limite : une candidature traitée ne peut plus être retirée. Le résultat attendu est `409 APPLICATION_PROCESSED`. | `backend/tests/applications.test.ts` — `refuse le retrait d'une candidature traitée` | `response.status` vaut `409`; `response.body.error.code` vaut `APPLICATION_PROCESSED`. | **Couvert** |
| EF-32 | Limite : après un retrait, l’étudiant doit pouvoir candidater à nouveau à la même offre. | `backend/tests/applications.test.ts` — `retire une candidature en cours et permet une nouvelle candidature` | La nouvelle requête renvoie `replacement.status` égal à `201`. | **Couvert** |
| EF-32 | Limite d’accès : un utilisateur non étudiant ne peut pas candidater ni retirer une candidature. Le résultat attendu est `403 FORBIDDEN`. | Aucun test complet identifié pour les deux routes; le test existant porte sur `GET /applications`. | Aucune assertion spécifique sur `POST /applications` ou `DELETE /applications/:id` avec un administrateur. | **Absent** |
| EF-33 | Cas normal : un étudiant consulte ses candidatures avec les informations de l’offre et leur statut. | `backend/tests/applications.test.ts` — `liste uniquement les candidatures de l'étudiant connecté` | `response.status` vaut `200`; la réponse contient une seule candidature; son `id`, son `offerId` et son statut `IN_PROGRESS` sont vérifiés. | **Couvert** |
| EF-33 | Limite d’isolement : un étudiant ne doit pas voir les candidatures d’un autre étudiant. | `backend/tests/applications.test.ts` — `liste uniquement les candidatures de l'étudiant connecté` | `response.body` a une longueur de `1` et contient uniquement `APPLICATION.LUCAS_FLEET_APP`; l’identité de l’étudiant connecté est donc effectivement contrôlée. | **Couvert** |
| EF-33 | Résultats attendus pour les statuts « Retenue », « Non retenue » et « Retirée ». Ces statuts doivent être visibles dans la liste. | `frontend/tests/ApplicationsPage.test.tsx` — `affiche les statuts français et permet le retrait` | `En cours` et `Non retenue` sont recherchés dans le DOM. Aucun cas `Retenue` ou `Retirée` n’est fourni dans les données du test. | **Partiel** |
| EF-33 | Limite d’accès : un administrateur ou un autre profil ne doit pas consulter la liste réservée à l’étudiant. Le résultat attendu est `403 FORBIDDEN`. | `backend/tests/applications.test.ts` — `réserve les candidatures aux étudiants` | Avec un jeton administrateur, `response.status` vaut `403`. | **Couvert** |

Les tests suivants concernent les candidatures mais ne sont pas rattachés directement à
EF-32 ou EF-33. Dans `frontend/tests/ApplicationsPage.test.tsx`, le même test vérifie
que le bouton « Retirer » déclenche un appel `DELETE` vers `/api/applications/1` ; il
contrôle le comportement de l’interface et de son service, mais pas à lui seul le statut
HTTP ni la persistance backend. Les tests de `backend/tests/applications.test.ts` qui
utilisent SQLite en mémoire vérifient également le contexte technique d’exécution, mais
ce choix de base de test n’est pas une exigence fonctionnelle du cahier des charges.

En dehors d’EF-32 et EF-33, aucun test de sélection d’un candidat par l’administrateur,
de passage de l’offre au statut `ATTRIBUTED` ou de transformation des autres candidatures
en `REJECTED` n’a été rattaché à ces exigences : ces comportements relèvent d’EF-34 et de
RG-04.

#### Mise à jour après ajout des tests

La première analyse avait bien mis en évidence des tests absents ou partiellement
couverts : le message vide et le message trop long n’étaient pas vérifiés, le retrait ne
relisait pas le statut `WITHDRAWN`, les droits POST/DELETE des administrateurs n’étaient
pas testés, et les statuts frontend « Retenue » et « Retirée » n’étaient pas affichés dans
les données de test. Ces lacunes ont été corrigées avec les outils déjà utilisés dans le
projet, sans ajouter de test end-to-end.

| Exigence | Cas vérifié après amélioration | Test et assertions ajoutés ou complétés | Couverture après amélioration |
|---|---|---|---|
| EF-32 | Message facultatif vide ou composé d’espaces. | `backend/tests/applications.test.ts` — `accepte un message vide et refuse un message trop long` vérifie le statut `201` et `body.message === null`. | **Couvert** |
| EF-32 | Message dépassant 2000 caractères. | Le même test vérifie le statut `400` et le code `INVALID_BODY` pour `2001` caractères. | **Couvert** |
| EF-32 | Retrait d’une candidature en cours et changement effectif de statut. | `backend/tests/applications.test.ts` — `retire une candidature en cours et permet une nouvelle candidature` relit `GET /applications` et vérifie l’identifiant avec le statut `WITHDRAWN`. | **Couvert** |
| EF-32 | Création et retrait interdits à un administrateur. | `backend/tests/applications.test.ts` — `refuse la création et le retrait par un administrateur` vérifie `403 FORBIDDEN` sur `POST /applications` et `DELETE /applications/:id`. | **Couvert** |
| EF-33 | Affichage des quatre statuts dans l’interface. | `frontend/tests/ApplicationsPage.test.tsx` — `affiche les statuts français et permet le retrait` fournit désormais des candidatures `IN_PROGRESS`, `REJECTED`, `SELECTED` et `WITHDRAWN`, puis vérifie « En cours », « Non retenue », « Retenue » et « Retirée ». | **Couvert** |


### Modifications et vérification
