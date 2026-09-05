# 📜 Guide des Pôles et Métiers Associatifs — Référentiel du Conseil d'Administration

> **Document de référence à destination des membres du Conseil d'Administration (CA)**  
> **Application :** O-Girador Manager  
> **Objectif :** Cartographie exhaustive des fonctionnalités, répartition des périmètres d'action entre administrateurs et attribution des badges d'accès.

---

## 🎯 Préambule & Mode d'Emploi pour le CA

Bienvenue dans le guide opérationnel de **O-Girador Manager**.  
Ce document a été généré par audit direct et dynamique du code source de l'application afin de présenter l'intégralité des fonctionnalités disponibles sans aucune omission.

### 🔑 Comment fonctionne la sécurité et l'accès aux écrans ?
L'application repose sur un système de contrôle d'accès fondé sur les rôles et les étiquettes (**RBAC - Role-Based Access Control**) :
1. **Socle Adhérent Universel :** Tout membre actif a accès à son espace personnel sans badge requis.
2. **Rôles Système Globaux :**
   - `isSystemAdmin === true` / `super-admin` : Accès technique total sans restriction.
   - `admin` : Administration générale de l'association.
   - `mestre` : Direction artistique et pédagogique plénière.
3. **Matrice de Permissions Personnalisable :** Configurable dans le pôle **Configuration > Badges & Permissions**, elle permet d'attribuer précisément chaque pôle ou chaque onglet à un ou plusieurs badges métier (ex : *Trésorier*, *Costumière*, *Régisseur*, *Chargé de diffusion*).
4. **Mots-clés de Secours Automatiques :** Si la matrice n'est pas encore personnalisée, le système autorise automatiquement les membres dont les badges contiennent des mots-clés sémantiques reconnus (ex: `"trésorier"` déverrouille le Pôle Trésorerie, `"couture"` déverrouille la Costumerie).
5. **Principe de protection des données :** Chaque administrateur ne voit dans son menu que les pôles et onglets correspondant à sa lettre de mission et aux badges attribués à son profil.

---

### 🎨 Code Couleur Sémantique Cordel
L'application applique une convention visuelle stricte sur l'ensemble de ses écrans :
- **Vert Validation (`#2d6a4f` / `--color-cordel-vert`) :** Utilisé pour les validations, approbations, boutons de confirmation, enregistrements réussis et le statut **« Présent »** aux convocations.
- **Rouge Terre Cuite (`#8b2a1a` / `--color-cordel-rouge` / `--cordel-wood`) :** Réservé aux actions destructives, suppressions, désactivations, alertes critiques et au statut **« Absent »**.
- **Ocre Ambré (`#c05621` / `--color-cordel-ocre`) :** Réservé aux statuts intermédiaires, dossiers en attente, avertissements neutres et au statut **« À confirmer »**.

---

## 👥 Socle Commun de tous les Membres (Espace Personnel)

> **Pôle parent :** `mon-espace` (id: `mon-espace`)  
> **Vocation :** Espace personnel et quotidien mis à disposition de chaque adhérent pour vivre la saison associative, suivre sa pratique, gérer ses affaires et communiquer avec la troupe.  
> **Badge requis :** **Aucun badge d'administration requis.** Accessible d'office à tout adhérent validé de l'association.

---

### 🔹 Onglet : Profil (id: `profil`)
- **À quoi ça sert :** Permet à chaque adhérent de tenir à jour ses informations de contact, sa fiche d'urgence, ses mensurations physiques pour les costumes et ses vœux musicaux.
- **Ce qu'on y fait :**
  - Mettre à jour son téléphone, email, adresse postale et personne à contacter en cas d'accident.
  - Saisir ses mensurations corporelles (tour de poitrine, taille, hanches, stature) pour l'ajustement des costumes.
  - Indiquer son instrument principal, son pupitre secondaire et ses souhaits d'évolution pour la saison.
- **Badge nécessaire :** Aucun (Espace personnel).
- **Engagement estimé :** Ponctuel (à l'adhésion en début de saison, puis mise à jour en cas de changement).

---

### 🔹 Onglet : Mon Parcours (id: `mon-parcours`)
- **À quoi ça sert :** Tableau de bord d'auto-apprentissage individuel où l'adhérent consulte son historique de quiz, ses validations de rythmes et son niveau d'aisance.
- **Ce qu'on y fait :**
  - Passer des QCM musicaux et culturels d'auto-évaluation créés par l'équipe pédagogique.
  - Consulter son score moyen et repérer les morceaux ou breaks nécessitant un travail personnel.
  - Suivre ses étapes d'intégration dans les différents pupitres de la troupe.
- **Badge nécessaire :** Aucun (Espace personnel).
- **Engagement estimé :** Régulier (bimensuel ou avant les répétitions de travail).

---

### 🔹 Onglet : Agenda (id: `agenda`)
- **À quoi ça sert :** Calendrier interactif centralisant toutes les répétitions, stages, ateliers de fabrication et concerts avec pointage en un clic.
- **Ce qu'on y fait :**
  - Répondre aux convocations d'événements : **Présent (Vert)**, **Absent (Rouge)** ou **À confirmer (Ocre)**.
  - Consulter les lieux exacts, horaires de rendez-vous, accès GPS et consignes de tenue.
  - Proposer ou réserver une place de covoiturage pour les déplacements de la troupe.
- **Badge nécessaire :** Aucun en consultation / réponse. *(La création et l'édition d'événements relèvent du Secrétariat ou de la Mestria).*
- **Engagement estimé :** Très régulier (hebdomadaire, avant chaque répétition ou sortie).

---

### 🔹 Onglet : Atelier (id: `atelier`)
- **À quoi ça sert :** Carnet d'atelier personnel permettant aux adhérents qui fabriquent un instrument ou cousent une tenue de suivre l'état de leurs propres chantiers.
- **Ce qu'on y fait :**
  - Consulter les fiches suiveuses des pièces confiées (fûts en usinage, découpes de tissu).
  - Pointer les étapes de fabrication réalisées en session d'atelier.
  - Demander la validation d'un maître d'atelier ou signaler un besoin de retouche.
- **Badge nécessaire :** Aucun pour consulter ses pièces. *(La validation technique dépend du badge Maître d'atelier).*
- **Engagement estimé :** Périodique (durant les périodes de chantiers de fabrication et de couture).

---

### 🔹 Onglet : Matériel (id: `materiel`)
- **À quoi ça sert :** Fiche d'inventaire individuelle récapitulant les instruments et accessoires associatifs prêtés à l'adhérent sous sa responsabilité.
- **Ce qu'on y fait :**
  - Consulter le numéro de série, l'état et la valeur d'assurance de l'instrument prêté.
  - Vérifier la composition de son kit de pupitre (housse, baudrier, baguettes, sangles).
  - Signaler une casse de peau, une fêlure ou un besoin de maintenance au pôle Logistique.
- **Badge nécessaire :** Aucun (Espace personnel).
- **Engagement estimé :** Ponctuel (en début/fin de saison ou en cas d'incident matériel).

---

### 🔹 Onglet : Vestiaire (id: `vestiaire`)
- **À quoi ça sert :** Garde-robe personnelle de scène listant les tenues, accessoires et éléments de costume officiels actuellement attribués au membre.
- **Ce qu'on y fait :**
  - Vérifier la liste des pièces de costume en sa possession pour la prochaine prestation.
  - Télécharger les consignes d'entretien, de repassage et de lavage spécifiques aux tissus.
  - Déclarer la restitution ou le besoin d'ajustement d'une pièce trop étroite/trop large.
- **Badge nécessaire :** Aucun (Espace personnel).
- **Engagement estimé :** Ponctuel (avant et après chaque concert ou sortie costumée).

---

### 🔹 Onglet : Trombinoscope (id: `trombinoscope`)
- **À quoi ça sert :** Annuaire visuel et convivial de la troupe facilitant la mémorisation des visages, des prénoms, surnoms et pupitres de jeu.
- **Ce qu'on y fait :**
  - Identifier les musiciens et danseurs par pupitre ou section.
  - Découvrir les dates d'anniversaires du mois au sein du groupe.
  - Ouvrir une conversation privée directe avec un camarade de pupitre.
- **Badge nécessaire :** Aucun (Accessible à tous les membres).
- **Engagement estimé :** Régulier (particulièrement précieux pour les nouveaux arrivants).

---

### 🔹 Onglet : Porte-voix / Forum (id: `forum`)
- **À quoi ça sert :** Espace d'échanges interne sécurisé et messagerie instantanée privée, remplaçant les groupes de messagerie externes dispersés.
- **Ce qu'on y fait :**
  - Échanger dans les salons thématiques ouverts (Discussions générales, Covoiturage, Entraide).
  - Participer aux salons réservés à son propre pupitre ou à son groupe de travail.
  - Dialoguer en tête-à-tête via la boîte de réception privée intégrée.
- **Badge nécessaire :** Aucun pour les salons publics et de pupitre. *(Les salons Bureau et CA sont filtrés automatiquement par badges).*
- **Engagement estimé :** Quotidien à hebdomadaire.

---

### 🔹 Onglet : Varal (id: `varal`)
- **À quoi ça sert :** Bibliothèque documentaire commune inspirée de la littérature de Cordel, mettant à disposition partitions, paroles et audios officiels.
- **Ce qu'on y fait :**
  - Écouter les enregistrements audio officiels de travail par pupitre.
  - Télécharger les livrets de chants (*toadas*), grilles rythmiques et partitions.
  - Réviser l'histoire, les traditions et le répertoire culturel de l'association.
- **Badge nécessaire :** Aucun (Consultation ouverte à tous les membres).
- **Engagement estimé :** Très régulier (révisions hebdomadaires entre deux répétitions).

---

## 🏛️ Pôle : Secrétariat & Administration (id: `secretariat`)

- **Vocation du pôle :** Centre névralgique de la gouvernance statutaire, du suivi administratif des membres, du calendrier officiel, de la mémoire légale et des relations institutionnelles.
- **Profil associatif recommandé :** Secrétaire Général(e), Secrétaire Adjoint(e), Membre du Bureau en charge des formalités légales et de la vie statutaire.

### 🔹 Onglet : Annuaire (id: `export-annu`)
- **À quoi ça sert :** Registre officiel exhaustif des adhérents avec moteurs de recherche avancés et outils d'export pour les assurances et les mairies.
- **Ce qu'on y fait :**
  - Rechercher et filtrer les adhérents par statut (actif, suspendu, en attente), rôle ou pupitre.
  - Consulter et éditer les fiches administratives (coordonnées, pièces jointes, date d'adhésion).
  - Exporter l'annuaire aux formats CSV / Excel pour les déclarations préfectorales ou bancaires.
- **Badge nécessaire :** Clé `secretariat` ou `export-annu` (Mots-clés de secours : `secrétariat`, `secretaire`, `bureau`, `ca`, `direction`, `admin`).
- **Engagement estimé :** Très fort à la rentrée (septembre-novembre), puis bimensuel pour le suivi des dossiers.

### 🔹 Onglet : Registre des dates (id: `studio-events`)
- **À quoi ça sert :** Tableau d'édition rapide et globale permettant de planifier, modifier et convoquer l'ensemble des événements de la saison.
- **Ce qu'on y fait :**
  - Créer des répétitions, stages, concerts, assemblées générales et ateliers avec horaires et lieux.
  - Définir le public convoqué (tous, pupitres précis, bureau seul, CA).
  - Contrôler le baromètre de présence en direct pour confirmer la tenue de la date.
- **Badge nécessaire :** Clé `secretariat` ou `studio-events` (Mots-clés : `secrétariat`, `bureau`, `présidence`, `admin`, `ca`).
- **Engagement estimé :** Hebdomadaire (gestion du calendrier et des relances de présence).

### 🔹 Onglet : Réunions (id: `reunion-manager`)
- **À quoi ça sert :** Espace dédié à la préparation collaborative des réunions (Bureau, CA, AG) et à la rédaction en direct des procès-verbaux (PV).
- **Ce qu'on y fait :**
  - Rédiger l'ordre du jour et convoquer les administrateurs avec la liste des points à trancher.
  - Prendre des notes en séance, consigner les résultats des votes et les décisions adoptées.
  - Générer et archiver le compte-rendu officiel téléchargeable par les administrateurs autorisés.
- **Badge nécessaire :** Clé `secretariat` ou `reunion-manager` (Mots-clés : `secrétariat`, `bureau`, `ca`, `direction`).
- **Engagement estimé :** Mensuel (lors des réunions statutaires du Conseil) et annuel (AG).

### 🔹 Onglet : Varal Secrétariat (id: `varal-secretariat`)
- **À quoi ça sert :** Coffre-fort documentaire numérique de l'association pour l'archivage pérenne des pièces officielles et contractuelles.
- **Ce qu'on y fait :**
  - Déposer et classer les statuts déposés, le récépissé de préfecture et l'avis de publication au JOAFE.
  - Archiver les polices d'assurance multirisque, attestations de responsabilité civile et conventions.
  - Mettre à disposition du Bureau les modèles de courriers types et formulaires de décharge.
- **Badge nécessaire :** Clé `secretariat` ou `varal-secretariat` (Mots-clés : `secrétariat`, `bureau`, `ca`, `admin`).
- **Engagement estimé :** Ponctuel (au fil des démarches administratives et après chaque AG).

### 🔹 Onglet : Porte-voix (id: `mestre-forum-channels`)
- **À quoi ça sert :** Console de régulation et de paramétrage des espaces de discussion du forum interne.
- **Ce qu'on y fait :**
  - Créer de nouveaux canaux de discussion thématiques (ex : projet festival, groupe de travail).
  - Définir les droits de visibilité et d'écriture par badge (ex : canal réservé aux chefs de pupitre).
  - Modérer les publications et épingler les messages d'information d'intérêt général.
- **Badge nécessaire :** Clé `secretariat` ou `mestre-forum-channels` (Mots-clés : `secrétariat`, `modérateur`, `bureau`, `admin`).
- **Engagement estimé :** Ponctuel (création au besoin et modération continue).

### 🔹 Onglet : Rapports (id: `activity-reports`)
- **À quoi ça sert :** Outil de mesure et d'analyse quantitative de l'activité annuelle (assiduité, volume horaire, dynamisme des pupitres).
- **Ce qu'on y fait :**
  - Suivre le taux moyen d'assiduité aux répétitions et identifier les pupitres en sous-effectif.
  - Quantifier le volume total d'heures de pratique collective dispensées au cours de la saison.
  - Extraire les graphiques et métriques nécessaires à l'évaluation des actions de l'association.
- **Badge nécessaire :** Clé `secretariat` ou `activity-reports` (Mots-clés : `secrétariat`, `bureau`, `direction`, `admin`).
- **Engagement estimé :** Périodique (fin de trimestre ou mi-saison).

### 🔹 Onglet : Rapports & Bilan AG (id: `secretariat-reports`)
- **À quoi ça sert :** Générateur consolidé du Bilan d'Activité officiel destiné à être présenté en Assemblée Générale et joint aux dossiers de subventions.
- **Ce qu'on y fait :**
  - Compiler automatiquement en 4 blocs synthétiques : Vie associative, Scène & Prestations, Ateliers & Artisanat, Finances.
  - Comparer l'exercice en cours avec les saisons précédentes pour mesurer l'évolution de la troupe.
  - Exporter le rapport complet au format tableur CSV ou imprimer le dossier de présentation pour la mairie.
- **Badge nécessaire :** Clé `secretariat` ou `secretariat-reports` (Mots-clés : `secrétariat`, `bureau`, `présidence`, `admin`).
- **Engagement estimé :** Annuel (en préparation de l'Assemblée Générale annuelle et des campagnes de subventions).

### 🔹 Onglet : Ressources & Liens (id: `secretariat-documents`)
- **À quoi ça sert :** Gestionnaire de conformité légale individuelle (santé, assurances, chartes éthiques et droits à l'image).
- **Ce qu'on y fait :**
  - Suivre la collecte des attestations médicales ou certificats de non-contre-indication à la pratique.
  - Vérifier la signature des autorisations de droit à l'image et du règlement intérieur par les membres.
  - Centraliser les liens vers les clouds partagés et espaces de stockage externes de l'association.
- **Badge nécessaire :** Clé `secretariat` ou `secretariat-documents` (Mots-clés : `secrétariat`, `bureau`, `admin`).
- **Engagement estimé :** Fort à la rentrée (vérification des dossiers d'adhésion), puis veille continue.

### 🔹 Onglet : Lieux, Types & Relances (id: `secretariat-lieux`)
- **À quoi ça sert :** Répertoire des infrastructures utilisées par l'association et paramétrage des automatisations de rappels.
- **Ce qu'on y fait :**
  - Répertorier les salles de répétition habituelles avec adresse GPS, codes d'accès et contacts des gardiens.
  - Configurer les types d'événements (répétition générale, atelier débutant, défilé) et leurs couleurs sur l'agenda.
  - Régler les délais de relance automatique par notification pour les adhérents n'ayant pas répondu à leur convocation.
- **Badge nécessaire :** Clé `secretariat` ou `secretariat-lieux` (Mots-clés : `secrétariat`, `bureau`, `admin`).
- **Engagement estimé :** Ponctuel (en début de saison ou lors d'un changement de salle municipale).

---

## 🏛️ Pôle : Diffusion & Prestations (id: `diffusion`)

- **Vocation du pôle :** Prospection commerciale, suivi des opportunités de dates de concert, négociation des cachets, relations avec les programmateurs culturels et concrétisation des contrats.
- **Profil associatif recommandé :** Chargé(e) de diffusion, Booker, Responsable Partenariats & Spectacles, Administrateur délégué aux prestations.

### 🔹 Onglet : Suivi des Prestations (id: `gigs-pipeline`)
- **À quoi ça sert :** Tableau Kanban visuel pour piloter le cycle de vie complet de chaque proposition de concert, du premier appel téléphonique jusqu'à la facture acquittée.
- **Ce qu'on y fait :**
  - Faire glisser les cartes de prestations entre les colonnes : *Contact initial*, *Devis envoyé*, *Option posée*, *Contrat signé*, *Concert réalisé*, *Facturé*.
  - Renseigner les jauges de négociation : montant du cachet proposé, défraiements transport/repas, effectif scénique demandé.
  - Lier la prestation au registre des dates pour convoquer automatiquement la troupe une fois le contrat signé.
- **Badge nécessaire :** Clé `diffusion` ou `gigs-pipeline` (Mots-clés : `diffusion`, `booking`, `communication`, `bureau`, `trésorier`, `secrétaire`).
- **Engagement estimé :** Régulier et continu tout au long de l'année (suivi hebdomadaire des contacts et relances).

### 🔹 Onglet : Carnet de Contacts CRM (id: `diffusion-contacts`)
- **À quoi ça sert :** Annuaire relationnel spécialisé (CRM) répertoriant tous les programmateurs culturels, mairies, comités des fêtes et directeurs de festivals.
- **Ce qu'on y fait :**
  - Ficher les contacts clés (nom, poste, téléphone portable direct, courriel, adresse de facturation).
  - Consigner l'historique des échanges, des relances téléphoniques et les périodes préférentielles de programmation de chaque lieu.
  - Segmenter les diffuseurs par type d'événement (festivals de rue, carnavals, soirées privées, scènes musicales).
- **Badge nécessaire :** Clé `diffusion` ou `diffusion-contacts` (Mots-clés : `diffusion`, `booking`, `communication`, `bureau`).
- **Engagement estimé :** Au fil de l'eau (mise à jour à chaque prospection ou prise de contact).

---

## 🏛️ Pôle : Trésorerie & Finances (id: `tresorerie`)

- **Vocation du pôle :** Gestion budgétaire rigoureuse, contrôle des cotisations, comptabilité analytique des concerts, remboursement des frais et production des états financiers annuels.
- **Profil associatif recommandé :** Trésorier / Trésorière, Trésorier(e) adjoint(e), Comptable bénévole, Administrateur délégué aux finances.

### 🔹 Onglet : Synthèse (id: `dashboard-finance`)
- **À quoi ça sert :** Tableau de bord de pilotage financier donnant une vue instantanée sur la trésorerie globale, le réalisé par rapport au prévisionnel et les coordonnées bancaires.
- **Ce qu'on y fait :**
  - Consulter le solde bancaire global disponible et l'état des réserves de l'association.
  - Visualiser la balance globale des recettes et dépenses ventilées par grands postes budgétaires.
  - Vérifier et copier rapidement les coordonnées bancaires officielles (IBAN / BIC) pour les factures ou virements.
- **Badge nécessaire :** Clé `tresorerie` ou `dashboard-finance` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `comptable`, `finance`).
- **Engagement estimé :** Régulier (mensuel ou avant chaque point de Bureau/CA).

### 🔹 Onglet : Cotisations (id: `cotisations`)
- **À quoi ça sert :** Registre d'encaissement et de contrôle des adhésions annuelles, des formules tarifaires et des relances pour impayés.
- **Ce qu'on y fait :**
  - Paramétrer les tarifs de saison (plein tarif, tarif étudiant, tarif solidaire, facilités en plusieurs fois).
  - Suivre nominativement le statut de paiement de chaque adhérent : *Payé*, *En attente*, *Paiement partiel*.
  - Enregistrer les modes de règlement (virement, chèque, espèces, HelloAsso) et émettre les reçus de cotisation.
- **Badge nécessaire :** Clé `tresorerie` ou `cotisations` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `comptable`).
- **Engagement estimé :** Très fort de septembre à décembre, puis ponctuel lors des arrivées en cours d'année.

### 🔹 Onglet : Événements (id: `events-finances`)
- **À quoi ça sert :** Comptabilité analytique dédiée à chaque prestation et concert pour déterminer précisément sa rentabilité nette.
- **Ce qu'on y fait :**
  - Rapprocher les recettes encaissées (cachets, billetterie, buvette) des dépenses engagées (transport, péages, repas, hébergement).
  - Calculer la marge nette dégagée par chaque sortie pour alimenter les projets futurs du groupe.
  - Archiver les justificatifs comptables, devis signés et factures émis pour cette date spécifique.
- **Badge nécessaire :** Clé `tresorerie` ou `events-finances` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `finance`).
- **Engagement estimé :** Ponctuel, déclenché après chaque prestation ou événement payant.

### 🔹 Onglet : Opérations (id: `operations-diverses`)
- **À quoi ça sert :** Journal des opérations courantes permettant de consigner au fil de l'eau toutes les recettes et dépenses de fonctionnement hors prestations.
- **Ce qu'on y fait :**
  - Enregistrer un achat de fournitures, une prime d'assurance, un loyer de salle ou l'encaissement d'une subvention.
  - Affecter chaque ligne à une catégorie comptable et à un compte bancaire précis.
  - Joindre le ticket de caisse, reçu ou facture numérisé pour garantir la traçabilité en cas de contrôle fiscal.
- **Badge nécessaire :** Clé `tresorerie` ou `operations-diverses` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `comptable`).
- **Engagement estimé :** Bimensuel à mensuel (saisie continue des mouvements de fonds).

### 🔹 Onglet : Frais (id: `frais-km`)
- **À quoi ça sert :** Module de contrôle, de validation et de liquidation des notes de frais de déplacement et abandons de frais kilométriques des bénévoles.
- **Ce qu'on y fait :**
  - Vérifier les déclarations de trajet soumises par les conducteurs bénévoles (itinéraires, péages, barème fiscal en vigueur).
  - Valider l'ordre de remboursement bancaire en faveur du membre.
  - Ou convertir la dépense en abandon de frais pour délivrer un reçu fiscal ouvrant droit à réduction d'impôt (CERFA).
- **Badge nécessaire :** Clé `tresorerie` ou `frais-km` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `comptable`).
- **Engagement estimé :** Mensuel ou après chaque grand déplacement de la troupe.

### 🔹 Onglet : Exports (id: `reports-exports`)
- **À quoi ça sert :** Générateur des états comptables réglementaires (Compte de résultat, Bilan financier) indispensables pour l'Assemblée Générale et les banques.
- **Ce qu'on y fait :**
  - Clôturer l'exercice comptable annuel et figer les écritures.
  - Éditer le compte de résultat synthétique opposant les charges et les produits de l'année.
  - Exporter le grand livre et les journaux financiers en formats normalisés (PDF, CSV).
- **Badge nécessaire :** Clé `tresorerie` ou `reports-exports` (Mots-clés : `trésorier`, `trésorière`, `trésorerie`, `comptable`).
- **Engagement estimé :** Annuel (clôture des comptes) et semestriel (points d'étape budgétaires).

---

## 🏛️ Pôle : Logistique & Matériel (id: `logistique`)

- **Vocation du pôle :** Maîtrise opérationnelle du parc d'instruments de musique, traçabilité des attributions, composition des paquetages d'accessoires et logistique des convois.
- **Profil associatif recommandé :** Régisseur / Régisseuse Matériel, Responsable Logistique, Gestionnaire de flotte, Capitaine de transport.

### 🔹 Onglet : Instruments (id: `inventory`)
- **À quoi ça sert :** Inventaire exhaustif du parc d'instruments de l'association, de leur localisation physique et de leur état opérationnel.
- **Ce qu'on y fait :**
  - Suivre le statut de chaque pièce : *En service*, *En maintenance / atelier*, *Hors service*.
  - Affecter nominalement un instrument à un membre sous contrat de prêt ou à un lieu de stockage (local associatif).
  - Enregistrer les caractéristiques techniques : numéro d'identification gravé, marque, diamètre, matière du fût, photos.
- **Badge nécessaire :** Clé `logistique` ou `inventory` (Mots-clés : `logistique`, `matériel`, `inventaire`, `instruments`).
- **Engagement estimé :** Régulier (contrôles mensuels et état des lieux d'entrée/sortie à chaque rentrée).

### 🔹 Onglet : Pupitres (id: `logistics-pupitres`)
- **À quoi ça sert :** Référentiel musical structurant les pupitres de la troupe, les types d'instruments associés et leur identité visuelle.
- **Ce qu'on y fait :**
  - Définir les pupitres actifs de la troupe (ex: Alfaia, Caixa, Gonguê, Agbê, Mineiro, Danse).
  - Assigner un code couleur distinctif à chaque pupitre pour l'ensemble de l'interface (scénographie, agenda, annuaire).
  - Harmoniser la nomenclature des instruments avec le séquenceur et les partitions musicales.
- **Badge nécessaire :** Clé `logistique` ou `logistics-pupitres` (Mots-clés : `logistique`, `matériel`, `mestre`).
- **Engagement estimé :** Ponctuel (calibrage en début de saison ou lors de l'intégration d'un nouvel instrument).

### 🔹 Onglet : Accessoires & Kits (id: `logistics-kits`)
- **À quoi ça sert :** Configuration des paquetages matériels indispensables qui accompagnent chaque instrument prêté.
- **Ce qu'on y fait :**
  - Définir la composition type d'un kit par pupitre (ex : 1 Alfaia = 1 fût + 1 housse rembourrée + 1 paire de mailloches + 1 sangle d'épaule).
  - Rattacher les consommables nécessaires depuis les réserves générales.
  - Vérifier la complétude des kits avant la distribution aux musiciens à la rentrée.
- **Badge nécessaire :** Clé `logistique` ou `logistics-kits` (Mots-clés : `logistique`, `matériel`, `inventaire`).
- **Engagement estimé :** Ponctuel / Rentrée (préparation des paquetages de prêt).

### 🔹 Onglet : Covoiturage & Convois (id: `logistics-carpool`)
- **À quoi ça sert :** Organisation tactique des déplacements collectifs, recensement des véhicules disponibles et répartition des instruments volumineux dans les coffres.
- **Ce qu'on y fait :**
  - Enregistrer les véhicules des adhérents volontaires (nombre de places passagers, volume de coffre, présence d'un attelage).
  - Composer les convois de départ pour les concerts et désigner les véhicules « transporteurs de matériel ».
  - Fixer le point de rassemblement, l'heure de convoi et les règles de calcul des indemnités de route.
- **Badge nécessaire :** Clé `logistique` ou `logistics-carpool` (Mots-clés : `logistique`, `matériel`, `transport`).
- **Engagement estimé :** Ponctuel, activé avant chaque concert ou festival nécessitant un déplacement hors agglomération.

### 🔹 Onglet : Commandes (id: `orders`)
- **À quoi ça sert :** Gestion des achats groupés de matériel musical, fournitures et consommables auprès des fabricants et distributeurs.
- **Ce qu'on y fait :**
  - Recenser les besoins d'achat (peaux animales ou synthétiques, cordes de tension, baguettes, housses neuves).
  - Suivre l'approbation budgétaire des devis en lien avec la Trésorerie.
  - Pointer la réception des colis à la livraison pour alimenter automatiquement les stocks d'inventaire.
- **Badge nécessaire :** Clé `logistique` ou `orders` (Mots-clés : `logistique`, `commandes`, `achats`).
- **Engagement estimé :** Périodique (commandes groupées semestrielles ou d'urgence avant festival).

---

## 🏛️ Pôle : Lutherie & Artisanat Instrumental (id: `lutherie`)

- **Vocation du pôle :** Atelier de fabrication manuelle, d'usinage, de maintenance lourde et de conservation du patrimoine instrumental de l'association.
- **Profil associatif recommandé :** Maître d'atelier, Luthier / Artisane de la troupe, Bricoleurs et réparateurs bénévoles.

### 🔹 Onglet : Établi & Chantiers (id: `inventory-projects`)
- **À quoi ça sert :** Suivi opérationnel en direct de l'assemblage et de la réparation lourde des instruments à partir des pièces usinées.
- **Ce qu'on y fait :**
  - Ouvrir un conteneur d'assemblage selon un gabarit prédéfini (ex: Alfaia 20 pouces).
  - Assigner les pièces détachées requises disponibles en stock (fût brut, cercles, tirants).
  - Procéder au « baptême » de l'instrument terminé pour lui attribuer son numéro d'inventaire définitif et le verser au parc actif.
- **Badge nécessaire :** Clé `lutherie` ou `inventory-projects` (Mots-clés : `lutherie`, `atelier`, `artisan`, `luthier`).
- **Engagement estimé :** Très actif lors des sessions d'ateliers de fabrication du week-end.

### 🔹 Onglet : Modèles d'instruments (id: `instrument-models`)
- **À quoi ça sert :** Bureau d'études techniques consignant les plans de fabrication, cotes, gabarits et nomenclatures officielles des instruments fabriqués.
- **Ce qu'on y fait :**
  - Modéliser la fiche technique d'un instrument : diamètre, hauteur de fût, épaisseur du bois, nombre de tirants, type de chanfrein.
  - Définir la nomenclature exacte des pièces nécessaires à la fabrication d'une unité.
  - Importer ou exporter des modèles complets (fichiers d'échange technique entre associations).
- **Badge nécessaire :** Clé `lutherie` ou `instrument-models` (Mots-clés : `lutherie`, `atelier`, `artisan`).
- **Engagement estimé :** Ponctuel (conception de nouveaux modèles d'instruments ou amélioration des fiches).

### 🔹 Onglet : Pièces détachées (id: `inventory-parts`)
- **À quoi ça sert :** Traçabilité unitaire des composants usinés au sein de l'atelier ou en cours de façonnage par les adhérents.
- **Ce qu'on y fait :**
  - Enregistrer une pièce brute entrée en atelier (ex : fût roulé collé, cercle cintré).
  - Suivre les étapes d'usinage (découpe, chanfreinage, ponçage, perçage, vernissage).
  - Marquer une pièce comme terminée et disponible pour le montage final sur l'établi.
- **Badge nécessaire :** Clé `lutherie` ou `inventory-parts` (Mots-clés : `lutherie`, `atelier`, `artisan`).
- **Engagement estimé :** Régulier durant les périodes d'ouverture de l'atelier de lutherie.

### 🔹 Onglet : Matières premières (id: `inventory-supplies`)
- **À quoi ça sert :** Gestion pondérale, métrique et quantitative des stocks de bois brut, cordages, peaux brutes et quincaillerie.
- **Ce qu'on y fait :**
  - Suivre les métrages de cordages (drisse, chanvre), les rouleaux de peaux, les pots de vernis et les tirants métalliques.
  - Paramétrer des seuils d'alerte de stock critique pour éviter les ruptures en plein chantier.
  - Déclencher les listes d'approvisionnement à transmettre au responsable des commandes.
- **Badge nécessaire :** Clé `lutherie` ou `inventory-supplies` (Mots-clés : `lutherie`, `atelier`, `matériel`).
- **Engagement estimé :** Mensuel (inventaire des consommables et réassorts).

### 🔹 Onglet : Outillage (id: `workshop-tools`)
- **À quoi ça sert :** Parc des machines et outils manuels de l'atelier de lutherie, avec distinction entre outillage résident et mallettes mobiles.
- **Ce qu'on y fait :**
  - Inventorier les défonceuses, perceuses à colonne, ponceuses, scies à ruban, serre-joints et clés de tension.
  - Indiquer si un outil reste obligatoirement au local associatif ou peut voyager en caisse de dépannage lors des tournées.
  - Noter les opérations d'entretien, de changement de lames ou de contrôle de sécurité électrique.
- **Badge nécessaire :** Clé `lutherie` ou `workshop-tools` (Mots-clés : `lutherie`, `atelier`, `artisan`).
- **Engagement estimé :** Ponctuel (inventaire et maintenance préventive semestrielle).

### 🔹 Onglet : Varal Lutherie (id: `varal-lutherie`)
- **À quoi ça sert :** Espace documentaire et pédagogique regroupant les tutoriels illustrés, guides pas-à-pas et fiches de sécurité d'atelier.
- **Ce qu'on y fait :**
  - Mettre à disposition les modes d'emploi illustrés pour monter ou changer une peau d'Alfaia ou de Caixa.
  - Consulter les fiches de sécurité (équipements de protection individuelle, manipulation des solvants et machines).
  - Partager les astuces de lutherie traditionnelle et les vidéos techniques avec les apprentis.
- **Badge nécessaire :** Clé `lutherie` ou `varal-lutherie` (Mots-clés : `lutherie`, `atelier`, `artisan`).
- **Engagement estimé :** Ponctuel (enrichissement de la bibliothèque de savoirs).

> **Permission Spécifique d'Atelier (id: `canValidateWorkshopSteps`) :**  
> Attribuable via la matrice de sécurité aux maîtres d'atelier expérimentés (`maître d'atelier`, `luthier`, `référent lutherie`), elle confère le pouvoir officiel de valider la conformité d'une étape d'usinage réalisée par un adhérent ou de demander une reprise technique sur l'établi avant montage.

---

## 🏛️ Pôle : Costumerie & Artisanat Textile (id: `costumerie`)

- **Vocation du pôle :** Création, confection sur mesure, entretien, gestion des stocks et traçabilité des tenues de scène de la troupe (danseurs et musiciens).
- **Profil associatif recommandé :** Costumier / Costumière en chef, Responsable d'atelier couture, Habilleur(se) de concert.

### 🔹 Onglet : Établi de confection (id: `wardrobe-projects`)
- **À quoi ça sert :** Pilotage des chantiers de fabrication de costumes en cours, avec découpage des tâches entre les bénévoles couturiers.
- **Ce qu'on y fait :**
  - Créer un projet de série de costumes (ex : 20 vestes brodées pour la nouvelle création).
  - Assigner les opérations de découpe, de surfilage, d'assemblage et d'ourlet aux couturiers volontaires.
  - Suivre l'avancement pourcentage par pourcentage jusqu'à l'incorporation de la tenue terminée dans le vestiaire physique.
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-projects` (Mots-clés : `costume`, `costumes`, `costumière`, `couture`, `couturier`, `tailleur`).
- **Engagement estimé :** Très fort lors des périodes de préparation de spectacle (ateliers couture du week-end).

### 🔹 Onglet : Modèles & Patrons (id: `wardrobe-models`)
- **À quoi ça sert :** Référentiel des collections de tenues officielles, avec découpage en pièces obligatoires et accessoires de scène.
- **Ce qu'on y fait :**
  - Enregistrer les modèles officiels (jupes de danse, pantalons de parade, gilets, turbans, colliers).
  - Attacher les fiches de patronage en PDF et spécifier les métrages de tissus nécessaires par taille.
  - Définir les variantes de tenues requises selon le type de prestation (défilé de rue, concert nocturne, gala).
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-models` (Mots-clés : `costume`, `costumière`, `couture`).
- **Engagement estimé :** Ponctuel (lors de la création d'un nouveau spectacle ou renouvellement de gamme).

### 🔹 Onglet : Vestiaire physique (id: `wardrobe-pieces`)
- **À quoi ça sert :** Catalogue unitaire et traçabilité physique des vêtements confectionnés, de leurs détenteurs et de leur état d'usure.
- **Ce qu'on y fait :**
  - Vérifier la disponibilité des tenues classées par taille (S, M, L, XL, sur-mesure) et par pupitre.
  - Attribuer nominalement chaque pièce à un musicien ou danseur pour la saison ou pour une date ponctuelle.
  - Déclarer les besoins de pressing, de retouche ou de mise au rebut des pièces usées.
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-pieces` (Mots-clés : `costume`, `costumière`, `habillage`, `vestiaire`).
- **Engagement estimé :** Régulier (gestion des distributions avant chaque sortie et réintégrations post-spectacle).

### 🔹 Onglet : Tissus & Mercerie (id: `wardrobe-supplies`)
- **À quoi ça sert :** Suivi des métrages de rouleaux de tissus, doublures, laizes, fils à coudre, élastiques, boutons et mercerie.
- **Ce qu'on y fait :**
  - Gérer les stocks de tissus selon la laize, la couleur et le motif traditionnel.
  - Calculer la réserve de mercerie restante avant d'engager une nouvelle série de confection.
  - Générer la liste d'achats pour les commandes groupées de tissus et rubans.
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-supplies` (Mots-clés : `costume`, `couture`, `couturière`).
- **Engagement estimé :** Mensuel ou en amont des chantiers de fabrication textile.

### 🔹 Onglet : Machines & Outils (id: `wardrobe-tools`)
- **À quoi ça sert :** Inventaire et suivi technique du parc de machines à coudre, surjeteuses, ciseaux tailleurs et fers à repasser professionnels.
- **Ce qu'on y fait :**
  - Répertorier les machines appartenant au groupe ou prêtées par des adhérents pour les ateliers.
  - Suivre les révisions mécaniques, graissages, changements d'aiguilles et approvisionnements en canettes.
  - Identifier les machines mobiles pouvant être emportées en loge lors des concerts pour les retouches d'urgence.
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-tools` (Mots-clés : `costume`, `couture`, `couturière`).
- **Engagement estimé :** Ponctuel (contrôle semestriel de l'état des machines).

### 🔹 Onglet : Tailles & Mensurations (id: `wardrobe-sizes`)
- **À quoi ça sert :** Registre centralisé des gabarits et mensurations corporelles de l'ensemble des adhérents de la troupe.
- **Ce qu'on y fait :**
  - Consulter les fiches de mensurations (stature, tour de poitrine, tour de taille, hanches, longueur de jambe).
  - Croiser les mensurations de la troupe avec le stock du vestiaire physique pour détecter les pièces manquantes.
  - Anticiper la fabrication de tenues dans des tailles spécifiques avant les castings de saison.
- **Badge nécessaire :** Clé `costumerie` ou `wardrobe-sizes` (Mots-clés : `costume`, `costumière`, `couture`).
- **Engagement estimé :** Très fort à la rentrée associative (recueil des fiches des nouveaux membres).

### 🔹 Onglet : Varal Costumerie (id: `varal-costumerie`)
- **À quoi ça sert :** Médiathèque textile regroupant les planches de patronage en PDF, les guides de coupe et les consignes de repassage et lavage.
- **Ce qu'on y fait :**
  - Déposer et télécharger les patrons de couture à échelle réelle prêts à être imprimés.
  - Publier les fiches techniques d'ourlet, de pose de biais et d'assemblage pas-à-pas.
  - Diffuser les protocoles de nettoyage des tissus délicats (peintures sur tissu, paillettes, broderies).
- **Badge nécessaire :** Clé `costumerie` ou `varal-costumerie` (Mots-clés : `costume`, `costumière`, `couture`).
- **Engagement estimé :** Ponctuel (enrichissement des tutoriels au fur et à mesure des créations).

---

## 🏛️ Pôle : Studio & Communication (id: `studio`)

- **Vocation du pôle :** Visibilité externe de l'association, animation des réseaux sociaux, diffusion des infolettres (newsletters), gestion de la photothèque officielle et passerelle Brevo.
- **Profil associatif recommandé :** Responsable Communication, Community Manager, Photographe officiel(le), Rédacteur de newsletter.

### 🔹 Onglet : Studio social (id: `studio-social`)
- **À quoi ça sert :** Studio graphique et éditorial pour concevoir rapidement des visuels de promotion prêts pour Instagram et Facebook.
- **Ce qu'on y fait :**
  - Sélectionner une date de concert dans l'agenda pour générer un visuel d'annonce calibré (stories, posts).
  - Appliquer les motifs graphiques et typographies officielles de l'association en un clic.
  - Rédiger les accroches textuelles et exporter les créations pour publication immédiate.
- **Badge nécessaire :** Clé `studio` ou `studio-social` (Mots-clés : `studio`, `communication`, `porte-voix`).
- **Engagement estimé :** Très régulier (hebdomadaire, au rythme des dates et actualités de la troupe).

### 🔹 Onglet : Newsletter (id: `newsletter`)
- **À quoi ça sert :** Outil de composition d'infolettres synthétiques pour tenir informés les adhérents, anciens membres et partenaires culturels.
- **Ce qu'on y fait :**
  - Rédiger l'édito de bienvenue et le mot du Bureau.
  - Insérer automatiquement les prochaines dates publiques issues de l'agenda officiel.
  - Ajouter les retours en images des prestations passées et générer le gabarit prêt pour l'envoi via Brevo.
- **Badge nécessaire :** Clé `studio` ou `newsletter` (Mots-clés : `studio`, `communication`, `newsletter`).
- **Engagement estimé :** Mensuel ou bimensuel.

### 🔹 Onglet : Communication & Brevo (id: `studio-communication`)
- **À quoi ça sert :** Console technique de raccordement à la plateforme d'emailing Brevo (ex-Sendinblue), gestion des clés d'API et délivrabilité DNS.
- **Ce qu'on y fait :**
  - Renseigner la clé d'API Brevo et l'adresse courriel d'expédition officielle du groupe.
  - Vérifier la configuration des enregistrements DNS (SPF / DKIM) pour éviter que les courriels tombent dans les spams.
  - Exporter la liste qualifiée des abonnés au format CSV pour les campagnes d'information externes.
- **Badge nécessaire :** Clé `studio` ou `studio-communication` (Mots-clés : `studio`, `communication`, `admin`).
- **Engagement estimé :** Ponctuel (paramétrage initial et maintenance semestrielle).

### 🔹 Onglet : Varal Photos (id: `varal-photos`)
- **À quoi ça sert :** Plateforme de collecte et de diffusion des clichés de concert par synchronisation cloud externe (Framaspace, Google Drive, Nextcloud).
- **Ce qu'on y fait :**
  - Raccorder le dossier cloud racine de l'association pour un accès sécurisé et centralisé.
  - Générer des QR Codes d'événements à afficher en loge ou au public pour collecter les photos prises par smartphone.
  - Sélectionner les plus beaux albums pour les exposer sous forme de livrets sur le Varal public des membres.
- **Badge nécessaire :** Clé `studio` ou `varal-photos` (Mots-clés : `studio`, `communication`, `photo`).
- **Engagement estimé :** Régulier (après chaque sortie, défilé ou festival).

---

## 🏛️ Pôle : Pédagogie & Transmission (id: `pedagogie`)

- **Vocation du pôle :** Encadrement des apprentissages musicaux, transmission du répertoire, conception des quiz d'auto-évaluation et suivi de l'aisance des pratiquants.
- **Profil associatif recommandé :** Coordinateur / Coordinatrice pédagogique, Formateur(trice) débutants, Adjoint(e) musical(e), Chef(fe) de pupitre.

### 🔹 Onglet : Varal Pédagogique (id: `varal-manager`)
- **À quoi ça sert :** Gestionnaire de contenu de la bibliothèque musicale partagée avec les membres (partitions, enregistrements de travail, livrets).
- **Ce qu'on y fait :**
  - Déposer et organiser les livrets de chants (*Cordels*) et grilles rythmiques par pupitre.
  - Téléverser les fichiers audio d'apprentissage (baques joués au tempo d'étude et au tempo concert).
  - Publier des fiches d'éclairage culturel sur les traditions populaires brésiliennes.
- **Badge nécessaire :** Clé `pedagogie` ou `varal-manager` (Mots-clés : `mestre`, `pédagogie`, `direction`).
- **Engagement estimé :** Régulier (enrichissement continu selon l'avancement du programme de travail).

### 🔹 Onglet : QCM & Quiz (id: `mestre-pedagogy-qcm`)
- **À quoi ça sert :** Éditeur de questionnaires interactifs permettant de tester les connaissances des membres sur les rythmes, les chants et l'histoire du groupe.
- **Ce qu'on y fait :**
  - Créer des questions à choix multiples avec indices et explications pédagogiques.
  - Cibler le quiz par niveau (Débutant, Intermédiaire, Confirmé) ou par pupitre spécifique.
  - Définir le seuil de réussite et publier le questionnaire dans l'espace personnel des membres.
- **Badge nécessaire :** Clé `pedagogie` ou `mestre-pedagogy-qcm` (Mots-clés : `mestre`, `pédagogie`, `direction`).
- **Engagement estimé :** Périodique (en amont des stages ou cycles de travail thématiques).

### 🔹 Onglet : Suivi et Analyse (id: `mestre-pedagogy-dashboard`)
- **À quoi ça sert :** Tableau de bord analytique mesurant la compréhension globale de la troupe pour adapter les séances de répétition en direct.
- **Ce qu'on y fait :**
  - Consulter les taux de participation et scores moyens obtenus aux quiz par pupitre.
  - Repérer immédiatement les questions et notions culturelles ou rythmiques les plus souvent échouées.
  - Adapter le plan de répétition de la semaine pour réexpliquer les passages mal maîtrisés.
- **Badge nécessaire :** Clé `pedagogie` ou `mestre-pedagogy-dashboard` (Mots-clés : `mestre`, `pédagogie`, `direction`).
- **Engagement estimé :** Bimensuel à mensuel (avant de concevoir le contenu des répétitions).

---

## 🏛️ Pôle : Mestria & Direction Artistique (id: `mestre`)

- **Vocation du pôle :** Direction artistique générale, gestion des équilibres de pupitres, castings de concert, scénographie, conduite des représentations et annonces musicales officielles.
- **Profil associatif recommandé :** Mestre, Contramestre, Directeur / Directrice Artistique, Maître de Baque.

### 🔹 Onglet : Catégories de pratique (id: `mestre-categories`)
- **À quoi ça sert :** Structuration des sections de pratique, filières d'apprentissage et niveaux au sein de la troupe.
- **Ce qu'on y fait :**
  - Définir les sous-groupes de l'association (ex: Atelier découverte, Groupe de scène, Section avancée, Danse).
  - Assigner des codes couleur et critères d'admission par catégorie.
  - Synchroniser les fiches profils des membres avec les catégories actives pour cibler les convocations.
- **Badge nécessaire :** Clé `mestre` ou `mestre-categories` (Rôle `mestre`, `admin`, ou mots-clés : `mestre`, `mestria`, `direction`, `artistique`).
- **Engagement estimé :** Ponctuel (en début de saison lors de la structuration des cours).

### 🔹 Onglet : Casting & Orientation (id: `mestre-orientation`)
- **À quoi ça sert :** Outil de supervision des effectifs et d'arbitrage pour équilibrer les pupitres et valider les souhaits d'évolution des musiciens.
- **Ce qu'on y fait :**
  - Contrôler les jauges d'équilibre par pupitre (ratio tambours graves / tambours aigus / instruments métalliques / danse).
  - Consulter les vœux de progression exprimés par les membres dans leur profil.
  - Valider l'affectation officielle d'un membre sur un pupitre pour la saison ou pour une date de scène.
- **Badge nécessaire :** Clé `mestre` ou `mestre-orientation` (Rôle `mestre` ou mots-clés : `mestre`, `direction`, `artistique`, `chef de pupitre`).
- **Engagement estimé :** Fort à la rentrée associative et à mi-saison (réajustements de casting).

### 🔹 Onglet : Plan de Scène (id: `mestre-stage-layout`)
- **À quoi ça sert :** Concepteur visuel interactif permettant de disposer géographiquement les musiciens et pupitres sur le plateau de concert.
- **Ce qu'on y fait :**
  - Dessiner l'implantation scénique en glissant-déposant les musiciens confirmés depuis le roster latéral.
  - Définir les lignes d'instruments (première ligne de danse, caixas au centre, alfaias en fond, chant face public).
  - Adapter les dimensions de la grille scénique selon la taille réelle du plateau ou de la rue.
- **Badge nécessaire :** Clé `mestre` ou `mestre-stage-layout` (Rôle `mestre` ou mots-clés : `mestre`, `scène`, `scene`, `direction`).
- **Engagement estimé :** Ponctuel, avant chaque concert ou festival pour préparer la régie de scène.

### 🔹 Onglet : Séquenceur & Rythmes (id: `mestre-sequenceur`)
- **À quoi ça sert :** Outil interactif de décomposition audionumérique des baques, breaks, viradas, solos et appels traditionnels.
- **Ce qu'on y fait :**
  - Renseigner la structure temporelle d'un morceau (tempo BPM, mesure, nombre de mesures par cycle).
  - Éditer les patterns rythmiques pas-à-pas pour chaque instrument de la troupe.
  - Utiliser le métronome et le lecteur interactif en répétition pour travailler les ralentis et accélérations.
- **Badge nécessaire :** Clé `mestre` ou `mestre-sequenceur` (Rôle `mestre` ou mots-clés : `mestre`, `direction`, `artistique`).
- **Engagement estimé :** Régulier (travail de recherche et préparation en amont des répétitions).

### 🔹 Onglet : Événements & Présences (id: `mestre-events`)
- **À quoi ça sert :** Vue de pilotage artistique direct des événements, permettant au Mestre de valider la faisabilité musicale d'une prestation.
- **Ce qu'on y fait :**
  - Examiner la liste des inscrits par pupitre pour vérifier si le quorum musical est atteint.
  - Définir la liste des morceaux (*setlist*) et l'ordre de passage pour ce concert précis.
  - Communiquer les consignes de jeu particulières, la couleur de peau des tambours ou l'ordre des solistes.
- **Badge nécessaire :** Clé `mestre` ou `mestre-events` (Rôle `mestre` ou mots-clés : `mestre`, `direction`, `artistique`).
- **Engagement estimé :** Régulier (avant chaque date importante pour finaliser le conducteur artistique).

### 🔹 Onglet : Annonces du Mestre (id: `mestre-mot-mestre`)
- **À quoi ça sert :** Canal solennel et direct d'annonces de la direction musicale vers l'ensemble de la communauté des adhérents.
- **Ce qu'on y fait :**
  - Rédiger le « Mot du Mestre » périodique (encouragements, bilans de concert, axes d'effort technique).
  - Diffuser une alerte prioritaire visible dès l'écran d'accueil par tous les membres.
  - Consulter l'historique des directives artistiques données au fil des années.
- **Badge nécessaire :** Clé `mestre` ou `mestre-mot-mestre` (Rôle `mestre`, `super-admin`, `admin`).
- **Engagement estimé :** Mensuel ou après chaque grand temps fort associatif.

---

## 🏛️ Pôle : Vitrine Publique (id: `vitrine`)

- **Vocation du pôle :** Administration éditoriale et graphique du site internet public de l'association, vitrine officielle ouverte sur les spectateurs, organisateurs et futurs adhérents.
- **Profil associatif recommandé :** Webmaster bénévole, Chargé(e) de communication web, Rédacteur de contenus.

### 🔹 Onglet : Général & SEO (id: `vitrine-general`)
- **À quoi ça sert :** Configuration du titre officiel du site, des méta-descriptions pour Google et des images de partage pour WhatsApp et Facebook.
- **Ce qu'on y fait :**
  - Renseigner le slogan officiel et le texte de description pour le référencement naturel (SEO).
  - Définir les mots-clés de recherche locale (ex: "Batucada Nantes", "Maracatu spectacle").
  - Paramétrer la balise de partage Open Graph (visuel qui s'affiche lors du partage du lien du site).
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `communication`, `webmaster`, `bureau`).
- **Engagement estimé :** Ponctuel (calibrage initial et révision annuelle).

### 🔹 Onglet : Présentation (id: `vitrine-presentation`)
- **À quoi ça sert :** Rédaction de la page d'accueil publique, récit de l'histoire du groupe, présentation des traditions et valeurs défendues.
- **Ce qu'on y fait :**
  - Rédiger la biographie de la troupe et son ancrage culturel brésilien.
  - Présenter la Mestria, les sections de danse et les pupitres de percussion aux visiteurs externes.
  - Soigner la mise en forme des textes d'accroche et des citations d'inspiration.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `communication`, `webmaster`).
- **Engagement estimé :** Annuel ou lors d'une refonte du discours de présentation de la troupe.

### 🔹 Onglet : Organisateur & Technique (id: `vitrine-organisateur`)
- **À quoi ça sert :** Espace professionnel dédié aux programmateurs culturels avec mise à disposition de tous les documents techniques téléchargeables.
- **Ce qu'on y fait :**
  - Mettre à disposition le Dossier de Presse et la Fiche Technique officielle en PDF.
  - Préciser les besoins matériels de la troupe (loge fermée, repas chauds, arrivées électriques, jauge scénique minimum).
  - Intégrer les boutons d'appel à l'action pour faciliter les demandes directes de devis.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `diffusion`, `webmaster`).
- **Engagement estimé :** Annuel (mise à jour de la fiche technique de début de saison).

### 🔹 Onglet : Galerie Photo (id: `vitrine-galerie`)
- **À quoi ça sert :** Vitrine multimédia valorisant les plus beaux clichés et vidéos de défilés, concerts et carnavals du groupe.
- **Ce qu'on y fait :**
  - Téléverser des photographies en haute définition pour impressionner les visiteurs.
  - Intégrer des liens de captations vidéo hébergées sur YouTube ou Vimeo.
  - Trier et légender les clichés par saison ou par festival marquant.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `studio`, `communication`).
- **Engagement estimé :** Régulier (ajout des meilleurs clichés après chaque grand événement).

### 🔹 Onglet : Recrutement & Vie Associative (id: `vitrine-recrutement`)
- **À quoi ça sert :** Espace d'information pour les futurs adhérents avec modalités d'inscription, journées portes ouvertes et cours d'essai.
- **Ce qu'on y fait :**
  - Rédiger les modalités d'admission (débutants acceptés, prêt d'instrument, sens du rythme).
  - Indiquer les lieux, jours et horaires des répétitions hebdomadaires et des ateliers découverte.
  - Activer ou désactiver le formulaire de candidature ou de pré-inscription en ligne.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `secrétariat`, `communication`).
- **Engagement estimé :** Fort de juin à octobre (campagnes de rentrée associative).

### 🔹 Onglet : Réseaux & Newsletter (id: `vitrine-reseaux`)
- **À quoi ça sert :** Liens vers les profils officiels sur les plateformes sociales et intégration du formulaire d'abonnement public à la lettre d'information.
- **Ce qu'on y fait :**
  - Vérifier les liens vers Instagram, Facebook, TikTok, YouTube et Spotify.
  - Activer le bloc d'inscription à l'infolettre pour collecter les courriels des sympathisants.
  - Tester les redirections pour s'assurer qu'aucun lien brisé n'est exposé au public.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit` (Mots-clés : `vitrine`, `communication`, `webmaster`).
- **Engagement estimé :** Ponctuel (vérification semestrielle).

### 🔹 Onglet : Apparence (id: `vitrine-apparence`)
- **À quoi ça sert :** Personnalisation des styles visuels, palettes de couleurs et typographies du site public pour respecter la charte graphique de la troupe.
- **Ce qu'on y fait :**
  - Choisir les teintes primaires et secondaires de la vitrine (accords de tons Cordel, terre cuite, jaune ocre, vert profond).
  - Prévisualiser le rendu en temps réel sur smartphone, tablette et écran d'ordinateur.
  - Publier la nouvelle feuille de style d'un simple clic sans toucher au code source.
- **Badge nécessaire :** Clé `vitrine`, `vitrine-edit`, `public-theme` (Mots-clés : `vitrine`, `webmaster`, `bureau`).
- **Engagement estimé :** Ponctuel (lors de l'inauguration du site ou changement d'identité visuelle).

---

## 🏛️ Pôle : Configuration du Système (id: `config`)

- **Vocation du pôle :** Paramétrage institutionnel, gouvernance de l'application, sécurité d'accès, activation des modules et personnalisation des fiches profils.
- **Profil associatif recommandé :** Président(e), Secrétaire Général(e), Administrateur Système / Référent Outil Numérique du Bureau.

### 🔹 Onglet : Identité (id: `config-identity`)
- **À quoi ça sert :** Données juridiques officielles de l'association (SIRET, RNA, siège social, assurance) et déclaration des membres du Bureau.
- **Ce qu'on y fait :**
  - Enregistrer la raison sociale légale, le numéro SIRET, le numéro RNA et l'adresse officielle de correspondance.
  - Déclarer les titulaires de la Présidence, du Secrétariat, de la Trésorerie et de la Direction Artistique.
  - Téléverser le logo officiel haute définition et la signature numérique du/de la Président(e) pour l'édition automatique des documents officiels.
- **Badge nécessaire :** Clé `config` ou `config-identity` (Mots-clés : `config`, `secrétaire`, `président`, `bureau`, `admin`).
- **Engagement estimé :** Annuel (après chaque renouvellement de bureau en Assemblée Générale).

### 🔹 Onglet : Badges & Permissions (id: `config-security`)
- **À quoi ça sert :** Console maîtresse de sécurité permettant d'attribuer finement chaque pôle et chaque onglet de l'application aux badges d'administrateurs.
- **Ce qu'on y fait :**
  - Ouvrir les accordéons par pôle et cocher/décocher les badges autorisés pour chaque onglet spécifique.
  - Utiliser les raccourcis « Tous » ou « Aucun » pour déléguer rapidement un pôle entier à une commission de travail.
  - Sécuriser l'application en appliquant le principe de moindre privilège selon la lettre de mission de chaque membre du CA.
- **Badge nécessaire :** Clé `config` ou `config-security` (Rôles `admin`, `super-admin`, `isSystemAdmin` ou mot-clé `sécurité`).
- **Engagement estimé :** Fort à la rentrée (distribution des badges aux administrateurs), puis ponctuel au fil des délégations.

### 🔹 Onglet : Apparence (id: `config-layout`)
- **À quoi ça sert :** Gestion du thème graphique général de l'espace membre interne (Thème Cordel, thème sombre, textures de papier).
- **Ce qu'on y fait :**
  - Basculer entre l'habillage papier artisanal Cordel et des rendus contrastés adaptés aux écrans extérieurs.
  - Ajuster les variables graphiques sémantiques (coins asymétriques, épaisseur des bordures encre noire).
  - Définir le thème appliqué par défaut aux nouveaux membres connectés.
- **Badge nécessaire :** Clé `config` ou `config-layout` (Mots-clés : `config`, `admin`, `bureau`).
- **Engagement estimé :** Ponctuel.

### 🔹 Onglet : Inscription & Profils (id: `config-profile`)
- **À quoi ça sert :** Personnalisation des champs de renseignement demandés aux membres lors de leur adhésion ou de la mise à jour de leur profil.
- **Ce qu'on y fait :**
  - Ajouter des questions sur-mesure (ex: "Possédez-vous le permis remorque ?", "Régime alimentaire pour les tournées", "Profession / Compétences bénévoles").
  - Définir si chaque champ est obligatoire ou facultatif à l'inscription.
  - Réorganiser l'ordre d'affichage des rubriques du formulaire d'inscription.
- **Badge nécessaire :** Clé `config` ou `config-profile` (Mots-clés : `config`, `secrétaire`, `admin`).
- **Engagement estimé :** Annuel (en amont de la campagne d'inscription de septembre).

### 🔹 Onglet : Modules & Fonctionnalités (id: `config-modules`)
- **À quoi ça sert :** Interrupteurs généraux permettant d'activer ou de mettre en sommeil des pôles entiers selon la taille et l'activité de l'association.
- **Ce qu'on y fait :**
  - Activer ou désactiver les pôles métiers non utilisés (ex: désactiver la Lutherie ou la Vitrine si le groupe ne souhaite pas s'en servir).
  - Alléger et épurer instantanément la barre de navigation pour l'ensemble des adhérents.
  - Réactiver un pôle à tout moment dès que le projet associatif évolue sans perte de données.
- **Badge nécessaire :** Clé `config` ou `config-modules` (Rôles `admin`, `super-admin`, `isSystemAdmin`).
- **Engagement estimé :** Ponctuel (calibrage initial ou révision annuelle de projet).

---

## 🛠️ Administration Système & Accès Transverses (Hors Pôles)

> Ces modules fondamentaux sont situés à la racine de l'application ou accessibles depuis le pied de page pour les administrateurs généraux et responsables techniques.

### 🔹 Module : Console Système (id: `system-admin`)
- **À quoi ça sert :** Console de supervision technique, validation des comptes en attente d'adhésion, gestion multi-tenant et maintenance de la base de données Firestore.
- **Ce qu'on y fait :**
  - Valider ou refuser les demandes d'inscription de nouveaux membres en attente de rattachement.
  - Contrôler l'état des sauvegardes et la synchronisation avec le cloud Firebase.
  - Activer si nécessaire le mode d'urgence technique (« Break-Glass Mode ») pour diagnostiquer un incident bloquant.
- **Badge nécessaire :** Rôles `isSystemAdmin === true`, `super-admin`, `admin` ou `mestre`.
- **Engagement estimé :** Régulier à la rentrée (validation quotidienne des arrivants), puis veille technique mensuelle.

### 🔹 Module : Gestionnaire de Badges (id: `tag-manager`)
- **À quoi ça sert :** Atelier de création et de gestion de la taxonomie des badges associatifs, avec gestion des genres (masculin/féminin) et arborescence d'héritage.
- **Ce qu'on y fait :**
  - Créer un nouveau badge associatif (ex : *Régisseur*, *Chef de pupitre Caixa*, *Couturière*, *Membre CA*).
  - Renseigner les variantes de libellé au masculin et au féminin pour respecter l'accord grammatical dans toute l'interface.
  - Configurer l'héritage des badges (ex: un membre ayant le badge *Bureau* hérite automatiquement des droits du badge *CA*).
- **Badge nécessaire :** Rôles `admin`, `super-admin`, `isSystemAdmin` (accessible via le bouton "Gérer les badges" du Secrétariat ou de la Configuration).
- **Engagement estimé :** Ponctuel (en début de mandat du CA ou lors de la création d'une nouvelle commission).

---

## 📊 Matrice Synthétique de Répartition pour le CA

Pour faciliter la prise de décision lors de la séance du Conseil d'Administration, voici la recommandation type de répartition des badges et périmètres :

| Rôle au sein du CA / Bureau | Badges Recommandés | Pôles Débloqués par Défaut | Fréquence d'Engagement |
| :--- | :--- | :--- | :--- |
| **Président(e) / Co-Présidence** | `Président`, `Bureau`, `CA` | Accès étendu (Secrétariat, Diffusion, Config, Vitrine, Dashboard) | Hebdomadaire |
| **Secrétaire Général(e)** | `Secrétaire`, `Bureau`, `CA` | Secrétariat complet, Annuaire, Réunions, Registre des dates, Config | Très régulier (rentrée & réunions) |
| **Trésorier(e) / Finances** | `Trésorier`, `Bureau`, `CA` | Trésorerie complète, Cotisations, Bilan événements, Frais KM | Hebdomadaire (rentrée) puis mensuel |
| **Direction Artistique / Mestre** | `Mestre`, `Direction Artistique` | Mestria, Pédagogie, Séquenceur, Plans de scène, Convocations | Quotidien à hebdomadaire |
| **Régie Matériel & Transport** | `Régisseur`, `Logistique` | Logistique complète, Inventaire instruments, Convois covoiturage | Bimensuel & à chaque concert |
| **Atelier Lutherie** | `Luthier`, `Maître d'atelier` | Lutherie complète, Chantiers, Pièces, Fiches suiveuses | Lors des sessions d'atelier |
| **Costumerie & Textile** | `Costumière`, `Costumier` | Costumerie complète, Établi couture, Patrons, Mensurations | Périodes de confection & sorties |
| **Communication & Médias** | `Communication`, `Studio` | Studio complet, Réseaux sociaux, Newsletter, Varal Photos | Hebdomadaire |
| **Booking & Diffusion** | `Diffusion`, `Booking` | Diffusion complète, Pipeline des prestations, Carnet CRM | Continu toute l'année |
| **Site Web & Vitrine** | `Webmaster`, `Vitrine` | Vitrine complète (SEO, Textes, Fiche technique, Thème) | Ponctuel & après chaque prestation |
| **Administrateurs CA (sans portefeuille)** | `CA`, `Conseil d'administration` | Salon privé du CA, Procès-verbaux de réunion, Bilans statutaires | Mensuel (réunions de CA) |
| **Simple Adhérent / Musicien** | `Membre` (ou aucun badge) | Socle Espace Personnel (Profil, Agenda, Partitions, Trombi) | Hebdomadaire (répétitions) |

---

## 🚀 Recommandations pour l'Animation de la Réunion du CA

1. **Tour de table des compétences et affinités :** Présentez les pôles par grand domaine d'intérêt (Scène, Finances, Atelier pratique, Relations extérieures).
2. **Binômes recommandés :** Il est fortement conseillé d'associer un administrateur titulaire et un suppléant par pôle (ex: 2 personnes sur la Diffusion, 2 personnes sur la Logistique) pour assurer la continuité en cas d'absence.
3. **Attribution immédiate :** Dès l'accord validé en séance, le Secrétaire ou l'Administrateur peut distribuer les badges correspondants dans le module **Gestionnaire de Badges**. L'accès des administrateurs est instantané dès leur prochaine connexion.
