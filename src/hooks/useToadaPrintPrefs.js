// Hook centralisé de préférences et presets d'impression Toada / Carnet de chants (< 130 lignes).
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { cleanFirestorePayload } from '../utils/firestoreUtils';
import { normalizePrintMargins } from '../utils/toadaPrintMarginsUtils';
import {
  TOADA_PRINT_STORAGE_KEY, BUILTIN_TOADA_PRINT_PRESETS, DEFAULT_TOADA_PRINT_CONFIG,
  normalizePrintConfig, normalizeCustomPresets, buildPersistedToadaPrintPrefs,
  arePrintConfigsEqual, detectActiveBuiltinPreset
} from '../utils/toadaPrintPrefsUtils';

function readLocal(uid) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = (uid && localStorage.getItem(`${TOADA_PRINT_STORAGE_KEY}_${uid}`)) || localStorage.getItem(TOADA_PRINT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeLocal(uid, env) {
  if (typeof window === 'undefined') return;
  try {
    const s = JSON.stringify(cleanFirestorePayload(env, { removeNull: true }));
    localStorage.setItem(TOADA_PRINT_STORAGE_KEY, s);
    if (uid) localStorage.setItem(`${TOADA_PRINT_STORAGE_KEY}_${uid}`, s);
  } catch { /* Stockage indisponible */ }
}

export function useToadaPrintPrefs(userProfile = null) {
  const uid = userProfile?.uid || userProfile?.id || auth?.currentUser?.uid || null;
  const profilePrefs = userProfile?.toadaPrintPrefs || null;
  const hydratedRef = useRef(Boolean(profilePrefs?.defaultConfig));

  const init = useMemo(() => {
    const loc = readLocal(uid);
    const defCfg = profilePrefs?.defaultConfig ? normalizePrintConfig(profilePrefs.defaultConfig) : (loc?.defaultConfig ? normalizePrintConfig(loc.defaultConfig) : null);
    const actCfg = profilePrefs?.defaultConfig ? defCfg : (loc?.workingConfig ? normalizePrintConfig(loc.workingConfig) : (defCfg || normalizePrintConfig(DEFAULT_TOADA_PRINT_CONFIG)));
    return { actCfg, defCfg, presets: normalizeCustomPresets(profilePrefs?.customPresets ?? loc?.customPresets ?? []) };
  }, [uid, profilePrefs]);

  const [config, setConfig] = useState(init.actCfg);
  const [savedDefault, setSavedDefault] = useState(init.defCfg);
  const [customPresets, setCustomPresets] = useState(init.presets);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (profilePrefs) {
      if (profilePrefs.defaultConfig && !hydratedRef.current) {
        hydratedRef.current = true;
        setConfig(normalizePrintConfig(profilePrefs.defaultConfig));
      }
      if (profilePrefs.defaultConfig) setSavedDefault(normalizePrintConfig(profilePrefs.defaultConfig));
      if (Array.isArray(profilePrefs.customPresets)) setCustomPresets(normalizeCustomPresets(profilePrefs.customPresets));
      return undefined;
    }
    if (!uid || hydratedRef.current) return undefined;
    let active = true;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      const rem = snap.exists() ? snap.data()?.toadaPrintPrefs : null;
      if (!active || !rem) return;
      hydratedRef.current = true;
      if (rem.defaultConfig) { const d = normalizePrintConfig(rem.defaultConfig); setSavedDefault(d); setConfig(d); }
      if (Array.isArray(rem.customPresets)) setCustomPresets(normalizeCustomPresets(rem.customPresets));
    }).catch(() => {});
    return () => { active = false; };
  }, [uid, profilePrefs]);

  const applyLocal = useCallback((updater) => {
    setConfig((prev) => {
      const next = normalizePrintConfig(typeof updater === 'function' ? updater(prev) : updater);
      writeLocal(uid, { workingConfig: next, defaultConfig: savedDefault, customPresets });
      return next;
    });
  }, [uid, savedDefault, customPresets]);

  const persistRemote = useCallback(async (nextDefault, nextPresets) => {
    const payload = buildPersistedToadaPrintPrefs({ defaultConfig: nextDefault, customPresets: nextPresets });
    writeLocal(uid, { workingConfig: configRef.current, ...payload });
    if (!uid) return;
    try { await updateDoc(doc(db, 'users', uid), { toadaPrintPrefs: payload }); } catch { /* Silencieux */ }
  }, [uid]);

  const saveAsDefault = useCallback(async () => {
    const norm = normalizePrintConfig(config);
    setSavedDefault(norm);
    await persistRemote(norm, customPresets);
  }, [config, customPresets, persistRemote]);

  const saveCustomPreset = useCallback(async (rawName) => {
    const name = String(rawName || '').trim().slice(0, 24);
    if (!name || customPresets.length >= 2) return false;
    const next = normalizeCustomPresets([...customPresets, { id: `cp_${Date.now()}`, name, config }]);
    setCustomPresets(next);
    await persistRemote(savedDefault, next);
    return true;
  }, [config, customPresets, savedDefault, persistRemote]);

  const deleteCustomPreset = useCallback(async (presetId) => {
    const next = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(next);
    await persistRemote(savedDefault, next);
  }, [customPresets, savedDefault, persistRemote]);

  return {
    config, format: config.format, sections: config.sections, lyricsColumnsMode: config.lyricsColumnsMode,
    bwMode: config.bwMode, margins: config.margins, songbookOptions: config.songbookOptions, customPresets,
    activeBuiltinPreset: detectActiveBuiltinPreset(config.sections),
    isDefaultConfig: Boolean(savedDefault && arePrintConfigsEqual(config, savedDefault)),
    isSingleLanguageActive: Boolean(config.sections.original) !== Boolean(config.sections.phonetic),
    setFormat: (format) => applyLocal((p) => ({ ...p, format })),
    setBwMode: (bwMode) => applyLocal((p) => ({ ...p, bwMode: Boolean(bwMode) })),
    setLyricsColumnsMode: (lyricsColumnsMode) => applyLocal((p) => ({ ...p, lyricsColumnsMode })),
    updateMargins: (patch) => applyLocal((p) => ({ ...p, margins: normalizePrintMargins({ ...p.margins, ...(typeof patch === 'function' ? patch(p.margins) : patch) }) })),
    toggleSection: (key) => applyLocal((p) => ({ ...p, sections: { ...p.sections, [key]: !p.sections[key] } })),
    updateSongbookOptions: (patch) => applyLocal((p) => ({ ...p, songbookOptions: { ...p.songbookOptions, ...patch } })),
    applyBuiltinPreset: (id) => { const f = BUILTIN_TOADA_PRINT_PRESETS.find((p) => p.id === id); if (f) applyLocal((p) => ({ ...p, sections: { ...f.sections } })); },
    applyCustomPreset: (preset) => { if (preset?.config) applyLocal(normalizePrintConfig(preset.config)); },
    saveAsDefault, saveCustomPreset, deleteCustomPreset
  };
}

export default useToadaPrintPrefs;
