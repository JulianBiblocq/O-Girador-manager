import React, { useState, useEffect, useMemo } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';
import VideoInstrumentCheckboxes from '../mestre/VideoInstrumentCheckboxes';
import { DEFAULT_INSTRUMENTS } from '../../hooks/useAssociationSettings';
import YouTubeVideoPickerModal from '../common/YouTubeVideoPickerModal';
import BatchAssignVideoSource from './BatchAssignVideoSource';

/**
 * Modale Cordel d'affectation par lot inversée d'une vidéo vers plusieurs morceaux (< 180 lignes).
 */
export default function BatchAssignVideoModal({
  isOpen, onClose, initialVideo = null, piecesList = [], groupId, onSuccess
}) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedPieceIds, setSelectedPieceIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setVideoUrl(initialVideo?.url || '');
    setVideoTitle(initialVideo?.titre || initialVideo?.title || '');
    setSelectedInstruments(Array.isArray(initialVideo?.instruments) ? initialVideo.instruments : []);
    setIsLive(Boolean(initialVideo?.isLiveOrGlobal));
    setSelectedPieceIds(new Set());
    setErrorMsg(null);
  }, [isOpen, initialVideo]);

  const ytMedia = useMemo(() => parseYouTubeMedia(videoUrl), [videoUrl]);
  const sortedPieces = useMemo(() => [...piecesList].sort((a, b) => (a.titre || '').localeCompare(b.titre || '')), [piecesList]);

  // Remplissage automatique lors du choix d'une vidéo dans la vidéothèque YouTube
  const handleSelectFromPicker = ({ url, title, playlistLabel }) => {
    setVideoUrl(url || '');
    if (title) setVideoTitle(title);
    if (selectedInstruments.length === 0 && !isLive && playlistLabel) {
      const plNorm = playlistLabel.toLowerCase();
      if (plNorm.includes('live') || plNorm.includes('générale') || plNorm.includes('concert') || plNorm.includes('prestation') || plNorm.includes('tous')) {
        setIsLive(true);
      } else {
        const matched = DEFAULT_INSTRUMENTS.filter((inst) => plNorm.includes(inst.toLowerCase()));
        if (matched.length > 0) setSelectedInstruments(matched);
      }
    }
  };

  if (!isOpen) return null;

  const togglePiece = (id) => setSelectedPieceIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const handleSelectAllPieces = () => setSelectedPieceIds(new Set(sortedPieces.map((p) => p.id)));
  const handleDeselectAllPieces = () => setSelectedPieceIds(new Set());

  const handleConfirmBatch = async () => {
    const trimmedUrl = videoUrl.trim();
    if (!trimmedUrl) { setErrorMsg('Veuillez renseigner une URL de vidéo valide.'); return; }
    if (selectedPieceIds.size === 0) { setErrorMsg('Veuillez cocher au moins un morceau du répertoire.'); return; }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const batch = writeBatch(db);
      const newVideoObj = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        titre: videoTitle.trim() || 'Vidéo',
        url: trimmedUrl,
        instruments: isLive ? [] : selectedInstruments,
        isLiveOrGlobal: Boolean(isLive || selectedInstruments.length === 0)
      };

      selectedPieceIds.forEach((pieceId) => {
        const piece = sortedPieces.find((p) => p.id === pieceId);
        const existing = Array.isArray(piece?.videos) ? piece.videos : [];
        const filtered = existing.filter((v) => (v.url || '').trim() !== trimmedUrl);
        batch.update(doc(db, 'associations', groupId, 'repertoire', pieceId), {
          videos: [...filtered, newVideoObj],
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      if (onSuccess) onSuccess(selectedPieceIds.size);
      onClose();
    } catch (err) {
      console.error('Erreur affectation par lot vidéo :', err);
      setErrorMsg('Erreur lors de l’enregistrement par lot.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-cordel-bg p-0 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3.5 border-b-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood">Affectation vidéo par lot</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-cordel-master-dark hover:text-cordel-wood cursor-pointer">
            <XiloClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 text-left bg-cordel-bg">
          {errorMsg && <div className="p-2.5 bg-red-100 text-red-900 border border-red-300 rounded text-xs font-bold">⚠️ {errorMsg}</div>}

          <BatchAssignVideoSource
            videoTitle={videoTitle}
            setVideoTitle={setVideoTitle}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            ytMedia={ytMedia}
            onOpenPicker={() => setIsPickerOpen(true)}
          />

          <div className="p-3 bg-white rounded border border-encre-noire/20 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-cordel-wood">1. Pupitres cibles ou Répétition générale</span>
            <VideoInstrumentCheckboxes selectedInstruments={selectedInstruments} instrumentsList={DEFAULT_INSTRUMENTS} onChange={setSelectedInstruments} isLiveOrGlobal={isLive} onToggleLive={setIsLive} />
          </div>

          <div className="p-3 bg-white rounded border border-encre-noire/20 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-dashed border-encre-noire/15 pb-1.5">
              <span className="text-[10px] font-black uppercase text-cordel-wood">2. Morceaux à affecter ({selectedPieceIds.size} / {sortedPieces.length})</span>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={handleSelectAllPieces} className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer">Tout cocher</button>
                <button type="button" onClick={handleDeselectAllPieces} className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200 cursor-pointer">Décocher tout</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
              {sortedPieces.map((piece) => {
                const isChecked = selectedPieceIds.has(piece.id);
                const hasSame = (piece.videos || []).some((v) => (v.url || '').trim() === videoUrl.trim());
                return (
                  <label key={piece.id} className={`flex items-center gap-2 p-1.5 rounded border text-xs cursor-pointer select-none ${isChecked ? 'bg-amber-100/80 border-amber-400 font-black text-amber-950' : 'bg-[#fdfaf2] border-encre-noire/15 hover:bg-white text-stone-800'}`}>
                    <input type="checkbox" checked={isChecked} onChange={() => togglePiece(piece.id)} className="accent-amber-600 w-3.5 h-3.5" />
                    <span className="truncate flex-1">{piece.titre || 'Sans titre'}</span>
                    {hasSame && <span className="text-[8px] px-1 py-0.2 rounded bg-stone-200 text-stone-600 shrink-0 font-normal">déjà présent</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between">
          <CordelButton type="button" variant="default" onClick={onClose} disabled={submitting} className="text-xs">Annuler</CordelButton>
          <CordelButton type="button" variant="vert" onClick={handleConfirmBatch} disabled={submitting || selectedPieceIds.size === 0 || !videoUrl.trim()} className="text-xs font-black uppercase flex items-center gap-1.5">
            <span>💾</span>
            <span>{submitting ? 'Enregistrement...' : `Affecter à ${selectedPieceIds.size} morceau${selectedPieceIds.size > 1 ? 'x' : ''}`}</span>
          </CordelButton>
        </div>
      </CordelCard>

      {/* Sélecteur de vidéos depuis les playlists de l'association */}
      <YouTubeVideoPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectVideo={handleSelectFromPicker}
        groupId={groupId}
        initialPupitre={selectedInstruments[0] || ''}
      />
    </div>
  );
}
