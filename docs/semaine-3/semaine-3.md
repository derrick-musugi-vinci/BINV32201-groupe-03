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

#### Modifications et vérification

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

Les commandes lancées et leurs résultats sont les suivants :

- `npm run test -w backend -- tests/applications.test.ts` : réussi, avec 1 fichier et
  8 tests validés ;
- `npm run test -w frontend -- tests/ApplicationsPage.test.tsx` : réussi, avec 1 fichier
  et 1 test validé ;
- `npm run check` : réussi après correction, avec lint backend et frontend sans erreur ni
  avertissement, vérification TypeScript réussie, 10 fichiers backend et 117 tests
  réussis, 8 fichiers frontend et 48 tests réussis, puis compilation backend et build
  Vite frontend réussis ;
- `git diff --check -- docs/semaine-3/semaine-3.md` : réussi, sans erreur de whitespace.

Les vérifications manuelles ont porté sur la relecture du cahier des charges, notamment
EF-32, EF-33 et RG-03, l’examen des tests backend/frontend, la comparaison des routes
avec `backend/API.md`, ainsi que la lecture des guides et du code concernés. Elles ont
confirmé le flux `middleware -> contrôleur -> service -> repository`, la validation des
JSON par type guards, les statuts REST des candidatures, la séparation frontend/backend,
le traitement des réponses `401`, les quatre statuts de candidature dans l’interface et
les options TypeScript strictes.

Les limites sont les suivantes : aucun test end-to-end, test dans un navigateur, audit
d’accessibilité avec un outil spécialisé, test de performance, test HTTPS/TLS ou test de
déploiement n’a été réalisé. L’authentification observée reste le mode démo local ; le
lien de connexion à usage unique, l’expiration et la révocation de session en production
restent donc non vérifiés. La comparaison avec les supports PDF s’appuie sur les
passages consultables fournis pour la séance et ne constitue pas une certification
exhaustive de chaque diapositive.


#### Audit des guides

Les supports les plus directement applicables au dépôt sont : `2 - typescript.pdf` pour
le typage et la compilation ; `3 - middleware.pdf` pour la chaîne de traitement HTTP ;
`4 - REST.pdf` pour les routes, méthodes et statuts ; `5 - serialisation.pdf` pour les
échanges JSON ; `6 - client_serveur.pdf` pour la séparation frontend/backend ;
`7 - web_statique.pdf` pour la structure HTML et l’accessibilité ; `8 - react_vite.pdf`
pour les composants et le démarrage frontend ; `12 - forms.pdf` pour les formulaires et
la validation ; `14 - Router.pdf` pour le routage ; `16 - fetch-promesses-useeffect.pdf`
et `17 - time_async_await.pdf` pour les appels asynchrones ; `19 - jwt.pdf` et
`22 - session.pdf` pour l’authentification et la session ; `20 - encryption.pdf` pour
la protection des secrets et des échanges.

Les supports `1 - intro.pdf`, `9 - modules_collections.pdf`, `11 - events_state.pdf`,
`13 - État partagé Fichier.pdf`, `15 - Etat-par-contexte.pdf` et `18 - slides-export.pdf`
restent utiles pour le cours, mais leurs attentes ne constituent pas les écarts
prioritaires observés dans les parcours actuellement implémentés. Les supports
`20 - encryption.pdf` n’est pas utilisé comme référence d’une fonctionnalité de
chiffrement déjà implémentée dans Gesta ; il sert toutefois de référence pour l’écart
de sécurité relevé ci-dessous.

La matrice suivante relie chaque attente à un passage thématique du support Web 2 et à
un passage explicite du guide du dépôt. Les indications « Oui », « Partielle » et
« Non vérifiée » décrivent le code observé, pas seulement la présence d’une phrase dans
le guide.

| Attente ou convention de Web 2 (source) | Guide examiné (fichier et passage) | Correspondance | Écart ou ajout proposé |
|---|---|---|---|
| TypeScript : typer les données et laisser le compilateur détecter les incohérences (`2 - typescript.pdf`, partie sur les types et la compilation). | `.github/copilot-instructions.md`, partie « Backend et base de données » : `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters`. | **Oui** : `backend/tsconfig.json` active effectivement ces options et `npm run check` exécute le typecheck. | Préciser aussi dans le guide que les frontières JSON doivent utiliser des `unknown` et des type guards plutôt que des assertions non vérifiées. |
| Middleware : une requête traverse une chaîne ordonnée de fonctions avant le contrôleur (`3 - middleware.pdf`, passage sur `req`, `res`, `next`). | `.github/copilot-instructions.md`, architecture : `main.ts -> app.ts -> middlewares -> controllers...`. | **Oui** : `app.ts` installe `express.json()`, `authenticate`, `notFoundHandler` puis `errorHandler`. | Ajouter l’ordre obligatoire et rappeler qu’un middleware doit appeler `next()` ou produire une réponse/erreur, jamais les deux. |
| REST : employer les méthodes et statuts adaptés (`4 - REST.pdf`, passages sur ressources, GET/POST/DELETE et codes HTTP). | `.github/copilot-instructions.md`, API : conservation des statuts/codes documentés dans `backend/API.md`. | **Oui** : les candidatures utilisent `GET`, `POST`, `DELETE`, avec `200`, `201`, `204`, `400`, `403`, `404` et `409`. | Ajouter une règle de cohérence : documenter pour chaque route le corps, le statut de succès et chaque erreur attendue, puis maintenir le fichier `.http` correspondant. |
| Sérialisation : les données échangées doivent être converties en JSON avec une forme de contrat stable (`5 - serialisation.pdf`, passage sur JSON et représentation des données). | `.github/copilot-instructions.md`, mappers : DBO -> métier -> DTO et réponses API validées par type guards. | **Oui** : `toApplicationDto`, `readJson` et `isApplicationList` séparent et valident les représentations. | Ajouter dans le guide que les dates, statuts et valeurs nulles doivent avoir un format documenté, et qu’un DTO ne doit pas exposer directement un DBO. |
| Client/serveur : séparer responsabilités et contrats entre le navigateur et l’API (`6 - client_serveur.pdf`, passage sur requête/réponse et séparation des rôles). | `.github/copilot-instructions.md`, architecture frontend/backend et proxy `/api`. | **Oui** : les services frontend appellent l’API, les contrôleurs/services backend portent la validation et les règles métier. | Préciser que le frontend ne doit jamais être considéré comme une autorité de sécurité et que toute règle visible dans l’interface doit être répétée côté serveur. |
| HTML statique accessible : structure sémantique, intitulés et navigation compréhensible (`7 - web_statique.pdf`, passage sur HTML sémantique et accessibilité). | `.github/copilot-instructions.md`, frontend : composants React réutilisables et textes utilisateur en français. | **Partielle** : `NavBar` possède `aria-label="Navigation principale"`, les champs ont des labels et les actions sont des boutons. Les tableaux n’explicitent toutefois pas `scope` sur leurs en-têtes et l’accessibilité n’est pas une convention écrite. | Ajouter au guide une règle d’accessibilité : HTML sémantique, association label/champ, focus visible, messages d’erreur lisibles et tests des rôles accessibles avec Testing Library. |
| React/Vite : composants déclaratifs, état local et rendu par composition (`8 - react_vite.pdf`, passages sur composants et démarrage Vite). | `.github/copilot-instructions.md`, flux `pages -> hooks -> services/utils -> models -> components`. | **Oui** : `App.tsx`, pages, hooks et composants suivent ce découpage ; le build Vite réussit. | Décrire la règle de ne pas faire d’appel réseau directement dans un composant réutilisable et de centraliser les effets dans les hooks/services. |
| Formulaires : contrôler les entrées, afficher les erreurs et ne pas faire confiance aux valeurs du navigateur (`12 - forms.pdf`, passages sur événements et validation). | `.github/copilot-instructions.md`, contrôleurs : validation des paramètres ; frontend : type guards et erreurs API. | **Partielle** : le backend valide `offerId`, `message` et les longueurs ; le frontend transmet le formulaire et affiche les erreurs via les hooks, mais aucune convention générale de validation/accessibilité des formulaires n’est écrite. | Ajouter des règles sur validation au départ et à la soumission, messages associés au champ, trim/limites identiques frontend-backend et tests des cas invalides. |
| Routage : déclarer les routes, les paramètres et le fallback de manière explicite (`14 - Router.pdf`, passages sur routes et route inconnue). | `.github/copilot-instructions.md`, frontend : React Router ; backend : routes assemblées dans `app.ts`. | **Oui** : `App.tsx` déclare les routes et `*` mène à `NotFoundPage`; le backend possède `notFoundHandler`. | Documenter la règle de ne pas confondre masquage d’une route et autorisation, déjà mentionnée pour les droits backend, et ajouter un test de route inconnue si le contrat doit être garanti. |
| Fetch/promesses/effects : gérer chargement, erreur, annulation et dépendances (`16 - fetch-promesses-useeffect.pdf`, passage sur `fetch`, promesses et `useEffect`; `17 - time_async_await.pdf`, passage sur `async/await`). | `.github/copilot-instructions.md`, hooks : état prêt à afficher, `onUnauthorized`, tests frontend simulant le réseau. | **Partielle** : `useApplications` et les autres hooks gèrent chargement/erreur et les `401`; `getApplications` accepte un `AbortSignal`, mais `useApplications` ne l’utilise pas pour annuler son effet. | Ajouter une convention d’annulation des requêtes lors du démontage/changement de paramètres et tester le chargement, l’erreur, le `401` et l’absence de mise à jour après annulation. |
| JWT : un jeton signé ne remplace pas la vérification de l’identité et des droits (`19 - jwt.pdf`, passages sur signature, contenu et vérification). | `.github/copilot-instructions.md`, authentification : jeton limité à `kind`/`id`, identité et rôles relus en base à chaque requête. | **Oui** : `authenticate` délègue au service d’authentification et les routes protégées passent par ce middleware ; le mode démo est interdit en production. | Préciser les exigences de secret, expiration, rotation/révocation et absence de données sensibles dans le payload si l’authentification réelle remplace le mode démo. |
| Chiffrement et protection des secrets : distinguer signature, chiffrement et protection du transport ; ne pas exposer les clés (`20 - encryption.pdf`, passages sur confidentialité, clés et HTTPS). | `.github/copilot-instructions.md`, configuration : `.env`, `JWT_SECRET`, mode démo interdit en production ; `settings.json`, secrets Git/GitHub non transmis aux processus sandboxés. | **Partielle** : la longueur minimale du secret JWT est contrôlée et les identifiants ne sont pas committés ; le dépôt ne définit pas dans le guide une exigence HTTPS/TLS ni une politique de gestion/rotation des clés. | Ajouter une checklist production : HTTPS obligatoire, secret hors dépôt et hors logs, rotation/révocation, chiffrement des sauvegardes et distinction claire entre hash, chiffrement et signature. |
| Session : distinguer l’identification, la durée de session, l’expiration et la déconnexion (`22 - session.pdf`, passages sur cycle de vie de session). | `.github/copilot-instructions.md`, frontend : une réponse `401` passe par `onUnauthorized` pour supprimer la session et revenir à la connexion. | **Partielle** : le frontend traite le `401` et le backend rejette une session invalide ; le projet utilise encore une authentification de démonstration et ne couvre pas le lien à usage unique décrit dans le cahier des charges. | Ajouter au guide un scénario de session expirée, une exigence de test de déconnexion et la distinction explicite entre mode démo local et authentification de production. |

#### Rapport synthétique

Le projet correspond bien aux attentes d’architecture du cours. Le découpage
`app.ts -> middlewares -> controllers -> services -> repositories -> SQLite`, le flux
frontend par pages/hooks/services et la séparation DTO/DBO sont à la fois décrits dans
`.github/copilot-instructions.md` et visibles dans le source. Les contrôles exécutables
confirment une partie importante de ces attentes : TypeScript strict, Oxlint, Vitest,
Supertest, Testing Library et build Vite passent avec `npm run check`.

Les validations d’entrées et les contrats REST sont également bien alignés pour les
candidatures. Le contrôleur valide la forme de la requête, le service applique les règles
métier, `HttpError` uniformise les erreurs et `backend/API.md` documente les statuts.
Les type guards protègent le frontend contre un JSON inattendu. Ces éléments devraient
toutefois être renforcés dans le guide par des exigences systématiques sur les formats
de dates, les valeurs nulles, les limites de longueur, les messages d’erreur associés
aux champs et la correspondance entre API et fichiers `.http`.

Les principales lacunes ne sont pas une contradiction avec les guides, mais des attentes
encore implicites ou incomplètement vérifiées. L’accessibilité est présente dans quelques
choix (`nav` nommé, labels, boutons) mais n’est pas formulée comme une règle ni couverte
par une vérification dédiée. La gestion asynchrone accepte l’annulation dans un service,
mais le hook ne transmet pas encore de signal d’annulation à son effet. Enfin, JWT et
session sont correctement encadrés pour le mode démo, mais le parcours de production
(lien à usage unique, expiration, invalidation) reste hors implémentation.

Il serait donc utile de préciser dans `.github/copilot-instructions.md` quatre attentes :
un contrat de validation et d’accessibilité des formulaires, une checklist REST/DTO
incluant les fichiers `.http`, une règle d’annulation et de test des effets asynchrones,
et une checklist de sécurité session/JWT pour le passage du mode démo à la production.
