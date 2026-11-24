/**
 * Point d'entrée centralisé (barrel < 60 lignes) de l'index bilingue (FR / PT-BR)
 * de la Palette rapide Ctrl+K dans Organizador.
 */

import {
  normalizeSearchToken,
  resolveSearchText,
  resolvePoleDisplayLabel
} from './search-index/searchIndexHelpers.js';
import { memberAndForumIndex } from './search-index/memberAndForumIndex.js';
import { governanceAndSecretariatIndex } from './search-index/governanceAndSecretariatIndex.js';
import { diffusionAndLogisticsIndex } from './search-index/diffusionAndLogisticsIndex.js';
import { treasuryIndex } from './search-index/treasuryIndex.js';
import { lutherieIndex } from './search-index/lutherieIndex.js';
import { costumerieIndex } from './search-index/costumerieIndex.js';
import { studioIndex } from './search-index/studioIndex.js';
import { pedagogyAndMestreIndex } from './search-index/pedagogyAndMestreIndex.js';
import { vitrineIndex } from './search-index/vitrineIndex.js';
import { configIndex } from './search-index/configIndex.js';

export { normalizeSearchToken, resolveSearchText, resolvePoleDisplayLabel };

export const SETTINGS_INDEX = [
  ...memberAndForumIndex,
  ...governanceAndSecretariatIndex,
  ...diffusionAndLogisticsIndex,
  ...treasuryIndex,
  ...lutherieIndex,
  ...costumerieIndex,
  ...studioIndex,
  ...pedagogyAndMestreIndex,
  ...vitrineIndex,
  ...configIndex
];
