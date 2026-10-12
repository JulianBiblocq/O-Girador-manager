import React, { useState, useEffect } from 'react';
import CordelModalWrapper from './common/CordelModalWrapper';
import CordelButton from './CordelButton';
import CordelCard from './CordelCard';
import { QRCodeSVG } from 'qrcode.react';
import { 
  generateCombinedSealCanvas, 
  shareGroupInvitation, 
  getGroupInvitationDetails 
} from '../utils/shareUtils.js';
import { useTranslation } from './LanguageContext';

/**
 * Modale d'invitation au groupe avec Sceau Combiné dynamique (O Girador × Association).
 * Génère le macaron fusionné via Canvas, propose le QR Code d'inscription directe
 * et permet le partage avec pièce jointe (PNG) ou lien simple.
 */
export default function InvitationModal({
  isOpen = false,
  onClose,
  associationData = {},
  groupId = null
}) {
  const { t } = useTranslation();
  const [sealDataUrl, setSealDataUrl] = useState(null);
  const [isGeneratingSeal, setIsGeneratingSeal] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);

  const invitationDetails = getGroupInvitationDetails(associationData, groupId);
  const { invitationUrl, groupName, shareText } = invitationDetails;

  // Génération du sceau combiné à l'ouverture de la modale
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGeneratingSeal(true);

    generateCombinedSealCanvas(associationData, { size: 512 })
      .then((result) => {
        if (isMounted && result?.dataUrl) {
          setSealDataUrl(result.dataUrl);
        }
      })
      .catch((err) => {
        console.warn("InvitationModal - Erreur lors de la génération du macaron :", err);
      })
      .finally(() => {
        if (isMounted) setIsGeneratingSeal(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, associationData]);

  // Copie de l'URL ou du message d'invitation
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (err) {
      console.error("Erreur copie :", err);
    }
  };

  // Partage intelligent via navigator.share avec fichier image macaron
  const handleShare = async () => {
    setSharingLoading(true);
    try {
      const res = await shareGroupInvitation({ associationData, groupId, t });
      if (res?.method === 'clipboard') {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      }
    } catch (err) {
      console.error("Erreur de partage :", err);
    } finally {
      setSharingLoading(false);
    }
  };

  // Téléchargement du macaron combiné en fichier PNG
  const handleDownloadSeal = () => {
    if (!sealDataUrl) return;
    const cleanId = invitationDetails.canonicalId || 'groupe';
    const link = document.createElement('a');
    link.href = sealDataUrl;
    link.download = `sceau-o-girador-${cleanId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <CordelModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl">📨</span>
            <div>
              <h3 className="text-xs uppercase font-black tracking-wider text-cordel-wood">
                Invitation au Groupe
              </h3>
              <p className="text-[10px] text-stone-600 font-bold">
                {groupName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 font-bold text-sm cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <button
            type="button"
            onClick={handleDownloadSeal}
            disabled={!sealDataUrl}
            className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-stone-700 bg-white hover:bg-stone-100 rounded border border-stone-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Télécharger l'image du sceau officiel"
          >
            ⬇️ Macaron PNG
          </button>
          <div className="flex items-center gap-2">
            <CordelButton
              type="button"
              variant="default"
              useExtremeBorder={true}
              onClick={handleCopyLink}
              className="py-1 px-3 text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              {copySuccess ? '✓ Copié !' : '📋 Copier le lien'}
            </CordelButton>
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleShare}
              disabled={sharingLoading}
              className="py-1 px-3.5 text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              {sharingLoading ? 'Envoi...' : '📲 Partager'}
            </CordelButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Sceau Combiné officiel O Girador × Association */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center p-1 bg-white/70 border-2 border-stone-300 shadow-md">
          {isGeneratingSeal ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-3 border-cordel-wood border-t-transparent animate-spin" />
              <span className="text-[9px] uppercase font-bold text-stone-500">Génération du sceau...</span>
            </div>
          ) : sealDataUrl ? (
            <img
              src={sealDataUrl}
              alt={`Sceau O Girador × ${groupName}`}
              className="w-full h-full object-contain pointer-events-none select-none rounded-full"
            />
          ) : (
            <img
              src="/og-girador-frame.png"
              alt="Sceau O Girador"
              className="w-full h-full object-contain pointer-events-none select-none rounded-full"
            />
          )}
        </div>

        {/* QR Code et message d'accueil */}
        <div className="w-full flex flex-col items-center gap-2 bg-cordel-bg-light/60 p-3 rounded-lg border border-dashed border-cordel-master-dark/20">
          <div className="p-2 bg-white rounded-md border border-stone-300 shadow-xs">
            <QRCodeSVG
              value={invitationUrl}
              size={128}
              level="M"
              fgColor="#181716"
              bgColor="#ffffff"
            />
          </div>
          <span className="text-[9.5px] font-bold text-stone-600 leading-tight">
            Faites scanner ce QR Code lors d'une répétition ou d'un forum pour une inscription directe.
          </span>
        </div>

        {/* Boîte de lien avec sélection et copie */}
        <div className="w-full flex flex-col gap-1 text-left">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Lien d'inscription directe
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              onClick={(e) => e.target.select()}
              className="text-xs font-mono px-2.5 py-1.5 border border-stone-300 rounded bg-white text-stone-800 flex-1 outline-none select-all shadow-2xs"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer shadow-2xs shrink-0 ${
                copySuccess
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white'
                  : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300'
              }`}
            >
              {copySuccess ? '✓ Copié' : '📋 Copier'}
            </button>
          </div>
        </div>
      </div>
    </CordelModalWrapper>
  );
}
