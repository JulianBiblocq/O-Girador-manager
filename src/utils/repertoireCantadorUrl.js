/**
 * repertoireCantadorUrl.js
 * Construction pure de l'URL directe Organizador (Répertoire) -> Cantador (< 40 lignes).
 */
import { getEcosystemUrl } from '../constants/ecosystemUrls.js';

export function buildRepertoireCantadorUrl({
  songId = '',
  toadaId = '',
  mode = 'eleve',
  groupId = '',
  baseUrl = '',
} = {}) {
  const base = (baseUrl || getEcosystemUrl('cantador')).replace(/\/+$/, '');
  const urlObj = new URL(`${base}/`);
  if (mode) urlObj.searchParams.set('mode', mode);
  if (toadaId) urlObj.searchParams.set('toadaId', toadaId);
  if (songId) urlObj.searchParams.set('songId', songId);
  if (groupId) urlObj.searchParams.set('groupId', groupId);
  return urlObj.toString();
}

export function resolveRepertoireVocalFlags(piece = null, toadaDoc = null, isMestreView = false) {
  const docObj = toadaDoc || piece?.activeToada || null;
  const songId = docObj?.id || piece?.toadaDocId || piece?.id || '';
  const toadaId = piece?.cantadorToadaId || docObj?.cantadorToadaId || piece?.activeCantadorPack?.id || '';
  const hasAnyVocalLink = Boolean(
    toadaId || docObj || piece?.hasToada || piece?.toadaDocId || piece?.toadaId ||
    piece?.type === 'song' || piece?.typeMorceau === 'song'
  );
  const hasScoreSource = Boolean(
    toadaId || piece?.activeCantadorPack || docObj?.rawTxtCode?.trim() || piece?.rawTxtCode?.trim()
  );
  return { songId, toadaId, hasAnyVocalLink, hasScoreSource, mode: isMestreView ? 'studio' : 'eleve' };
}
