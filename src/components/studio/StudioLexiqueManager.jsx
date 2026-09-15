import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  DEFAULT_STUDIO_MENTIONS_OBJECTS,
  DEFAULT_STUDIO_EQUIVALENCES,
  DEFAULT_STUDIO_HASHTAGS
} from '../../config/studioSocialConfig';
import MentionsSection from './lexique/MentionsSection';
import VocabSection from './lexique/VocabSection';
import HashtagsSection from './lexique/HashtagsSection';
import CordelButton from '../CordelButton';

/**
 * Composant principal StudioLexiqueManager (Pôle Studio > Onglet Lexique) :
 * Administre de manière centralisée le carnet de mentions (@comptes),
 * le guide d'équivalences culturelles et les hashtags récurrents de l'association.
 *
 * @param {Object} props
 * @param {string} props.groupId Identifiant de l'association courante
 * @param {Function} [props.onBack] Callback de retour au pôle ou à la vue précédente
 * @param {Function} [props.onNavigateToView] Callback de redirection vers un autre onglet
 */
export default function StudioLexiqueManager({
  groupId,
  onBack,
  onNavigateToView
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // États locaux synchronisés avec Firestore
  const [mentions, setMentions] = useState(DEFAULT_STUDIO_MENTIONS_OBJECTS);
  const [equivalences, setEquivalences] = useState(DEFAULT_STUDIO_EQUIVALENCES);
  const [hashtags, setHashtags] = useState(DEFAULT_STUDIO_HASHTAGS);

  // Affiche un message de rétroaction temporaire
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 1. Écoute en temps réel des données Firestore
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(
      assocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const config = data.studioLexiqueConfig || {};

          // Chargement des mentions (avec repli sur constantes)
          if (Array.isArray(config.mentions) && config.mentions.length > 0) {
            setMentions(config.mentions);
          } else if (Array.isArray(data.studioMentions) && data.studioMentions.length > 0) {
            // Conversion éventuelle d'anciennes mentions textuelles simples
            const converted = data.studioMentions.map((m, idx) =>
              typeof m === 'string'
                ? { id: `legacy-${idx}`, label: m.replace(/^@+/, ''), handle: m.startsWith('@') ? m : `@${m}` }
                : m
            );
            setMentions(converted);
          } else {
            setMentions(DEFAULT_STUDIO_MENTIONS_OBJECTS);
          }

          // Chargement des équivalences culturelles (avec repli)
          if (Array.isArray(config.equivalences) && config.equivalences.length > 0) {
            setEquivalences(config.equivalences);
          } else {
            setEquivalences(DEFAULT_STUDIO_EQUIVALENCES);
          }

          // Chargement des hashtags (avec repli sur tags existants ou constantes)
          if (Array.isArray(config.hashtags) && config.hashtags.length > 0) {
            setHashtags(config.hashtags);
          } else if (Array.isArray(data.studioSocialTags) && data.studioSocialTags.length > 0) {
            setHashtags(data.studioSocialTags);
          } else {
            setHashtags(DEFAULT_STUDIO_HASHTAGS);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error("StudioLexiqueManager - Erreur snapshot Firestore :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // 2. Persistance atomique globale dans Firestore
  const persistConfig = async (newMentions, newEquivalences, newHashtags) => {
    if (!groupId) return;
    setSaving(true);

    try {
      const assocRef = doc(db, 'associations', groupId);

      // Extraire les listes dérivées pour rétrocompatibilité avec StudioSocial
      const activeChips = newEquivalences
        .filter((eq) => eq.activeChip !== false)
        .map((eq) => eq.preferred || eq.recommande)
        .filter(Boolean);

      const mentionHandles = newMentions.map((m) => m.handle).filter(Boolean);

      await setDoc(
        assocRef,
        {
          studioLexiqueConfig: {
            mentions: newMentions,
            equivalences: newEquivalences,
            hashtags: newHashtags,
            updatedAt: new Date().toISOString()
          },
          // Champs de rétrocompatibilité synchronisés
          studioSocialTags: newHashtags,
          studioLexique: activeChips,
          studioMentions: mentionHandles
        },
        { merge: true }
      );

      showToast("Modifications enregistrées avec succès !");
    } catch (error) {
      console.error("StudioLexiqueManager - Erreur enregistrement :", error);
      showToast("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Handlers spécifiques pour chaque section
  const handleSaveMentions = (updatedMentions) => {
    setMentions(updatedMentions);
    persistConfig(updatedMentions, equivalences, hashtags);
  };

  const handleSaveEquivalences = (updatedEquivalences) => {
    setEquivalences(updatedEquivalences);
    persistConfig(mentions, updatedEquivalences, hashtags);
  };

  const handleSaveHashtags = (updatedHashtags) => {
    setHashtags(updatedHashtags);
    persistConfig(mentions, equivalences, updatedHashtags);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="animate-spin text-3xl select-none">⏳</div>
        <p className="font-semibold text-xs uppercase tracking-widest text-cordel-master-dark opacity-60">
          Chargement du lexique et des mentions...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left max-w-5xl mx-auto w-full pb-10">
      {/* En-tête Cordel avec fil d'ariane et actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dashed border-cordel-master-dark/30">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cordel-master-dark uppercase tracking-wider mb-1">
            <span>Studio</span>
            <span>›</span>
            <span className="text-[var(--color-cordel-vert)] dark:text-emerald-400">Lexique & Carnet Social</span>
          </div>
          <h2 className="text-xl font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>📖</span> Lexique, Mentions & Hashtags
          </h2>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Gérez le vocabulaire recommandé, le carnet de mentions (@comptes) et les hashtags officiels du Studio Social.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {saving && (
            <span className="text-xs font-bold text-amber-800 animate-pulse flex items-center gap-1">
              <span>⏳</span> Sauvegarde...
            </span>
          )}

          {toastMessage && (
            <span className="text-xs font-bold text-[var(--color-cordel-vert)] bg-emerald-50 px-2 py-1 rounded border border-emerald-300 animate-fade-in">
              ✅ {toastMessage}
            </span>
          )}

          {onNavigateToView && (
            <button
              type="button"
              onClick={() => onNavigateToView('studio-social')}
              className="px-3 py-1.5 rounded text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-800/30 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>📱</span> Ouvrir le Studio Social
            </button>
          )}

          {onBack && (
            <CordelButton
              type="button"
              onClick={onBack}
              className="text-xs font-bold"
            >
              ⬅️ Retour
            </CordelButton>
          )}
        </div>
      </div>

      {/* 1. Section Mentions (@) */}
      <MentionsSection
        mentions={mentions}
        onSaveMentions={handleSaveMentions}
        disabled={saving}
      />

      {/* 2. Section Vocabulaire & Guide culturel */}
      <VocabSection
        equivalences={equivalences}
        onSaveEquivalences={handleSaveEquivalences}
        disabled={saving}
      />

      {/* 3. Section Hashtags par défaut */}
      <HashtagsSection
        hashtags={hashtags}
        onSaveHashtags={handleSaveHashtags}
        disabled={saving}
      />
    </div>
  );
}
