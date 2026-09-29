/**
 * Test de validation automatisé : Ruban défilant responsive pour les sous-onglets horizontaux (Mobile & Tablette)
 * 
 * Vérifie :
 * 1. Présence et configuration du hook useTabRibbonAutoScroll (scrollIntoView centré).
 * 2. Présence et configuration du composant HorizontalTabRibbon (HorizontalRibbonContainer, RibbonTabButton).
 * 3. Présence du dégradé fade avec pointer-events-none strict.
 * 4. Définition des classes .scrollbar-none et .no-scrollbar dans src/index.css.
 * 5. Intégration dans LayoutShell.jsx (pr-8, min-h-[40px], px-3.5 py-1.5 text-sm, shrink-0 whitespace-nowrap, data-tab-active, sticky).
 * 6. Intégration dans AssociationSettings.jsx (retrait du flex-wrap, intégration HorizontalRibbonContainer, touch targets >= 40px).
 * 7. Intégration dans GigsPipelineManager.jsx, InventoryManager.jsx, WardrobeManager.jsx.
 */

import assert from 'assert';
import fs from 'fs';

console.log("✂️ TEST SUITE : RUBAN DÉFILANT RESPONSIVE POUR LES SOUS-ONGLETS (MOBILE & TABLETTE) ✂️\n");

// 1. Hook useTabRibbonAutoScroll
console.log("▶️ Test 1 : Vérification du hook useTabRibbonAutoScroll...");
assert(fs.existsSync('src/hooks/useTabRibbonAutoScroll.js'), "useTabRibbonAutoScroll.js doit exister");
const hookCode = fs.readFileSync('src/hooks/useTabRibbonAutoScroll.js', 'utf8');
assert(hookCode.includes('scrollIntoView'), "Le hook doit appeler scrollIntoView");
assert(hookCode.includes("behavior: 'smooth'"), "L'alignement doit être 'smooth'");
assert(hookCode.includes("inline: 'center'"), "L'alignement inline doit être 'center'");
assert(hookCode.includes('[data-tab-active="true"]'), "Le hook doit cibler l'onglet actif via data-tab-active");
console.log("✅ Test 1 validé : Hook d'auto-scroll centré conforme.\n");

// 2. Composant HorizontalTabRibbon
console.log("▶️ Test 2 : Vérification du composant HorizontalTabRibbon...");
assert(fs.existsSync('src/components/navigation/HorizontalTabRibbon.jsx'), "HorizontalTabRibbon.jsx doit exister");
const compCode = fs.readFileSync('src/components/navigation/HorizontalTabRibbon.jsx', 'utf8');
assert(compCode.includes('export function HorizontalRibbonContainer'), "HorizontalRibbonContainer doit être exporté");
assert(compCode.includes('overflow-x-auto'), "Le conteneur doit avoir overflow-x-auto");
assert(compCode.includes('flex-nowrap'), "Le conteneur doit avoir flex-nowrap");
assert(compCode.includes('scroll-smooth'), "Le conteneur doit avoir scroll-smooth");
assert(compCode.includes('pr-8'), "Le conteneur doit comporter le dégagement de sécurité pr-8");
assert(compCode.includes('pointer-events-none'), "Le dégradé indicateur doit impérativement avoir pointer-events-none");
assert(compCode.includes('min-h-[40px]'), "Les boutons doivent avoir une hauteur minimale touch-target >= 40px");
console.log("✅ Test 2 validé : HorizontalTabRibbon et HorizontalRibbonContainer conformes.\n");

// 3. Styles CSS scrollbar-none dans index.css
console.log("▶️ Test 3 : Vérification des styles CSS dans src/index.css...");
const indexCss = fs.readFileSync('src/index.css', 'utf8');
assert(indexCss.includes('.scrollbar-none'), "index.css doit déclarer .scrollbar-none");
assert(indexCss.includes('.no-scrollbar'), "index.css doit déclarer .no-scrollbar");
assert(indexCss.includes('scrollbar-width: none'), "index.css doit masquer la scrollbar via scrollbar-width: none");
console.log("✅ Test 3 validé : Classes de masquage de la barre de défilement déclarées.\n");

// 4. Intégration dans LayoutShell.jsx
console.log("▶️ Test 4 : Vérification de LayoutShell.jsx...");
const layoutCode = fs.readFileSync('src/components/LayoutShell.jsx', 'utf8');
assert(layoutCode.includes('HorizontalRibbonContainer'), "LayoutShell doit utiliser HorizontalRibbonContainer");
assert(layoutCode.includes('min-h-[40px]'), "LayoutShell doit appliquer min-h-[40px] sur les boutons d'onglets");
assert(layoutCode.includes('px-3.5 py-1.5 text-sm'), "LayoutShell doit appliquer px-3.5 py-1.5 text-sm");
assert(layoutCode.includes('shrink-0 whitespace-nowrap'), "LayoutShell doit appliquer shrink-0 whitespace-nowrap");
assert(layoutCode.includes('data-tab-active'), "LayoutShell doit renseigner data-tab-active");
assert(layoutCode.includes('sticky top-0 z-20'), "L'en-tête de pôle dans LayoutShell doit être sticky top-0 z-20");
console.log("✅ Test 4 validé : Ruban défilant intégré dans LayoutShell.jsx.\n");

// 5. Intégration dans AssociationSettings.jsx
console.log("▶️ Test 5 : Vérification de AssociationSettings.jsx...");
const settingsCode = fs.readFileSync('src/components/AssociationSettings.jsx', 'utf8');
assert(settingsCode.includes('HorizontalRibbonContainer'), "AssociationSettings doit utiliser HorizontalRibbonContainer");
assert(!settingsCode.includes('flex flex-wrap gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-1 select-none'), "Le flex-wrap initial doit avoir été supprimé");
assert(settingsCode.includes('min-h-[40px]'), "AssociationSettings doit appliquer min-h-[40px] sur les boutons d'onglets");
assert(settingsCode.includes('data-tab-active'), "AssociationSettings doit renseigner data-tab-active");
console.log("✅ Test 5 validé : Ruban défilant intégré dans AssociationSettings.jsx.\n");

// 6. Intégration dans GigsPipelineManager.jsx, InventoryManager.jsx, WardrobeManager.jsx
console.log("▶️ Test 6 : Vérification des autres gestionnaires de pôles...");
const gigsCode = fs.readFileSync('src/components/diffusion/GigsPipelineManager.jsx', 'utf8');
assert(gigsCode.includes('HorizontalRibbonContainer'), "GigsPipelineManager doit utiliser HorizontalRibbonContainer");
assert(gigsCode.includes('min-h-[40px]'), "GigsPipelineManager doit appliquer min-h-[40px]");

const invCode = fs.readFileSync('src/components/InventoryManager.jsx', 'utf8');
assert(invCode.includes('HorizontalRibbonContainer'), "InventoryManager doit utiliser HorizontalRibbonContainer");
assert(invCode.includes('min-h-[40px]'), "InventoryManager doit appliquer min-h-[40px]");

const wardCode = fs.readFileSync('src/components/mestre/WardrobeManager.jsx', 'utf8');
assert(wardCode.includes('HorizontalRibbonContainer'), "WardrobeManager doit utiliser HorizontalRibbonContainer");
assert(wardCode.includes('min-h-[40px]'), "WardrobeManager doit appliquer min-h-[40px]");
console.log("✅ Test 6 validé : Ruban défilant intégré dans tous les gestionnaires ciblés.\n");

// 7. Passage en multiligne sur PC (Desktop flex-wrap)
console.log("▶️ Test 7 : Vérification du comportement responsive multiligne (PC) et défilement (Mobile)...");
assert(compCode.includes('lg:flex-wrap'), "HorizontalRibbonContainer doit comporter lg:flex-wrap pour le passage à la ligne sur PC");
assert(compCode.includes('lg:overflow-visible'), "HorizontalRibbonContainer doit comporter lg:overflow-visible pour ne pas tronquer la 2e ligne sur PC");
assert(compCode.includes('gap-x-2 gap-y-2'), "HorizontalRibbonContainer doit appliquer un espacement régulier gap-x-2 gap-y-2");
assert(compCode.includes('lg:hidden'), "Le dégradé indicateur fade doit être masqué sur desktop (lg:hidden)");
assert(layoutCode.includes('lg:overflow-visible'), "LayoutShell doit comporter lg:overflow-visible sur le conteneur des sous-onglets");
assert(layoutCode.includes('self-start pt-2'), "LayoutShell doit aligner les utilitaires en self-start pt-2 pour éviter tout chevauchement");
console.log("✅ Test 7 validé : Multiligne sur PC (lg:flex-wrap) et défilement mobile préservés avec succès.\n");

console.log("===============================================================");
console.log("🏆 TOUS LES TESTS DU RUBAN DÉFILANT HORIZONTAL SONT VALIDÉS !");
console.log("===============================================================");
