import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloMegaphone } from './XiloIcons';

export default function StudioSocial({ groupId, branding, onBack }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [varalImages, setVaralImages] = useState([]);
  
  // Background selection states
  const [backgroundSource, setBackgroundSource] = useState('event'); // 'event', 'varal', 'upload'
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [selectedVaralImage, setSelectedVaralImage] = useState('');
  const [localImageFile, setLocalImageFile] = useState(null);
  
  const [hashtags, setHashtags] = useState('#maracatu #musique #ogirador #rodademaracatu');
  const [publicationText, setPublicationText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [savingOfficialPoster, setSavingOfficialPoster] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  
  const canvasRef = useRef(null);

  // 1. Fetch Events
  useEffect(() => {
    if (!groupId) return;
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEvents = [];
      querySnapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() });
      });
      // Sort events: upcoming first chronologically, then past descending
      const now = new Date();
      const upcoming = fetchedEvents
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const past = fetchedEvents
        .filter(e => new Date(e.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setEvents([...upcoming, ...past]);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Auto-select event from URL query parameter
  useEffect(() => {
    if (events.length === 0) return;
    const searchParams = new URLSearchParams(window.location.search);
    const urlEventId = searchParams.get('eventId');
    if (urlEventId) {
      const ev = events.find(x => x.id === urlEventId);
      if (ev) {
        setSelectedEvent(ev);
        if (ev.imageUrl) {
          setBackgroundSource('event');
          setBackgroundImageUrl(ev.imageUrl);
        } else {
          setBackgroundSource('upload');
          setBackgroundImageUrl('');
        }
      }
    }
  }, [events]);

  // 2. Fetch Varal Images
  useEffect(() => {
    if (!groupId) return;
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId), where('type', '==', 'image'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = [];
      querySnapshot.forEach((docSnap) => {
        fetchedDocs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setVaralImages(fetchedDocs);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 3. Handle Event selection change
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const ev = events.find(x => x.id === eventId);
    setSelectedEvent(ev || null);
    setLocalImageFile(null);
    setSelectedVaralImage('');
    
    if (ev) {
      if (ev.imageUrl) {
        setBackgroundSource('event');
        setBackgroundImageUrl(ev.imageUrl);
      } else {
        setBackgroundSource('upload');
        setBackgroundImageUrl('');
      }
    } else {
      setBackgroundImageUrl('');
    }
  };

  // 4. Handle Background Source Switch
  useEffect(() => {
    if (!selectedEvent) return;
    if (backgroundSource === 'event') {
      setBackgroundImageUrl(selectedEvent.imageUrl || '');
    } else if (backgroundSource === 'varal') {
      setBackgroundImageUrl(selectedVaralImage);
    } else if (backgroundSource === 'upload' && !localImageFile) {
      setBackgroundImageUrl('');
    }
  }, [backgroundSource, selectedEvent, selectedVaralImage]);

  // 5. Handle local upload a la volee
  const handleLocalImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 6. Save as official event poster
  const handleSaveAsOfficialPoster = async () => {
    if (!selectedEvent || !localImageFile) return;
    setSavingOfficialPoster(true);
    try {
      const storagePath = `events/${groupId}/uploads/${Date.now()}_${localImageFile.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, localImageFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const eventRef = doc(db, 'events', selectedEvent.id);
      await updateDoc(eventRef, { imageUrl: downloadURL });
      
      setSelectedEvent(prev => ({ ...prev, imageUrl: downloadURL }));
      setBackgroundImageUrl(downloadURL);
      setBackgroundSource('event');
      setLocalImageFile(null);
      alert("Affiche enregistrée pour cet événement !");
    } catch (err) {
      console.error("StudioSocial - Erreur d'enregistrement d'affiche :", err);
      alert("Erreur lors de l'enregistrement de l'affiche.");
    } finally {
      setSavingOfficialPoster(false);
    }
  };

  // 7. Auto build publication text
  useEffect(() => {
    if (!selectedEvent) {
      setPublicationText('');
      return;
    }

    const dateObj = new Date(selectedEvent.date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateStr = dateObj.toLocaleDateString('fr-FR', options);
    
    if (selectedEvent.horairesPassages) {
      dateStr += ` (${selectedEvent.horairesPassages})`;
    } else {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      if (hours !== '00' || minutes !== '00') {
        dateStr += ` à ${hours}h${minutes}`;
      }
    }

    let text = `${selectedEvent.titre || ''}\n`;
    text += `📅 ${dateStr}\n`;
    if (selectedEvent.lieu) {
      text += `📍 ${selectedEvent.lieu}\n`;
    }
    if (selectedEvent.lienSocial) {
      text += `🔗 Événement : ${selectedEvent.lienSocial}\n`;
    }
    if (hashtags) {
      text += `\n${hashtags}`;
    }
    setPublicationText(text);
  }, [selectedEvent, hashtags]);

  // 8. Image Loader helper
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  // 9. Text Wrapper helper for Canvas
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  // 10. Draw Canvas Function
  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    setCanvasError(false);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Background Image
    let bgImg = null;
    if (backgroundImageUrl) {
      try {
        bgImg = await loadImage(backgroundImageUrl);
      } catch (err) {
        console.error("Canvas - Erreur chargement image :", err);
        setCanvasError(true);
      }
    }

    if (bgImg) {
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = bgImg.width / bgImg.height;
      let drawWidth, drawHeight, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawHeight = bgImg.height;
        drawWidth = bgImg.height * canvasRatio;
        drawX = (bgImg.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = bgImg.width;
        drawHeight = bgImg.width / canvasRatio;
        drawX = 0;
        drawY = (bgImg.height - drawHeight) / 2;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
    } else {
      // Woodcut/Paper style fallback background
      ctx.fillStyle = '#f4ecd8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Asymmetric borders
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 15;
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    }

    // 2. Draw Dark Overlay Gradient
    const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

    // 3. Draw Association Logo
    let logoImg = null;
    if (branding?.logoUrl) {
      try {
        logoImg = await loadImage(branding.logoUrl);
      } catch (err) {
        console.error("Canvas - Erreur logo :", err);
      }
    }

    if (logoImg) {
      const logoSize = 130;
      const x = canvas.width - logoSize - 50;
      const y = 50;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2 + 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      ctx.restore();
    }

    // 4. Draw Event Details
    if (selectedEvent) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';

      // Type Badge
      const typeText = (selectedEvent.type || 'Événement').toUpperCase();
      ctx.font = '900 22px Roboto, system-ui, sans-serif';
      ctx.fillStyle = '#d99f4d'; // Gold ocre
      ctx.fillText(typeText, 60, canvas.height - 330);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px Cactus, Georgia, serif';
      const titleLines = wrapText(ctx, selectedEvent.titre || '', canvas.width - 120);
      let textY = canvas.height - 250;

      titleLines.forEach((line) => {
        ctx.fillText(line, 60, textY);
        textY += 70;
      });

      // Date & Place
      ctx.font = '600 26px Roboto, system-ui, sans-serif';
      ctx.fillStyle = '#e5e7eb';

      const dateObj = new Date(selectedEvent.date);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      let dateString = `📅 ${dateObj.toLocaleDateString('fr-FR', options)}`;
      
      if (selectedEvent.horairesPassages) {
        dateString += ` (${selectedEvent.horairesPassages})`;
      } else {
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        if (hours !== '00' || minutes !== '00') {
          dateString += ` à ${hours}h${minutes}`;
        }
      }
      ctx.fillText(dateString, 60, textY + 15);

      if (selectedEvent.lieu) {
        ctx.fillText(`📍 ${selectedEvent.lieu}`, 60, textY + 65);
      }
    }
  };

  // 11. Redraw on options changes
  useEffect(() => {
    drawCanvas();
  }, [selectedEvent, backgroundImageUrl, branding?.logoUrl, hashtags]);

  // 12. Copy generated text to clipboard
  const handleCopyText = async () => {
    if (!publicationText) return;
    try {
      await navigator.clipboard.writeText(publicationText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error("StudioSocial - Erreur copie :", err);
    }
  };

  // 13. Download visual fallback
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const cleanTitle = (selectedEvent?.titre || 'publication').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `pub_${cleanTitle}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("StudioSocial - Erreur téléchargement :", err);
      alert("Erreur de téléchargement. Vous pouvez faire un clic droit ou appui long sur l'image pour l'enregistrer.");
    }
  };

  // 14. Native Share using Web Share API
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Génération de l'image impossible.");
        return;
      }
      
      const cleanTitle = (selectedEvent?.titre || 'publication').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const file = new File([blob], `pub_${cleanTitle}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: selectedEvent?.titre || t('studioSocial.shareTitle') || 'Nouvelle publication',
            text: publicationText
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Partage natif échoué :", err);
            handleDownload();
          }
        }
      } else {
        handleDownload();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleBack = () => {
    // Clear eventId from URL parameters
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    if (onBack) onBack();
  };

  return (
    <div className="flex flex-col gap-4 w-full text-left font-sans max-w-5xl mx-auto px-2 md:px-4 py-3">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={handleBack} className="px-3 py-1 text-xs">
          ← {t('common.back') || "Retour"}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-1.5">
          <XiloMegaphone size={16} /> {t('studioSocial.title') || "Studio Social"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-2 items-start">
        {/* Left Side: Parameters */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
            {/* Event Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('studioSocial.selectEvent') || "Sélectionner un événement"}
              </label>
              <select
                onChange={handleEventChange}
                value={selectedEvent?.id || ""}
                className="theme-input w-full font-bold bg-cordel-bg-light"
              >
                <option value="" disabled>
                  {t('studioSocial.selectEventPlaceholder') || "Choisissez un événement..."}
                </option>
                {events.map((ev) => {
                  const evDate = new Date(ev.date);
                  const isPast = evDate < new Date();
                  const formattedDate = evDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  return (
                    <option key={ev.id} value={ev.id}>
                      {isPast ? "⏳ [Passé] " : "📅 "} {ev.titre} - {formattedDate}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedEvent && (
              <>
                {/* Background Image Source selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('studioSocial.backgroundSource') || "Source de l'image de fond"}
                  </label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedEvent.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setBackgroundSource('event')}
                        className={`px-3 py-1.5 border border-encre-noire rounded-[3px_5px] font-bold ${
                          backgroundSource === 'event'
                            ? 'bg-cordel-wood text-white shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                            : 'bg-cordel-bg hover:bg-neutral-200 shadow-[1px_1px_0px_0px_#181716]'
                        }`}
                      >
                        🖼️ {t('studioSocial.eventImage') || "Affiche de l'événement"}
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setBackgroundSource('varal')}
                      className={`px-3 py-1.5 border border-encre-noire rounded-[3px_5px] font-bold ${
                        backgroundSource === 'varal'
                          ? 'bg-cordel-wood text-white shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-cordel-bg hover:bg-neutral-200 shadow-[1px_1px_0px_0px_#181716]'
                      }`}
                    >
                      📂 {t('studioSocial.selectVaral') || "Bibliothèque du Varal"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBackgroundSource('upload')}
                      className={`px-3 py-1.5 border border-encre-noire rounded-[3px_5px] font-bold ${
                        backgroundSource === 'upload'
                          ? 'bg-cordel-wood text-white shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                          : 'bg-cordel-bg hover:bg-neutral-200 shadow-[1px_1px_0px_0px_#181716]'
                      }`}
                    >
                      📤 {t('studioSocial.uploadAvol') || "Uploader à la volée"}
                    </button>
                  </div>
                </div>

                {/* Suboptions conditional on Source */}
                {backgroundSource === 'varal' && (
                  <div className="flex flex-col gap-1 p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/30 rounded">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark mb-1">
                      {t('studioSocial.selectVaral') || "Sélectionner une photo du Varal"}
                    </label>
                    {varalImages.length === 0 ? (
                      <span className="text-[10px] italic opacity-60">
                        {t('studioSocial.noVaralImages') || "Aucune image trouvée dans le Varal."}
                      </span>
                    ) : (
                      <select
                        value={selectedVaralImage}
                        onChange={(e) => setSelectedVaralImage(e.target.value)}
                        className="theme-input w-full bg-cordel-bg-light text-xs font-semibold"
                      >
                        <option value="" disabled>
                          -- Choisir une photo --
                        </option>
                        {varalImages.map((img) => (
                          <option key={img.id} value={img.fileUrl}>
                            {img.titre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {backgroundSource === 'upload' && (
                  <div className="flex flex-col gap-2 p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/30 rounded">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('studioSocial.uploadAvol') || "Sélectionner un fichier local"}
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest bg-white border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer select-none">
                        📂 {localImageFile ? localImageFile.name : "Parcourir..."}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalImageSelected}
                          className="hidden"
                        />
                      </label>
                      {localImageFile && (
                        <CordelButton
                          onClick={handleSaveAsOfficialPoster}
                          disabled={savingOfficialPoster}
                          variant="ocre"
                          className="text-[9px] font-black uppercase px-2 py-1.5"
                        >
                          {savingOfficialPoster ? "Enregistrement..." : "💾 Enregistrer sur l'événement"}
                        </CordelButton>
                      )}
                    </div>
                  </div>
                )}

                {/* Hashtags Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('studioSocial.hashtagsLabel') || "Hashtags"}
                  </label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="theme-input w-full disabled:opacity-50"
                    placeholder="Ex: #maracatu #musique"
                  />
                </div>
              </>
            )}
          </CordelCard>

          {selectedEvent && (
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                📝 {t('studioSocial.textTitle') || "Texte de la publication"}
              </span>
              <textarea
                value={publicationText}
                onChange={(e) => setPublicationText(e.target.value)}
                rows={7}
                className="theme-input w-full font-mono text-xs p-3 leading-relaxed border border-encre-noire bg-cordel-bg-light rounded"
              />
              <div className="flex justify-end">
                <CordelButton
                  variant="ocre"
                  onClick={handleCopyText}
                  className="text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  📋 {copySuccess ? (t('studioSocial.copySuccess') || "Copié !") : (t('studioSocial.copyBtn') || "Copier le texte")}
                </CordelButton>
              </div>
            </CordelCard>
          )}
        </div>

        {/* Right Side: Preview & Export */}
        <div className="md:col-span-5 flex flex-col gap-4 items-center">
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 w-full flex flex-col gap-4 items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark self-start">
              📱 {t('studioSocial.previewTitle') || "Prévisualisation du Visuel"}
            </span>

            {/* Square Container wrapper for Canvas */}
            <div className="relative aspect-square w-full max-w-[400px] border-4 border-encre-noire rounded-lg overflow-hidden bg-white shadow-lg">
              <canvas
                ref={canvasRef}
                width={1080}
                height={1080}
                className="w-full h-full object-cover bg-neutral-100"
              />
              {!selectedEvent && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-xs select-none">
                  <span className="text-xs font-cactus font-black uppercase tracking-wider text-center p-4">
                    Veuillez sélectionner un événement pour générer le visuel
                  </span>
                </div>
              )}
            </div>

            {canvasError && selectedEvent && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-800 text-[10px] rounded leading-relaxed font-semibold">
                ⚠️ <strong>CORS Canvas restriction</strong> : Le chargement de l'image de fond depuis Firebase Storage a été bloqué pour l'exportation du Canvas. Vous pouvez toujours effectuer un clic droit / appui long sur le visuel pour l'enregistrer dans votre galerie.
              </div>
            )}

            {selectedEvent && (
              <div className="flex flex-col gap-2 w-full max-w-[400px]">
                {/* Export buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <CordelButton
                    onClick={handleDownload}
                    variant="default"
                    useExtremeBorder={true}
                    className="text-xs py-2.5 font-bold uppercase tracking-wider"
                  >
                    💾 {t('studioSocial.downloadBtn') || "Télécharger"}
                  </CordelButton>
                  
                  <CordelButton
                    onClick={handleShare}
                    variant="ocre"
                    useExtremeBorder={true}
                    className="text-xs py-2.5 font-bold uppercase tracking-wider"
                  >
                    🔗 {t('studioSocial.shareBtn') || "Partager"}
                  </CordelButton>
                </div>
              </div>
            )}
          </CordelCard>
        </div>
      </div>
    </div>
  );
}
