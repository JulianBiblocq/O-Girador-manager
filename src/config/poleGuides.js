/**
 * Point d'entrée centralisé (barrel < 80 lignes) des guides contextuels bilingues (FR / PT-BR)
 * des pôles et onglets dans Organizador.
 */

import { EXCLUDED_MEMBER_KEYS, resolveLocalizedGuideText, resolveLocalizedGuideSteps } from './pole-guides/guideHelpers.js';
import { memberSpaceGuides } from './pole-guides/memberSpaceGuides.js';
import { agendaGuide } from './pole-guides/agendaGuide.js';
import { forumGuide } from './pole-guides/forumGuide.js';
import { pedagogyGuide } from './pole-guides/pedagogyDoubleGuide.js';
import { pedagogyTabsGuides } from './pole-guides/pedagogyTabsGuides.js';
import { mestreGuides } from './pole-guides/mestreGuides.js';
import { gouvernanceGuides } from './pole-guides/gouvernanceGuides.js';
import { secretariatGuide } from './pole-guides/secretariatDoubleGuide.js';
import { secretariatAndDiffusionGuides } from './pole-guides/secretariatAndDiffusionGuides.js';
import { treasuryGuide } from './pole-guides/treasuryDoubleGuide.js';
import { treasuryTabsGuides } from './pole-guides/treasuryTabsGuides.js';
import { logisticsGuide } from './pole-guides/logisticsDoubleGuide.js';
import { logisticsTabsGuides } from './pole-guides/logisticsTabsGuides.js';
import { lutherieGuidesPart1 } from './pole-guides/lutherieGuidesPart1.js';
import { lutherieGuidesPart2 } from './pole-guides/lutherieGuidesPart2.js';
import { costumerieGuidesPart1 } from './pole-guides/costumerieGuidesPart1.js';
import { costumerieGuidesPart2 } from './pole-guides/costumerieGuidesPart2.js';
import { studioGuide } from './pole-guides/studioDoubleGuide.js';
import { studioTabsGuides } from './pole-guides/studioTabsGuides.js';
import { vitrineGuidesPart1 } from './pole-guides/vitrineGuidesPart1.js';
import { vitrineGuidesPart2 } from './pole-guides/vitrineGuidesPart2.js';
import { configGuidesPart1 } from './pole-guides/configGuidesPart1.js';
import { configGuidesPart2 } from './pole-guides/configGuidesPart2.js';

export {
  EXCLUDED_MEMBER_KEYS, resolveLocalizedGuideText, resolveLocalizedGuideSteps,
  agendaGuide, pedagogyGuide, logisticsGuide, forumGuide, treasuryGuide, secretariatGuide, studioGuide
};

export const POLE_GUIDES = {
  agenda: agendaGuide,
  repertoire: pedagogyGuide,
  pedagogy: pedagogyGuide,
  pedagogie: pedagogyGuide,
  forum: forumGuide,
  'porte-voix': forumGuide,
  ...memberSpaceGuides,
  ...pedagogyTabsGuides,
  ...mestreGuides,
  ...gouvernanceGuides,
  'activity-reports': gouvernanceGuides['ca-reports'],
  'secretariat-reports': gouvernanceGuides['ca-reports'],
  secretariat: secretariatGuide,
  ...secretariatAndDiffusionGuides,
  treasury: treasuryGuide,
  tresorerie: treasuryGuide,
  ...treasuryTabsGuides,
  logistics: logisticsGuide,
  logistique: logisticsGuide,
  ...logisticsTabsGuides,
  ...lutherieGuidesPart1,
  ...lutherieGuidesPart2,
  ...costumerieGuidesPart1,
  ...costumerieGuidesPart2,
  studio: studioGuide,
  communication: studioGuide,
  ...studioTabsGuides,
  ...vitrineGuidesPart1,
  ...vitrineGuidesPart2,
  ...configGuidesPart1,
  ...configGuidesPart2
};

/**
 * Résout le guide bilingue d'un onglet (`tabId`) avec repli sur le pôle (`poleId`),
 * en excluant strictement les vues membres simples sans bannière.
 */
export function getPoleGuide(tabId, poleId) {
  if (tabId && POLE_GUIDES[tabId]) return POLE_GUIDES[tabId];
  if (tabId && EXCLUDED_MEMBER_KEYS.has(tabId)) return null;
  if (poleId && POLE_GUIDES[poleId] && !EXCLUDED_MEMBER_KEYS.has(poleId)) return POLE_GUIDES[poleId];
  return null;
}
