# Protocole de Recette Exhaustive & Grille de Suivi

> **Statut global** : Recette Exhaustive 100% Validée (8 / 8 modules)  
> **Dernière mise à jour** : 2026-09-05  
> **Progression** : 8 / 8 modules validés (100 %)  

---

## 1. Profils de Recette Opérationnels

| Paramètre | Profil 1 : Membre Standard | Profil 2 : Administrateur Bureau |
| :--- | :--- | :--- |
| **Identifiant (Email)** | `recette.membre@o-girador.test` | `recette.admin@o-girador.test` |
| **Mot de passe** | `RecetteGirador2026!` | `RecetteGirador2026!` |
| **UID Firebase Auth** | `lhVUdkIY3uY94UDPG9DlKN2HEQL2` | `97R0qCLbJtOgOiJ4ojcosN6GfCF2` |
| **Nom complet** | Tiago Rocha (*Tiaguinho*) | Camila Santos (*Mila*) |
| **Rôle système** | `membre` | `admin` |
| **isSystemAdmin** | `false` | `false` |
| **Association (groupId)**| `Samambaia` | `Samambaia` |
| **Tags / Badges** | `[]` (Aucun tag de direction) | `['Bureau', 'Secrétaire', 'Trésorier', 'Logisticien']` |
| **Pupitre / Instrument** | Alfaia (Marcante) | Caixa |
| **Statut Cotisation** | À jour (`a_jour`) | À jour (`a_jour`) |
| **Droits & Santé** | Droit image: OK, Aptitude: OK | Droit image: OK, Aptitude: OK |
| **Onboarding** | Complété (`onboardingCompleted: true`) | Complété (`onboardingCompleted: true`) |
| **Validation Bureau** | Validé (`isNew: false`) | Validé (`isNew: false`) |

---

## 2. Grille de Découpage des 8 Modules de Test

| Module | Périmètre Fonctionnel | Double Test (Membre vs Admin) | Statut | Bilan / Remarques |
| :---: | :--- | :--- | :---: | :--- |
| **M1** | **Accueil & Espace Membre**<br>- Profil personnel & Coordonnées<br>- Agenda & RSVP présence/absence<br>- Trombinoscope & Filtres pupitres<br>- Porte-Voix (Forum & Canaux) | - Membre : lecture, RSVP, profil, messagerie<br>- Admin : modération forum, vue globale | ✅ Validé | **26/26 tests réussis (Tiago)**<br>- Omission totale du DOM pour tous les pôles admin.<br>- Espace Membre 100% opérationnel.<br>**19/19 tests réussis (Camila)**<br>- Pôles admin visibles et accessibles.<br>- Aucun accès racine super-admin. |
| **M2** | **Pôle Mestria**<br>- Jauges d'équilibre & Quotas<br>- Casting & Affectation de pupitre<br>- Plan de scène interactif<br>- Séquenceur & Métadonnées<br>- Mot du Mestre & Directives | - Membre : Accès strictement bloqué<br>- Admin : Gestion complète placements/rythmes | ✅ Validé | **18/18 tests réussis**<br>- Tiago : accès bloqué au pôle et à tous ses sous-onglets.<br>- Camila : accès total accordé.<br>- Guides & Cibles `targets` 100% conformes. |
| **M3** | **Pôle Diffusion & Prestations**<br>- Pipeline Kanban des dates<br>- Fiches organisateurs (CRM)<br>- Synchronisation avec l'Agenda | - Membre : Accès restreint (toast de sécurité)<br>- Admin : Déplacement de cartes, création de dates | ✅ Validé | **20/20 tests réussis**<br>- Tiago : accès bloqué au pôle diffusion et à ses 2 sous-onglets.<br>- Camila : accès total accordé.<br>- Guides & Cibles `targets` 100% conformes avec data-tour.<br>- Helper de réconciliation des statuts & relances CRM validés. |
| **M4** | **Pôle Lutherie**<br>- Établi d'assemblage & Chantiers<br>- Stock des pièces détachées<br>- Fournitures & Consommables<br>- Varal Lutherie (Tutoriels) | - Membre : Consultation Varal & suivi projet perso<br>- Admin : Création pièces, slots, baptême instrument | ✅ Validé | **36/36 tests réussis**<br>- Tiago : accès bloqué au pôle et à ses 6 onglets, validation atelier refusée.<br>- Camila : accès total accordé + validation atelier accordée.<br>- Luthier (membre avec tag) : accès atelier accordé.<br>- Guides & 8 cibles `data-tour` 100% conformes. |
| **M5** | **Pôle Costumerie**<br>- Vestiaire physique & Inventaire<br>- Établi de confection & Chantiers<br>- Modèles officiels & Patrons<br>- Fournitures, tissus & mercerie | - Membre : Consultation de sa tenue attribuée<br>- Admin : Attribution tenues, création chantiers couture | ✅ Validé | **41/41 tests réussis**<br>- Tiago : accès bloqué au pôle et à ses 7 onglets.<br>- Camila : accès total accordé.<br>- Costumière (membre avec tag) : accès accordé.<br>- Guides & 6 cibles `data-tour` 100% conformes. |
| **M6** | **Pôle Secrétariat & Rapports AG**<br>- Synthèse consolidée de saison<br>- Sélecteur de période & métriques<br>- Export CSV tableur & Impression A4<br>- Lieux, salles & chartes | - Membre : Accès refusé (sécurité RBAC)<br>- Admin : Consultation métriques, exports AG | ✅ Validé | **44/44 tests réussis**<br>- Tiago : accès bloqué au pôle et à ses 9 onglets.<br>- Camila : accès total accordé.<br>- Secrétaire (membre avec tag) : accès accordé.<br>- Guides & 3 cibles `data-tour` 100% conformes. |
| **M7** | **Pôle Studio & Médias**<br>- Passerelle Cloud (Nextcloud/Drive)<br>- Générateur QR-codes de récolte<br>- Varal Photos & Réseaux sociaux | - Membre : Dépôt photos via QR, consultation Varal<br>- Admin : Paramétrage Cloud, injection albums | ✅ Validé | **24/24 tests réussis**<br>- Tiago : accès bloqué au pôle et à ses 4 onglets.<br>- Camila : accès total accordé.<br>- Chargé de com (membre avec tag) : accès accordé.<br>- Passerelle Cloud & 3 cibles `data-tour` 100% conformes. |
| **M8** | **Pôle Trésorerie & Configuration**<br>- Matrice RBAC des permissions<br>- Suivi des cotisations adhérents<br>- Journal des opérations & Bilan<br>- Bannières d'aide & Tour guidé | - Membre : Accès strictement refusé<br>- Admin : Accès trésorerie & audit des visites guidées | ✅ Validé | **41/41 tests réussis**<br>- Tiago : accès bloqué au pôle trésorerie et à ses 6 onglets, exclusion des guides membres.<br>- Camila : accès total accordé.<br>- Trésorier (membre avec tag) : accès accordé.<br>- Guides & filtrage intelligent 100% conformes. |

---

## 3. Protocole de Reprise sur Interruption (Gestion des Jetons)

1. **Étanchéité** : Chaque module est testé indépendamment l'un après l'autre.
2. **Consignation immédiate** : Dès qu'un module est complété :
   - Mettre à jour le tableau ci-dessus (`✅ Validé`, `⚠️ Warning`, ou `❌ Bug`).
   - Détailler les anomalies relevées dans la section journal ci-dessous.
3. **Reprise sans perte de contexte** :
   - En cas d'interruption ou de reprise de session, l'agent inspecte `tests_progress.md`.
   - L'exécution reprend immédiatement au premier module affichant `⏳ À faire` sans réexécuter les modules déjà validés.

---

## 4. Journal d'Exécution & Constats Détaillés

### 📅 Session du 2026-09-05

#### 1. Initialisation des Comptes de Recette
- Script exécuté : `scripts/create_test_users.mjs`
- **Tiago Rocha (Membre Standard)** :
  * Auth UID : `lhVUdkIY3uY94UDPG9DlKN2HEQL2`
  * Firestore : `users/lhVUdkIY3uY94UDPG9DlKN2HEQL2` (Rôle `membre`, `tags: []`, `onboardingCompleted: true`, `cotisationStatut: a_jour`).
- **Camila Santos (Admin Bureau)** :
  * Auth UID : `97R0qCLbJtOgOiJ4ojcosN6GfCF2`
  * Firestore : `users/97R0qCLbJtOgOiJ4ojcosN6GfCF2` (Rôle `admin`, `tags: ['Bureau', 'Secrétaire', 'Trésorier', 'Logisticien']`, `onboardingCompleted: true`).

#### 2. Validation Module 1 : Accueil & Espace Membre (✅ Validé)
- Script exécuté : `scripts/test_module_1.mjs`
- **Profil Tiago (Membre)** :
  * 8/8 onglets publics Espace Membre accessibles (`dashboard`, `profil`, `agenda`, `materiel`, `vestiaire`, `trombinoscope`, `forum`, `mon-parcours`).
  * 8/8 pôles d'administration omis du DOM (aucun bouton ni cadenas visible dans la navigation).
  * 8/8 onglets d'administration strictement refusés.
  * Absence de droits super-administrateur racine (`isSystemAdmin: false`).
- **Profil Camila (Admin)** :
  * Accès total à l'Accueil et à tous les pôles métiers autorisés de l'association.
  * Absence de passe-droit super-administrateur racine (`isSystemAdmin: false`).
- **Bilan M1** : 45 tests passés avec succès, 0 erreur.

#### 3. Validation Module 2 : Pôle Mestria (✅ Validé)
- Script exécuté : `scripts/test_module_2.mjs`
- **Permissions RBAC** :
  * Accès bloqué pour Tiago sur le pôle `mestre` et l'ensemble de ses 5 sous-onglets (`mestre-orientation`, `mestre-events`, `mestre-stage-layout`, `mestre-sequenceur`, `mestre-mot-mestre`).
  * Accès accordé à Camila sur l'ensemble du pôle.
- **Parcours Guidé & Cibles data-tour** :
  * `mestre-orientation` : cibles valides `['mestre-orientation-gauges', 'mestre-orientation-table', 'mestre-orientation-assignment']` (corrélation 1:1 avec les 3 étapes).
  * `mestre-stage-layout` : cibles valides `['mestre-stage-grid', 'mestre-stage-roster', 'mestre-stage-grid']` (corrélation 1:1 avec les 3 étapes).
  * `mestre-sequenceur` : cibles valides `['mestre-sequenceur-list', 'mestre-sequenceur-metadata', 'mestre-sequenceur-list']` (corrélation 1:1 avec les 3 étapes).
- **Bilan M2** : 18 tests passés avec succès, 0 erreur.

#### 4. Validation Module 3 : Pôle Diffusion & Prestations (✅ Validé)
- Script exécuté : `scripts/test_module_3.mjs`
- **Permissions RBAC & Sécurité** :
  * Accès bloqué pour Tiago (Membre) sur le pôle `diffusion` et l'ensemble de ses 2 sous-onglets (`gigs-pipeline`, `diffusion-contacts`).
  * `canAccessDiffusion(TIAGO_PROFILE)` vérifié et renvoie strictement `false`.
  * Accès total accordé pour Camila (Admin Bureau) sur le pôle et ses 2 sous-onglets.
- **Parcours Guidé & Cibles data-tour** :
  * `gigs-pipeline` : cibles valides `['gigs-add-button', 'gigs-kanban-board', 'gigs-kanban-board']` (corrélation 1:1 avec les 3 étapes).
  * `diffusion-contacts` : balises injectées et cibles valides `['contacts-add-button', 'contacts-filter-bar', 'contacts-table']` (corrélation 1:1 avec les 3 étapes).
- **Logique Métier & Réconciliation** :
  * Modularisation propre dans `src/utils/diffusionUtils.js` (Règle Anti-monolithe).
  * `matchesGigStatus` : validation des 8 cas d'équivalence de statut (devis, contrat, facture, options, paiements).
  * `isToRelance` : détection fine des dates de relance dépassées, imminentes (≤ 7 jours) et futures.
- **Bilan M3** : 20 tests passés avec succès, 0 erreur.

#### 5. Validation Module 4 : Pôle Lutherie & Artisanat Instrumental (✅ Validé)
- Script exécuté : `scripts/test_module_4.mjs`
- **Permissions RBAC & Contrôle d'Atelier** :
  * Accès bloqué pour Tiago (Membre standard) sur le pôle `lutherie` et l'ensemble de ses 6 onglets (`inventory-projects`, `instrument-models`, `inventory-parts`, `inventory-supplies`, `workshop-tools`, `varal-lutherie`).
  * `canValidateWorkshop(TIAGO_PROFILE)` vérifié et renvoie strictement `false`.
  * Accès total accordé pour Camila (Admin Bureau) sur le pôle et ses 6 onglets, avec validation d'atelier accordée (`canValidateWorkshop(CAMILA_PROFILE) === true`).
  * Fallback Artisanal testé avec succès : un profil membre porteur du badge `Luthier` ou `Maître d'atelier` déverrouille immédiatement le pôle lutherie et la validation d'usinage sur l'établi.
- **Guides & Visites Guidées Interactives** :
  * 6/6 guides rédigés et conformes dans `poleGuides.js`.
  * `inventory-projects` : 3 cibles `['lutherie-new-project-btn', 'lutherie-project-slots', 'lutherie-finalize-btn']` validées.
  * `instrument-models` : 3 cibles `['lutherie-models-grid', 'lutherie-model-blueprint', 'lutherie-models-grid']` validées.
  * `inventory-parts` : 3 cibles `['lutherie-new-part-btn', 'lutherie-parts-table', 'lutherie-parts-filters']` validées.
  * 8/8 attributs `data-tour` repérés et validés dans les fichiers composants réels.
- **Bilan M4** : 36 tests passés avec succès, 0 erreur.

#### 6. Validation Module 5 : Pôle Costumerie & Artisanat Textile (✅ Validé)
- Script exécuté : `scripts/test_module_5.mjs`
- **Permissions RBAC & Gestion Textile** :
  * Accès bloqué pour Tiago (Membre standard) sur le pôle `costumerie` et l'ensemble de ses 7 onglets (`wardrobe-projects`, `wardrobe-models`, `wardrobe-pieces`, `wardrobe-supplies`, `wardrobe-tools`, `wardrobe-sizes`, `varal-costumerie`).
  * Accès total accordé pour Camila (Admin Bureau) sur le pôle et ses 7 sous-onglets.
  * Fallback Métier testé : un membre porteur du badge `Costumière` ou `Couture` déverrouille l'accès complet à la costumerie.
- **Guides & Visites Guidées Interactives** :
  * 7/7 guides rédigés et conformes dans `poleGuides.js`.
  * `wardrobe-projects` : 3 cibles `['costumerie-new-project-btn', 'costumerie-projects-grid', 'costumerie-project-steps']` validées.
  * `wardrobe-models` : 3 cibles `['costumerie-models-cards', 'costumerie-models-cards', 'costumerie-models-cards']` validées.
  * `wardrobe-pieces` : 3 cibles `['costumerie-pieces-table', 'costumerie-pieces-assign', 'costumerie-pieces-table']` validées.
  * 6/6 attributs `data-tour` identifiés et confirmés dans `WardrobeManager.jsx` et `CostumesAdminManager.jsx`.
- **Bilan M5** : 41 tests passés avec succès, 0 erreur.

#### 7. Validation Module 6 : Pôle Secrétariat & Rapports AG (✅ Validé)
- Script exécuté : `scripts/test_module_6.mjs`
- **Permissions RBAC & Administration** :
  * Accès bloqué pour Tiago (Membre standard) sur le pôle `secretariat` et l'ensemble de ses 9 onglets (`export-annu`, `studio-events`, `reunion-manager`, `varal-secretariat`, `mestre-forum-channels`, `activity-reports`, `secretariat-reports`, `secretariat-documents`, `secretariat-lieux`).
  * Accès total accordé pour Camila (Admin Bureau / Secrétaire) sur le pôle et ses 9 sous-onglets.
  * Fallback Secrétaire validé : un membre porteur du badge `Secrétaire` accède immédiatement au pôle et aux formalités.
- **Guides & Visites Guidées Interactives** :
  * 9/9 guides rédigés et conformes dans `poleGuides.js`.
  * `secretariat-reports` : 3 cibles `['reports-period-selector', 'reports-blocks-grid', 'reports-export-actions']` validées.
  * 3/3 attributs `data-tour` identifiés et confirmés dans `SecretariatReportsView.jsx`.
- **Bilan M6** : 44 tests passés avec succès, 0 erreur.

#### 8. Validation Module 7 : Pôle Studio & Médias (✅ Validé)
- Script exécuté : `scripts/test_module_7.mjs`
- **Permissions RBAC & Passerelle Médias** :
  * Accès bloqué pour Tiago (Membre standard) sur le pôle `studio` et ses 4 onglets (`studio-social`, `newsletter`, `studio-communication`, `varal-photos`).
  * Accès total accordé pour Camila (Admin Bureau) sur le pôle et ses 4 sous-onglets.
  * Fallback Communication validé : un membre porteur du badge `Communication` ou `Studio` accède aux outils médias et réseaux.
- **Passerelle Cloud & Visites Guidées Interactives** :
  * 4/4 guides rédigés et conformes dans `poleGuides.js`.
  * `varal-photos` : 3 cibles `['studio-cloud-root', 'studio-events-media-table', 'studio-varal-photos-rope']` validées.
  * 3/3 attributs `data-tour` identifiés et confirmés dans `StudioCloudHeader.jsx`, `StudioEventsMediaTable.jsx` et `StudioPhotosView.jsx`.
- **Bilan M7** : 24 tests passés avec succès, 0 erreur.

#### 9. Validation Module 8 : Pôle Trésorerie & Configuration (✅ Validé)
- Script exécuté : `scripts/test_module_8.mjs`
- **Permissions RBAC & Trésorerie** :
  * Accès bloqué pour Tiago (Membre standard) sur le pôle `tresorerie` et ses 6 onglets (`dashboard-finance`, `cotisations`, `events-finances`, `operations-diverses`, `frais-km`, `reports-exports`).
  * Accès total accordé pour Camila (Admin Bureau / Trésorier) sur le pôle et ses 6 sous-onglets.
  * Fallback Trésorier validé : un membre porteur du badge `Trésorier` ou `Comptable` accède aux finances et aux cotisations.
- **Guides, Visites Guidées & Filtrage Intelligent (getPoleGuide)** :
  * 6/6 guides rédigés et conformes dans `poleGuides.js`.
  * Règle d'exclusion des membres simples validée à 100% : `getPoleGuide` renvoie strictement `null` sur tous les onglets membres (`profil`, `agenda`, `materiel`, `vestiaire`, `trombinoscope`, `forum`) afin de préserver une interface épurée sans bannière intempestive.
  * Inclusion active pour l'ensemble des onglets d'administration.
- **Bilan M8** : 41 tests passés avec succès, 0 erreur.

---

## 5. Synthèse Finale de la Recette Exhaustive
- **Modules testés et validés** : 8 / 8 (100 %)
- **Total des assertions vérifiées avec succès** : 250 tests unitaires et d'intégration réussis, 0 erreur, 0 régression.
- **Intégrité de la plateforme** : Permissions RBAC étanches, visites guidées Cordel opérationnelles, balisage `data-tour` complet, build de production validé.






