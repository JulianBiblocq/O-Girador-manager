# Architecture Multi-Univers — Registre de Découplage & Guide de Modularisation

> **Document de référence architectural**  
> Ce registre recense au fil de l'eau l'ensemble des éléments spécifiques à la tradition du **Maracatu Baque Virado** ancrés dans la base de code, afin de guider leur dissociation progressive vers une plateforme multi-univers (*.maracatu*, *.capoeira*, *.sambareggae*, *.samba*).

---

## 🎯 1. Vision et Objectifs

L'application **O-Girador / Organizador** est née avec et pour le **Maracatu de Baque Virado** (percussions traditionnelles du Pernambouc, littérature de cordel, cour royale).  
L'objectif stratégique est d'en faire un **moteur associatif universel pour les arts, danses et musiques traditionnelles afro-brésiliennes** tout en conservant une authenticité culturelle totale pour chaque discipline.

### Les 4 Univers Cibles :
1. **Maracatu (`maracatu`)** : Alfaias, Caixas, Gonguê, Agbê, Mineiro, Toadas, Cortejo royal, Thème Cordel / Xylographie.
2. **Capoeira (`capoeira`)** : Berimbaus (Gunga, Médio, Viola), Pandeiro, Atabaque, Agogô, Ladainhas, Rodas, Batizados & Graduations/Cordas, Thème Biriba / Roda.
3. **Samba-Reggae / Bloco Afro (`sambareggae`)** : Surdos (Fundo, Resposta, Dobra), Repique, Timbal, Caixas, Défilés de Carnaval, Thème Afro-Bahianais / Axé.
4. **Samba traditionnel / Bateria (`samba`)** : Surdos 1/2/3, Caixas de guerra, Tamborim, Repinique, Cuíca, Agogô, Chocalho, Enredos, Bateria, Thème Pavillon / Bicolore.

---

## 🏛️ 2. Les 4 Piliers d'Isolation

Pour passer d'un univers à l'autre sans dupliquer le code ni créer de régressions, nous isolons 4 couches bien distinctes :

```
┌─────────────────────────────────────────────────────────────┐
│ 1. COUCHE ORGANOLOGIQUE (Nomenclature, Rôles & Sons)        │
│    -> Presets de tambours, voix audio, registre, tessiture  │
├─────────────────────────────────────────────────────────────┤
│ 2. COUCHE SÉMANTIQUE (Vocabulaire & Locales)                │
│    -> Toada vs Ladainha vs Enredo / Cortejo vs Roda         │
├─────────────────────────────────────────────────────────────┤
│ 3. COUCHE VISUELLE & THÈMES (Tokens CSS Sémantiques)        │
│    -> Cordel (Bois/Papier) vs Capoeira vs Bloco Afro        │
├─────────────────────────────────────────────────────────────┤
│ 4. COUCHE FONCTIONNELLE (Modules Optionnels par Univers)    │
│    -> Costumerie royale vs Graduations/Cordas               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🥁 3. Pilier 1 : Nomenclature & Instruments

### État actuel
Une abstraction est déjà amorcée dans [`src/constants/nomenclature.js`](file:///src/constants/nomenclature.js) et [`src/hooks/useGroupNomenclature.js`](file:///src/hooks/useGroupNomenclature.js) avec la fonction `normalizeGroupNomenclature(rawNomenclature, style)`.

### Registre des éléments spécifiques Maracatu :
| Clé interne / Rôle | Libellé Maracatu par défaut | Équivalent Capoeira | Équivalent Samba-Reggae | Équivalent Samba |
| :--- | :--- | :--- | :--- | :--- |
| `alfaia_grave` | **Marcante** | Berimbau Gunga | Surdo 1 (Fundo) | Surdo de Primeira |
| `alfaia_medio` | **Meião** | Berimbau Médio | Surdo 2 (Resposta) | Surdo de Segunda |
| `alfaia_agudo` | **Repique** | Berimbau Viola | Surdo 3 (Dobra / Corte) | Surdo de Terceira |
| `caixa_baixo` | **Caixa** | Pandeiro 1 | Caixa | Caixa de Guerra |
| `caixa_alto` | **Tarol** | Pandeiro 2 | Repique | Tarol / Repinique |
| `gongue` | **Gonguê** | Agogô de ferro | Agogô | Agogô (2/4 cloches) |
| `agbe` | **Agbê / Abê** | Atabaque | Timbal | Chocalho / Ganza |
| `mineiro` | **Mineiro** | Reco-reco | Shaker / Mineiro | Tamborim |
| `timbal` | **Timbal** | - | Timbal bahianais | Cuíca |
| `apito` | **Apito** | Rythme du Berimbau Gunga | Apito de Mestre | Apito de Mestre |
| `puxador` | **Puxador** | Cantador | Puxador / Chanteur | Intérprete / Puxador |
| `coro` | **Coro** | Resposta da Roda / Coro | Coro | Coro de Bateria |
| `toada` | **Toada** | Ladainha / Chula / Corrido | Samba-Reggae | Samba-Enredo |

### Fichiers impactés à découpler :
* [`src/constants/nomenclature.js`](file:///src/constants/nomenclature.js) : Extraire les listes dans des dictionnaires distincts (`MARACATU_NOMENCLATURE`, `CAPOEIRA_NOMENCLATURE`, etc.).
* [`src/components/association-settings/TabTambours.jsx`](file:///src/components/association-settings/TabTambours.jsx) : Doit devenir "Instruments & Pupitres" selon l'univers actif.
* [`src/data/distractorPool.js`](file:///src/data/distractorPool.js) : Proposer des distracteurs spécifiques à la discipline pour les quiz.

---

## 📜 4. Pilier 2 : Vocabulaire Métier & Sémantique

### Registre des termes à contextualiser :
| Terme Maracatu actuel | Clé de traduction cible | Équivalent Capoeira | Équivalent Samba-Reggae / Samba |
| :--- | :--- | :--- | :--- |
| **Toada** (chant) | `culture.pieceLabel` | **Ladainha / Chant** | **Morceau / Enredo** |
| **Toadas** (pluriel) | `culture.piecesLabel` | **Chants & Toques** | **Morceaux / Répertoire** |
| **Cortejo** (défilé) | `events.paradeLabel` | **Roda** | **Desfile / Carnaval** |
| **Batuqueiro** (joueur) | `roles.playerLabel` | **Capoeirista / Jogador** | **Ritmista** |
| **Mestre** | `roles.leaderLabel` | **Mestre / Professor** | **Mestre de Bateria** |
| **Baque** (rythme) | `culture.rhythmLabel` | **Toque (São Bento, Angola...)** | **Levada** |
| **Calunga & Cour** | Spécifique Maracatu | *(Désactivé)* | *(Désactivé)* |

### Fichiers impactés à découpler :
* [`src/locales/fr.js`](file:///src/locales/fr.js) & [`src/locales/pt.js`](file:///src/locales/pt.js) : Découper les sections vocabulaires ou injecter des surcharges sémantiques par univers (`locales/disciplines/maracatu.js`, etc.).
* [`src/components/documents/varal/VaralCategoryRope.jsx`](file:///src/components/documents/varal/VaralCategoryRope.jsx) : Le filtre "Culture" actuel propose des icônes Maracatu (Orixás, Cortejo royal, Folklore pernamboucain). Rendre ces filtres configurables par discipline.
* [`src/components/student/StudentToadasProgress.jsx`](file:///src/components/student/StudentToadasProgress.jsx) : Renommer génériquement en `StudentRepertoireProgress.jsx` ou adapter le titre.

---

## 🎨 5. Pilier 3 : Thèmes Visuels & Identité Graphique

Conformément à la règle d'or du projet (`.agents/AGENTS.md` - Règle 2 : Architecture Multi-Thèmes) :
> **Zéro style inline thématique** : Toutes les propriétés visuelles doivent reposer sur des variables CSS sémantiques.

### Thèmes par univers :
1. **Thème "Cordel" (`theme-cordel`) — Maracatu**
   * Esthétique : Xylogravure, typographie gravée sur bois (`Cactus Classical Serif`), papier ambré chiffonné, cordes de chanvre torsadées (`VaralRopeSVG`), pinces à linge en bois, timbres encre noire et terre cuite.
2. **Thème "Biriba" (`theme-capoeira`) — Capoeira**
   * Esthétique : Bois de biriba chaud, blanc d'abadá cassé, textures arène/terre battue, motifs géométriques circulaires (la ronde de la Roda), badges en forme de cordas tressées.
3. **Thème "Axé Panafricain" (`theme-sambareggae`) — Samba-Reggae**
   * Esthétique : Couleurs vives rouge / or ambré / vert émeraude / noir encre, motifs géométriques afro inspirés d'Olodum et Ilê Aiyê.
4. **Thème "Passarela" (`theme-samba`) — Samba**
   * Esthétique : Velours profond, dorures, bicolore dynamique personnalisable aux 2 couleurs de l'école (ex. Vert & Rose pour Mangueira, Bleu & Blanc pour Portela).

### Fichiers clés :
* [`src/index.css`](file:///src/index.css) : Domicile des tokens CSS variables (`--cordel-bg`, `--cordel-wood`, `--cordel-border-width`, etc.). Définir les palettes sous `[data-discipline="maracatu"]`, `[data-discipline="capoeira"]`.
* [`src/components/documents/varal/VaralRopeSVG.jsx`](file:///src/components/documents/varal/VaralRopeSVG.jsx) : Remplacer ou moduler le visuel de corde en chanvre selon le thème.
* [`src/components/SeloAxeStamp.jsx`](file:///src/components/SeloAxeStamp.jsx) : Les sceaux gravés au tampon encreur peuvent varier d'emblème.

---

## 🧩 6. Pilier 4 : Modules Spécifiques par Discipline

Toutes les disciplines partagent le **socle commun associatif** :
* 📂 Varal Documentaire & Pédagogique
* 💰 Trésorerie, Facturation & Notes de frais
* 📅 Événements, Convocations, Présences & Covoiturage
* 🎪 Régie & Diffusion (contrats de spectacle, devis de prestation)
* 💬 Forum associatif & Porte-voix
* 📦 Inventaire logistique & Matériel

### Modules spécialisés à conditionner :
* **Module "Costumerie / Calunga"** (Maracatu uniquement) :
  * [`src/components/profile/AtelierCouture.jsx`](file:///src/components/profile/AtelierCouture.jsx)
  * Modèles de patrons de robes de cour royale, fiches personnages.
* **Module "Atelier Lutherie"** :
  * Actuellement configuré pour les gabarits d'Alfaia et Gonguê (`alfaia_update.json`).
  * Adaptable pour la fabrication de Berimbaus et montage de cuirs d'Atabaques en Capoeira.
### 6.1 Focus Découplage : Panneau Système & Gestion des Membres (`SystemUserList`)

L'écran d'administration système des membres ([`SystemUserList.jsx`](file:///src/components/admin/SystemUserList.jsx)) concentre plusieurs notions à contextualiser selon l'univers actif :

| Élément Système actuel | Maracatu (Actuel) | Capoeira (Cible) | Samba / Bateria (Cible) | Bloco Afro / Samba-Reggae |
| :--- | :--- | :--- | :--- | :--- |
| **Rôle Dirigeant (`role: 'mestre'`)** | **Mestre** (ou Contramestre) | **Mestre / Professor** | **Mestre de Bateria / Président** | **Maestro / Mestre** |
| **Pupitre / Instrument principal** | Alfaia, Caixa, Gonguê, Agbê... | Berimbau (Gunga/Médio/Viola), Pandeiro, Atabaque | Surdo 1/2/3, Caixa, Repique, Tamborim | Surdo, Repique, Timbal, Caixas |
| **Disciplines pratiquées** | 🥁 Percussion & 💃 Danse de cour | 🥋 Roda & 🪕 Musique/Chant (Pas de danse isolée) | 🥁 Bateria & 💃 Passistas / Mestre-Sala | 🥁 Percussion & 💃 Danse Afro |
| **Niveau Musique / Progression** | Débutant / Confirmé (Custom) | **Corda / Système de Ceintures** de l'école | Ritmista en apprentissage / Ritmista de défilé | Apprenant / Bloco officiel |
| **Niveau Danse** | Débutant / Confirmé (Custom) | *(Masqué ou remplacé par niveau corporel/acrobatie)* | Passista débutant / Ala / Destaque | Danse Afro initié / Corps de ballet |
| **Droits d'écriture Mestre** | Séquenciador / Dançador / Orchestrador | Séquenceur de Toques / Organisateur de Rodas | Séquenceur de Bateria / Conducteur d'Enredo | Séquenciador / Chorégraphe de rue |

#### Directives architecturales pour la page Système :
1. **Conditionnement dynamique de la Danse** : Si l'univers actif est `capoeira`, désactiver l'affichage des sélecteurs de danse pour afficher à la place le **sélecteur de Corda** (graduation de l'école).
2. **Libellé sémantique du rôle Mestre** : Laisser l'identifiant technique `mestre` en base de données, mais faire passer l'affichage du libellé par une clé i18n contextualisée (`roles.masterTitle`).
3. **Consolidation Pupitres** : Le calcul `computePupitresList(instrumentsDisponibles, linkedInstruments)` est déjà universel : il s'adapte automatiquement à n'importe quelle famille d'instruments configurée par l'association quel que soit l'univers.

---

## 📝 7. Protocole pour chaque future modification

Désormais, pour tout nouveau développement ou modification touchant un concept Maracatu :
1. **Ne jamais coder en dur** un nom d'instrument ou un terme de Maracatu directement dans un template JSX sans passer par `getVoiceLabel`, `getInstrumentLabel` ou une clé i18n sémantique.
2. **Reporter systématiquement dans ce registre** toute nouvelle particularité identifiée.
3. **Tester la neutralité** : Le composant doit continuer de fonctionner et d'avoir du sens si l'association choisit un autre preset d'instruments ou un autre univers.
