# Directives d'Agent — Organizador & Mostrador (`o-girador-organizador`)

## 0. RÈGLE STRICTE DE NOMMAGE DES APPLICATIONS O GIRADOR
Utiliser exclusivement l'orthographe brésilienne pure (zéro apostrophe, zéro accent parasite, zéro majuscule interne avant `-or`, zéro francisation `ch`, cédille obligatoire sur **Dançador**) :
- **O Girador** | **Orquestrador** | **Organizador** | **Sequenciador** | **Cantador** | **Dançador** | **Mostrador** | **Afinador** *(en conception, réservé sous `enabled: false` — aucun lien actif dans les menus utilisateurs)*

## 1. Règle Anti-Monolithe (`< 145 Lignes` & Mode Cliquet)
- **Plafond strict `< 145 lignes` réelles** (`content.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length < 145`) pour tout nouveau fichier ou fichier déjà conforme dans `src/`.
- **Mode Cliquet Strict (Ratchet)** sur les fichiers legacy `>= 145` lignes (hors purs dictionnaires `src/locales/*`) : toute modification doit respecter `newLines <= oldLines`.
  1. **Étape A (Extraction chirurgicale)** : extraire d'abord la sous-brique concernée dans un sous-composant, custom hook ou utilitaire dédié `< 145` lignes (commenté en français).
  2. **Étape B (Modification ciblée)** : appliquer l'évolution dans ce module isolé.

## 2. Architecture Multi-Thèmes & Lexique Métier
- **Zéro style inline thématique** : reposer exclusivement sur les variables CSS sémantiques.
- **Commentaires 100 % en français**.
- **Lexique culturel** : Interdiction formelle du mot `Bateria` en contexte Maracatu ou générique (utiliser `Batuque` / `Baque` ou `terminology.instrumentGroup`). Interdiction du mot `IA` dans l'interface utilisateur (hors clauses légales TDM obligatoires).

## 3. Code Couleur Sémantique Cordel
- **Vert Validation (`#2d6a4f` / `--color-cordel-vert`)** : validations, confirmations, statut « Présent ».
- **Rouge Terre Cuite (`#8b2a1a` / `--color-cordel-rouge` / `--cordel-wood`)** : suppressions, refus, statut « Absent », actions destructives.
- **Ocre Ambré (`#c05621` / `--color-cordel-ocre`)** : attente, statut « À confirmer », avertissements neutres.

## 4. Gouvernance Pédagogique & Passerelle Sequenciador (Speed Trainer & Aisance)
- **Collection racine partagée `/trainings` (Lecture seule dans Organizador)** :
  * Les entraînements sont créés et configurés exclusivement depuis **Sequenciador**.
  * Dans **Organizador**, ils sont résolus via `resolvePieceTrainings(piece.sequenceurId, trainingsList)` où `t.presetId === piece.sequenceurId`, filtrés avec `where('groupId', '==', groupId.trim().toLowerCase())`.
- **Sous-collection d'Aisance `/users/${userId}/aisance`** :
  * Paliers Speed Trainer sous `${trainingId}` (`stagesCompleted: number[]`), Défi Réflexe sous `reflexes`, Conducteur à trous sous `conducteurs` (exclure systématiquement `reflexes` et `conducteurs` dans `subscribeUserAisance`).
- **Passerelle SSO (`launchTrainingStage`) & Composant `TrainingCompactCard.jsx`** :
  * Toujours transiter par `launchTrainingStage(presetId, trainingId, stageIndex, { baseUrl })` et retourner `null` si aucun entraînement n'est associé (Règle « Zéro Bloc Vide »).
- **Arbitrages Mestre** : respecter la priorité de `piece.signalOverrides` dans `reflexGameUtils.js` et `conductorGameUtils.js`.

---
### 🛡️ Gouvernance Centralisée des Règles Firebase & Sécurité (Strict)
- **Autorité unique :** Les règles `firestore.rules` et `storage.rules` sont exclusivement pilotées et déployées par **Orquestrador** (`o-girador-orquestrador`).
- **Interdiction formelle dans ce dépôt :** ne jamais créer, copier, modifier ou déployer de règles Firebase, et ne jamais lancer `firebase deploy --only functions` non qualifié.

---
## RÈGLE STRICTE DES PORTS LOCAUX (ÉCOSYSTÈME O GIRADOR)
- **Orquestrador** : `5170` | **Sequenciador** : `5174` | **Organizador** / **Mostrador** : `5175` | **Dançador** : `5176` | **Cantador** : `5177` | **Afinador** *(réservé, inactif)* : `5178`
- Interdiction de modifier le port local sans instruction explicite (`strictPort: true` obligatoire).
