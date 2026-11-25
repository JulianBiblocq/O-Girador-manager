import React, { useState, useRef, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../../../firebase';
import useModalEscape from '../../../hooks/useModalEscape';
import { isDemoMode } from '../../../demo/demoManager';
import { buildPublicVolunteerCallUrl } from '../../../utils/publicVolunteerUtils';

/**
 * Modale Cordel de partage de l'appel public à bénévoles (`/benevoles/:eventId`) :
 * copie du lien canonique, aperçu nouvel onglet, QRCodeCanvas, export PNG et impression A4.
 */
export default function EventVolunteerShareModal({ isOpen = false, event = null, onClose, tr }) {
  const [copied, setCopied] = useState(false);
  const [assocSettings, setAssocSettings] = useState({});
  const canvasRef = useRef(null);
  useModalEscape(isOpen, onClose, false);

  useEffect(() => {
    let active = true;
    if (!isOpen || !event?.groupId) { setAssocSettings({}); return undefined; }
    getDoc(doc(db, 'associations', event.groupId))
      .then((snap) => { if (active && snap.exists()) setAssocSettings({ id: snap.id, ...snap.data() }); })
      .catch(() => {});
    return () => { active = false; };
  }, [isOpen, event?.groupId]);

  if (!isOpen || !event?.id) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const shareUrl = buildPublicVolunteerCallUrl({
    eventId: event.id,
    groupId: event.groupId || '',
    associationSettings: assocSettings,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    isDemo: isDemoMode()
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) { console.error('Erreur copie lien bénévoles :', err); }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const safeTitle = String(event.titre || 'Benevoles').replace(/[^a-zA-Z0-9-_]/g, '_');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `QRCode_Benevoles_${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-vol-qr');
    const cleanup = () => { document.body.classList.remove('printing-vol-qr'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2000);
  };

  return (
    <div
      role="dialog" aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @media print {
          body.printing-vol-qr * { visibility: hidden !important; }
          body.printing-vol-qr .print-vol-qr-card, body.printing-vol-qr .print-vol-qr-card * { visibility: visible !important; }
          body.printing-vol-qr .print-vol-qr-card {
            position: fixed !important; inset: 0 !important; width: 100% !important; height: 100vh !important;
            padding: 40px !important; display: flex !important; flex-direction: column !important;
            align-items: center !important; justify-content: center !important; background: #fff !important; border: 6px double #181716 !important;
          }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-[8px_12px_7px_10px] bg-[var(--theme-card-bg)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_0px_var(--theme-border)] overflow-hidden text-center"
      >
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-[var(--cordel-wood)] truncate">
            🔗 {t('agenda.volunteerShareModalTitle') || "Partager l'appel public à bénévoles"}
          </h4>
          <button type="button" onClick={onClose} className="font-black text-sm px-1.5 cursor-pointer">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-3">
          <div className="print-vol-qr-card w-full flex flex-col items-center gap-2.5 bg-[var(--cordel-bg)] p-4 rounded-lg border border-[var(--theme-border)]/25">
            <h3 className="text-sm font-black uppercase tracking-wide text-[var(--cordel-wood)] leading-snug">
              🙌 {t('agenda.volunteerShareScanHeadline') || "Scannez pour donner un coup de main à l'organisation !"}
            </h3>
            {event.titre && <span className="text-xs font-bold opacity-85">{event.titre}</span>}

            <div className="p-3 bg-white border-2 border-[var(--theme-border)] rounded-xl my-1 flex items-center justify-center">
              <QRCodeCanvas ref={canvasRef} value={shareUrl} size={200} bgColor="#FFFFFF" fgColor="#181716" level="H" includeMargin={true} />
            </div>

            <p className="text-[10px] font-mono break-all opacity-75 px-2">🔗 {shareUrl}</p>
          </div>
        </div>

        <div className="p-3 border-t border-dashed border-[var(--theme-border)]/25 bg-[var(--cordel-bg)] flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={handleCopy} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[10.5px] font-black uppercase cursor-pointer">
            {copied ? `✓ ${t('agenda.volunteerShareCopied') || 'Lien copié !'}` : `📋 ${t('agenda.volunteerShareCopyBtn') || 'Copier le lien'}`}
          </button>
          <button type="button" onClick={handleDownloadPng} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[10.5px] font-bold cursor-pointer">
            ⬇️ {t('agenda.volunteerShareDownloadPng') || 'Télécharger PNG'}
          </button>
          <button type="button" onClick={handlePrint} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[10.5px] font-bold cursor-pointer">
            🖨️ {t('agenda.volunteerSharePrintA4') || 'Imprimer fiche A4'}
          </button>
          <button type="button" onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')} className="px-2.5 py-1.5 rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white text-[10.5px] font-black uppercase cursor-pointer">
            🔗 {t('agenda.volunteerShareOpenPreview') || 'Aperçu public'} ↗
          </button>
        </div>
      </div>
    </div>
  );
}
