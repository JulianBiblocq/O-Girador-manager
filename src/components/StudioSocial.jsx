import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloMegaphone } from './XiloIcons';
import useConfirm from '../hooks/useConfirm';
import { getSocialVideoThumbnail } from '../utils/videoUtils';
import StudioTextToolbar from './studio/StudioTextToolbar';
import { DEFAULT_STUDIO_LEXIQUE, DEFAULT_STUDIO_MENTIONS } from './studio/StudioQuickChips';

export default function StudioSocial({ groupId, branding, onBack, role, isSystemAdmin, user, profileData, onNavigateToView }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [varalImages, setVaralImages] = useState([]);
  
  // Background selection states
  const [backgroundSource, setBackgroundSource] = useState('event'); // 'event', 'varal', 'upload'
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [selectedVaralImage, setSelectedVaralImage] = useState('');
  const [localImageFile, setLocalImageFile] = useState(null);
  
  // Vidéo sociale & miniature
  const [socialVideoUrl, setSocialVideoUrl] = useState('');
  const [savingVideoUrl, setSavingVideoUrl] = useState(false);
  
  const [hashtags, setHashtags] = useState('#OGirador');
  const [publicationText, setPublicationText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [savingOfficialPoster, setSavingOfficialPoster] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  
  const canvasRef = useRef(null);
  const textareaRef = useRef(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  const [availableSocialTags, setAvailableSocialTags] = useState([]);
  const [newSocialTag, setNewSocialTag] = useState('');
  const [editingTagIdx, setEditingTagIdx] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // États pour les chips de vocabulaire, mentions et équivalences de l'association
  const [studioLexique, setStudioLexique] = useState(DEFAULT_STUDIO_LEXIQUE);
  const [studioMentions, setStudioMentions] = useState(DEFAULT_STUDIO_MENTIONS);
  const [studioEquivalences, setStudioEquivalences] = useState([]);
  const [newLexiqueTerm, setNewLexiqueTerm] = useState('');
  const [newMention, setNewMention] = useState('');

  // Récupérer social tags, lexique et mentions from Firestore associations/{groupId}
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // 1. Si la configuration structurée studioLexiqueConfig existe
        if (data.studioLexiqueConfig) {
          const cfg = data.studioLexiqueConfig;
          if (Array.isArray(cfg.mentions) && cfg.mentions.length > 0) {
            setStudioMentions(cfg.mentions);
          }
          if (Array.isArray(cfg.equivalences) && cfg.equivalences.length > 0) {
            setStudioEquivalences(cfg.equivalences);
            const activeChips = cfg.equivalences
              .filter((eq) => eq.activeChip !== false)
              .map((eq) => eq.preferred || eq.recommande)
              .filter(Boolean);
            if (activeChips.length > 0) {
              setStudioLexique(activeChips);
            }
          }
          if (Array.isArray(cfg.hashtags) && cfg.hashtags.length > 0) {
            setAvailableSocialTags(cfg.hashtags);
          }
        } else {
          // 2. Repli rétrocompatible sur les champs individuels
          setAvailableSocialTags(data.studioSocialTags || []);
          if (Array.isArray(data.studioLexique) && data.studioLexique.length > 0) {
            setStudioLexique(data.studioLexique);
          }
          if (Array.isArray(data.studioMentions) && data.studioMentions.length > 0) {
            setStudioMentions(data.studioMentions);
          }
        }
      }
    }, (err) => {
      console.error("StudioSocial - Erreur snapshot tags :", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Synchroniser hashtags state when availableSocialTags changes
  useEffect(() => {
    const defaultTags = ['#OGirador', ...availableSocialTags].join(' ');
    setHashtags(defaultTags);
  }, [availableSocialTags]);

  // 1. Récupérer Events
  useEffect(() => {
    if (!groupId) return;
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEvents = [];
      querySnapshot.forEach((doc) => {
        fetchedEvents.push({ id: doc.id, ...doc.data() });
      });
      // Trier events: upcoming first chronologically, then past descending
      const now = new Date();
      const upcoming = fetchedEvents
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const past = fetchedEvents
        .filter(e => new Date(e.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setEvents([...upcoming, ...past]);
    }, (err) => {
      console.error("StudioSocial - Erreur snapshot événements :", err);
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
        setSocialVideoUrl(ev.socialVideoUrl || ev.videoUrl || '');
        const thumb = ev.socialThumbnailUrl || (ev.socialVideoUrl ? getSocialVideoThumbnail(ev.socialVideoUrl) : null);
        if (ev.imageUrl || thumb) {
          setBackgroundSource('event');
          setBackgroundImageUrl(ev.imageUrl || thumb || '');
        } else {
          setBackgroundSource('upload');
          setBackgroundImageUrl('');
        }
      }
    }
  }, [events]);

  // 2. Récupérer Varal Images (Tous les médias visuels du Varal et des galeries d'événements)
  useEffect(() => {
    if (!groupId) return;
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const candidateUrl = data.fileUrl || data.url || data.imageUrl || data.photoUrl || data.visuelAnimeUrl || '';
        
        // Détecter si le document est une image ou contient une URL d'image exploitable
        const isExplicitImage = data.type === 'image' || data.typeDoc === 'image';
        const hasImageExt = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(candidateUrl);
        const isStorageImage = candidateUrl.includes('firebasestorage.googleapis.com') && 
          !candidateUrl.includes('.pdf') && 
          !candidateUrl.includes('.mp3') && 
          !candidateUrl.includes('.wav') && 
          !candidateUrl.includes('.mp4');

        if (candidateUrl && (isExplicitImage || hasImageExt || isStorageImage)) {
          fetchedDocs.push({
            id: docSnap.id,
            titre: data.titre || data.nom || 'Photo Varal',
            fileUrl: candidateUrl,
            categorie: data.categorie || data.categoryId || 'Varal',
            dateAjout: data.dateAjout || data.date || ''
          });
        }
      });

      // Compléter avec les affiches et visuels des événements
      events.forEach((ev) => {
        if (ev.imageUrl && !fetchedDocs.some(d => d.fileUrl === ev.imageUrl)) {
          fetchedDocs.push({
            id: `evt-img-${ev.id}`,
            titre: `Affiche : ${ev.titre || 'Événement'}`,
            fileUrl: ev.imageUrl,
            categorie: 'Événements',
            dateAjout: ev.dateDebut || ev.date || ''
          });
        }
      });

      fetchedDocs.sort((a, b) => new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0));
      setVaralImages(fetchedDocs);
    }, (err) => {
      console.error("StudioSocial - Erreur snapshot images varal :", err);
    });
    return () => unsubscribe();
  }, [groupId, events]);

  // 3. Gérer Event selection change
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    const ev = events.find(x => x.id === eventId);
    setSelectedEvent(ev || null);
    setLocalImageFile(null);
    setSelectedVaralImage('');
    setSocialVideoUrl(ev?.socialVideoUrl || ev?.videoUrl || '');
    
    if (ev) {
      const thumb = ev.socialThumbnailUrl || (ev.socialVideoUrl ? getSocialVideoThumbnail(ev.socialVideoUrl) : null);
      if (ev.imageUrl || thumb) {
        setBackgroundSource('event');
        setBackgroundImageUrl(ev.imageUrl || thumb || '');
      } else {
        setBackgroundSource('upload');
        setBackgroundImageUrl('');
      }
    } else {
      setBackgroundImageUrl('');
    }

    const defaultTags = ['#OGirador', ...availableSocialTags].join(' ');
    setHashtags(defaultTags);
  };

  /**
   * Sauvegarde le lien vidéo et sa miniature générée automatiquement dans Firestore
   */
  const handleSaveVideoUrl = async () => {
    if (!selectedEvent?.id) return;
    setSavingVideoUrl(true);
    try {
      const cleanUrl = socialVideoUrl.trim();
      const thumbnailUrl = getSocialVideoThumbnail(cleanUrl);
      const eventRef = doc(db, 'events', selectedEvent.id);

      const updatePayload = {
        socialVideoUrl: cleanUrl,
        socialThumbnailUrl: thumbnailUrl || null
      };

      // Si aucune affiche visuelle n'existait, utiliser la miniature vidéo générée
      if (thumbnailUrl && !selectedEvent.imageUrl) {
        updatePayload.imageUrl = thumbnailUrl;
      }

      await updateDoc(eventRef, updatePayload);

      // Mettre à jour l'événement local sélectionné
      setSelectedEvent(prev => prev ? { ...prev, ...updatePayload } : null);

      if (thumbnailUrl && (!backgroundImageUrl || backgroundSource === 'event')) {
        setBackgroundImageUrl(thumbnailUrl);
        setBackgroundSource('event');
      }
    } catch (err) {
      console.error("StudioSocial - Erreur sauvegarde vidéo :", err);
      alert("Erreur lors de l'enregistrement du lien vidéo.");
    } finally {
      setSavingVideoUrl(false);
    }
  };

  const handleAddSocialTag = async (e) => {
    e.preventDefault();
    if (!newSocialTag.trim()) return;
    let tag = newSocialTag.trim();
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    if (tag.toLowerCase() === '#ogirador') {
      alert("Le tag #OGirador est fixe et ne peut pas être dupliqué.");
      return;
    }
    if (availableSocialTags.includes(tag)) {
      alert("Ce tag existe déjà.");
      return;
    }
    const updatedTags = [...availableSocialTags, tag];
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        studioSocialTags: updatedTags,
        'studioLexiqueConfig.hashtags': updatedTags
      });
      setNewSocialTag('');
    } catch (err) {
      console.error("Erreur ajout tag social :", err);
      alert("Erreur lors de l'ajout du tag.");
    }
  };

  const handleUpdateSocialTag = async (idx, oldTag) => {
    if (!editingTagValue.trim()) return;
    let tag = editingTagValue.trim();
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    if (tag.toLowerCase() === '#ogirador') {
      alert("Le tag #OGirador est fixe et ne peut pas être modifié.");
      return;
    }
    const tagMatches = availableSocialTags.some((t, i) => {
      const existing = typeof t === 'string' ? t : (t?.tag || t?.label || '');
      return i !== idx && existing.toLowerCase() === tag.toLowerCase();
    });
    if (tagMatches) {
      alert("Ce tag existe déjà.");
      return;
    }
    const updatedTags = [...availableSocialTags];
    updatedTags[idx] = tag;
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        studioSocialTags: updatedTags,
        'studioLexiqueConfig.hashtags': updatedTags
      });
      setEditingTagIdx(null);
      setEditingTagValue('');
    } catch (err) {
      console.error("Erreur modification tag social :", err);
      alert("Erreur lors de la modification du tag.");
    }
  };

  const handleDeleteSocialTag = async (tagToDelete) => {
    const tagStr = typeof tagToDelete === 'string' ? tagToDelete : (tagToDelete?.tag || tagToDelete?.label || '');
    if (tagStr.toLowerCase() === '#ogirador') {
      alert("Le tag #OGirador est fixe et ne peut pas être supprimé.");
      return;
    }
    const ok = await confirm({
      title: "Supprimer le tag",
      message: `Voulez-vous supprimer le tag ${tagStr} ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!ok) return;
    const updatedTags = availableSocialTags.filter((t) => {
      const current = typeof t === 'string' ? t : (t?.tag || t?.label || '');
      return current !== tagStr;
    });
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        studioSocialTags: updatedTags,
        'studioLexiqueConfig.hashtags': updatedTags
      });
    } catch (err) {
      console.error("Erreur suppression tag social :", err);
      alert("Erreur lors de la suppression du tag.");
    }
  };

  // Gestion des mots-clés du lexique pour l'administrateur
  const handleAddLexiqueTerm = async (e) => {
    e.preventDefault();
    const term = newLexiqueTerm.trim().toLowerCase();
    if (!term || !groupId) return;
    const alreadyExists = studioLexique.some((t) => {
      const label = typeof t === 'string' ? t : (t?.preferred || t?.recommande || t?.term || '');
      return label.toLowerCase() === term;
    });
    if (alreadyExists) {
      alert("Ce mot existe déjà dans le lexique.");
      return;
    }
    const updated = [...studioLexique, term];
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { studioLexique: updated });
      setStudioLexique(updated);
      setNewLexiqueTerm('');
    } catch (err) {
      console.error("Erreur ajout terme lexique :", err);
      alert("Erreur lors de l'ajout du terme.");
    }
  };

  const handleDeleteLexiqueTerm = async (termToDelete) => {
    if (!groupId) return;
    const targetLabel = typeof termToDelete === 'string'
      ? termToDelete
      : (termToDelete?.preferred || termToDelete?.recommande || termToDelete?.term || '');
    const updated = studioLexique.filter((t) => {
      const label = typeof t === 'string' ? t : (t?.preferred || t?.recommande || t?.term || '');
      return label !== targetLabel;
    });
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, { studioLexique: updated });
      setStudioLexique(updated);
    } catch (err) {
      console.error("Erreur suppression terme lexique :", err);
    }
  };

  // Gestion des mentions sociales pour l'administrateur
  const handleAddMention = async (e) => {
    e.preventDefault();
    let mention = newMention.trim();
    if (!mention || !groupId) return;
    if (!mention.startsWith('@')) {
      mention = '@' + mention;
    }
    const alreadyExists = studioMentions.some((m) => {
      const h = typeof m === 'object' && m !== null ? m.handle : m;
      return h?.toLowerCase() === mention.toLowerCase();
    });
    if (alreadyExists) {
      alert("Cette mention existe déjà.");
      return;
    }

    const hasObjects = studioMentions.some((m) => typeof m === 'object' && m !== null);
    const newEntry = hasObjects
      ? { id: `m_${Date.now()}`, handle: mention, label: mention.replace(/^@/, '') }
      : mention;

    const updated = [...studioMentions, newEntry];
    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        studioMentions: updated,
        'studioLexiqueConfig.mentions': updated
      });
      setStudioMentions(updated);
      setNewMention('');
    } catch (err) {
      console.error("Erreur ajout mention :", err);
      alert("Erreur lors de l'ajout de la mention.");
    }
  };

  const handleDeleteMention = async (mentionToDelete) => {
    if (!groupId) return;
    const targetKey = typeof mentionToDelete === 'object' && mentionToDelete !== null
      ? (mentionToDelete.id || mentionToDelete.handle)
      : mentionToDelete;

    const updated = studioMentions.filter((m) => {
      const key = typeof m === 'object' && m !== null ? (m.id || m.handle) : m;
      return key !== targetKey;
    });

    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        studioMentions: updated,
        'studioLexiqueConfig.mentions': updated
      });
      setStudioMentions(updated);
    } catch (err) {
      console.error("Erreur suppression mention :", err);
    }
  };

  // 4. Gérer Background Source Switch
  useEffect(() => {
    if (!selectedEvent) return;
    if (backgroundSource === 'event') {
      setBackgroundImageUrl(selectedEvent.imageUrl || '');
    } else if (backgroundSource === 'varal') {
      setBackgroundImageUrl(selectedVaralImage);
    } else if (backgroundSource === 'upload' && !localImageFile) {
      setBackgroundImageUrl('');
    }
  }, [backgroundSource, selectedEvent, selectedVaralImage, localImageFile]);

  // Synchroniser selectedEvent with the real-time list of events (bidirectional synchroniser)
  useEffect(() => {
    if (!selectedEvent || events.length === 0) return;
    const freshEvent = events.find(x => x.id === selectedEvent.id);
    if (freshEvent) {
      if (freshEvent.imageUrl !== selectedEvent.imageUrl) {
        setSelectedEvent(freshEvent);
        if (backgroundSource === 'event') {
          setBackgroundImageUrl(freshEvent.imageUrl || '');
        }
      }
    }
  }, [events, selectedEvent, backgroundSource]);

  // 5. Gérer local upload a la volee (auto-enregistrer to Firestore)
  const handleLocalImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedEvent) {
      setSavingOfficialPoster(true);
      try {
        const storagePath = `documents/${groupId}/events/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const eventRef = doc(db, 'events', selectedEvent.id);
        await updateDoc(eventRef, { imageUrl: downloadURL });

        setSelectedEvent(prev => ({ ...prev, imageUrl: downloadURL }));
        setBackgroundImageUrl(downloadURL);
        setBackgroundSource('event');
        setLocalImageFile(null);
        alert("Image d'illustration mise à jour et associée à l'événement !");
      } catch (err) {
        console.error("StudioSocial - Erreur upload direct :", err);
        alert("Erreur lors du téléversement de l'image.");
      } finally {
        setSavingOfficialPoster(false);
      }
    } else {
      setLocalImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setBackgroundImageUrl(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 6. Gérer Varal image selection (associer à l'événement et à la publication)
  const handleVaralImageChange = async (e) => {
    const url = typeof e === 'string' ? e : e?.target?.value;
    if (!url) return;
    setSelectedVaralImage(url);
    setBackgroundImageUrl(url);

    if (selectedEvent) {
      try {
        const eventRef = doc(db, 'events', selectedEvent.id);
        await updateDoc(eventRef, { imageUrl: url });
        setSelectedEvent(prev => ({ ...prev, imageUrl: url }));
      } catch (err) {
        console.error("StudioSocial - Erreur liaison image Varal :", err);
      }
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

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback without crossOrigin (image displays but taints canvas)
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          setCanvasError(true);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = (err) => reject(err);
      };
    });
  };

  // 9. Text Wrapper utilitaire for Canvas
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

    // Effacer Canvas
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

  // 15. Direct Image Copy to Clipboard (Clipboard API)
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!navigator.clipboard || !window.ClipboardItem) {
      alert("Votre navigateur ne prend pas en charge la copie directe d'images dans le presse-papier.");
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Extraction de l'image impossible.");
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2500);
      } catch (err) {
        console.error("StudioSocial - Erreur copie image :", err);
        alert("Impossible de copier l'image dans le presse-papier : " + (err.message || err));
      }
    }, 'image/png');
  };

  const [sendingValidation, setSendingValidation] = useState(false);

  // 16. Envoi pour validation collaborative vers le Forum (Porte-Voix)
  const handleSendForValidation = async () => {
    if (!selectedEvent && !publicationText) {
      alert("Veuillez sélectionner un événement ou rédiger un texte avant d'envoyer pour validation.");
      return;
    }
    setSendingValidation(true);

    try {
      const canvas = canvasRef.current;
      let uploadedVisualUrl = '';

      // 1. Export du Canvas en Blob et téléversement sécurisé dans Firebase Storage
      // Stockage sous documents/{groupId}/studio_validation/... pour cloisonnement SaaS
      if (canvas) {
        try {
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            const cleanTitle = (selectedEvent?.titre || 'publication').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const storagePath = `documents/${groupId}/studio_validation/${cleanTitle}_${Date.now()}.png`;
            const storageRef = ref(storage, storagePath);
            const snap = await uploadBytes(storageRef, blob);
            uploadedVisualUrl = await getDownloadURL(snap.ref);
          }
        } catch (canvasErr) {
          console.warn("StudioSocial - Image canvas non exportable, repli sur image existante :", canvasErr);
        }
      }

      const visualUrl = uploadedVisualUrl || backgroundImageUrl || selectedEvent?.imageUrl || '';

      // 2. Recherche robuste du salon ('Validation Comm', 'Validation', 'Bureau', 'CA', ou repli sécurisé)
      let targetChannelId = `${groupId}_bureau`;
      try {
        const channelsRef = collection(db, 'forum_channels');
        const qChan = query(channelsRef, where('groupId', '==', groupId));
        const chanSnap = await getDocs(qChan);
        const channelsList = [];
        chanSnap.forEach(d => channelsList.push({ id: d.id, ...d.data() }));

        // Priorité 1 : Salons spécifiques de validation
        const validationChan = channelsList.find(c => {
          const n = (c.name || '').toLowerCase();
          return n === 'validation comm' || n === 'validation' || n.includes('validation');
        });

        // Priorité 2 : Salons décisionnels Bureau ou CA
        const bureauCaChan = channelsList.find(c => {
          const n = (c.name || '').toLowerCase();
          return n === 'bureau' || n === 'ca';
        });

        // Priorité 3 : Premier salon privé/restreint disponible
        const privateChan = channelsList.find(c => {
          return Array.isArray(c.readRoles) && !c.readRoles.includes('all') && c.readRoles.length > 0;
        });

        // Priorité 4 : Salon Général ou premier salon disponible
        const generalChan = channelsList.find(c => {
          const n = (c.name || '').toLowerCase();
          return n === 'général' || n === 'general';
        });

        const fallbackChan = channelsList[0];

        targetChannelId = validationChan?.id || bureauCaChan?.id || privateChan?.id || generalChan?.id || fallbackChan?.id || `${groupId}_bureau`;
      } catch (cErr) {
        console.warn("StudioSocial - Erreur recherche salon forum :", cErr);
        targetChannelId = `${groupId}_bureau`;
      }

      const nowIso = new Date().toISOString();
      const authorName = profileData ? `${profileData.prenom || ''} ${profileData.nom || ''}`.trim() : (user?.displayName || 'Membre');
      const eventTitle = selectedEvent?.titre || 'Publication Réseaux';

      let messageHtml = `<p>📢 <strong>Proposition de publication réseaux sociaux</strong></p>`;
      if (visualUrl) {
        messageHtml += `<p><img src="${visualUrl}" alt="Visuel proposition" style="max-width:100%; max-height:400px; object-fit:contain; border-radius:6px; border:2px solid #181716;" /></p>`;
      }
      messageHtml += `<p><strong>Texte & Hashtags proposés :</strong></p><pre style="white-space:pre-wrap; font-family:inherit; background:#fbf9f4; padding:8px; border:1px solid #ccc; border-radius:4px;">${publicationText}</pre>`;

      // Création du sujet dans le salon privé du Forum avec structure validationData
      const threadDocRef = await addDoc(collection(db, 'forum'), {
        titre: `[Validation Comm'] ${eventTitle}`,
        categorie: 'Général',
        groupId: groupId,
        channelId: targetChannelId,
        auteurId: user?.uid || 'system',
        auteurNom: authorName,
        dateCreation: nowIso,
        derniereModification: nowIso,
        isPinned: true,
        validationData: {
          eventId: selectedEvent?.id || null,
          eventTitre: eventTitle,
          statut: 'en_attente',
          redacteurId: user?.uid || 'system',
          redacteurNom: authorName,
          visuelUrl: visualUrl,
          texte: publicationText,
          dateSoumission: nowIso
        },
        reponses: [
          {
            auteurId: user?.uid || 'system',
            auteurNom: authorName,
            message: messageHtml,
            dateCreation: nowIso
          }
        ]
      });

      // Mise à jour de l'événement dans Firestore
      if (selectedEvent?.id) {
        const eventRef = doc(db, 'events', selectedEvent.id);
        const eventUpdate = {
          statutPublication: 'en_attente',
          publicationTexte: publicationText,
          publicationVisuelUrl: visualUrl,
          publicationValidationThreadId: threadDocRef.id,
          publicationRedacteurId: user?.uid || 'system',
          publicationDateSoumission: nowIso
        };

        await updateDoc(eventRef, eventUpdate);

        // Mettre à jour l'événement local sélectionné
        setSelectedEvent(prev => prev ? { ...prev, ...eventUpdate } : null);
      }

      alert("🎉 Proposition soumise pour validation ! Le sujet a été ouvert dans le Forum (Porte-Voix).");
    } catch (err) {
      console.error("StudioSocial - Erreur lors de l'envoi pour validation:", err);
      alert("Erreur lors de l'envoi pour validation : " + (err.message || err));
    } finally {
      setSendingValidation(false);
    }
  };

  const handleBack = () => {
    // Effacer eventId from URL parameters
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
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('studioSocial.selectEvent') || "Sélectionner un événement"}
                </label>
                {selectedEvent && (
                  <span className={`theme-stamp-badge text-[8px] rotate-0 font-bold ${
                    selectedEvent.statutPublication === 'approuve'
                      ? 'theme-stamp-badge-vert'
                      : selectedEvent.statutPublication === 'en_attente'
                      ? 'theme-stamp-badge-ocre'
                      : 'theme-stamp-badge-dark'
                  }`}>
                    {selectedEvent.statutPublication === 'approuve'
                      ? '✅ Approuvé'
                      : selectedEvent.statutPublication === 'en_attente'
                      ? '⏳ En attente validation'
                      : '📝 Brouillon'}
                  </span>
                )}
              </div>
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
                {/* Champ optionnel : Lien Vidéo (YouTube...) */}
                <div className="flex flex-col gap-1.5 p-3 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 rounded-[5px]">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
                    <span>🎬 {t('studioSocial.videoUrlLabel') || "Vidéo"}</span>
                    {socialVideoUrl && getSocialVideoThumbnail(socialVideoUrl) && (
                      <span className="text-[9px] text-green-700 font-extrabold px-1.5 py-0.5 bg-green-100 border border-green-400 rounded select-none">
                        ✓ Miniature YouTube détectée
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={socialVideoUrl}
                      onChange={(e) => setSocialVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="theme-input text-xs font-bold flex-1 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveVideoUrl}
                      disabled={savingVideoUrl || !socialVideoUrl.trim()}
                      className="px-3 py-1.5 bg-cordel-wood text-white text-xs font-bold rounded-[3px_5px] shadow-[1px_1px_0px_0px_#181716] hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {savingVideoUrl ? "..." : (t('common.save') || "Enregistrer")}
                    </button>
                  </div>
                  <p className="text-[9.5px] font-semibold text-cordel-master-dark/70 italic">
                    La miniature vidéo sera automatiquement générée et affichée sur le billet d'événement dans l'Agenda avec l'icône Play ▶️.
                  </p>
                </div>

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
                  <div className="flex flex-col gap-2 p-2.5 bg-cordel-bg border border-dashed border-cordel-master-dark/30 rounded">
                    <div className="flex items-center justify-between">
                      <label className="text-[9.5px] uppercase font-black tracking-wider text-cordel-master-dark">
                        {t('studioSocial.selectVaral') || "Sélectionner une photo du Varal"}
                      </label>
                      <span className="text-[9px] font-bold text-cordel-wood">
                        {varalImages.length} photo(s) disponible(s)
                      </span>
                    </div>

                    {varalImages.length === 0 ? (
                      <span className="text-[10px] italic opacity-60">
                        {t('studioSocial.noVaralImages') || "Aucune image trouvée dans le Varal."}
                      </span>
                    ) : (
                      <>
                        <select
                          value={selectedVaralImage}
                          onChange={handleVaralImageChange}
                          className="theme-input w-full bg-cordel-bg-light text-xs font-bold py-1.5"
                        >
                          <option value="" disabled>
                            -- Choisir une photo du Varal --
                          </option>
                          {varalImages.map((img) => (
                            <option key={img.id} value={img.fileUrl}>
                              {img.titre} ({img.categorie})
                            </option>
                          ))}
                        </select>

                        {/* Aperçus miniatures rapides */}
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                          {varalImages.slice(0, 8).map((img) => {
                            const isSelected = selectedVaralImage === img.fileUrl;
                            return (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => handleVaralImageChange(img.fileUrl)}
                                className={`w-12 h-12 rounded border-2 shrink-0 overflow-hidden cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-encre-noire ring-2 ring-cordel-wood scale-105 shadow-md'
                                    : 'border-stone-300 opacity-80 hover:opacity-100 hover:border-encre-noire'
                                }`}
                                title={img.titre}
                              >
                                <img
                                  src={img.fileUrl}
                                  alt={img.titre}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {backgroundSource === 'upload' && (
                  <div className="flex flex-col gap-2 p-2 bg-cordel-bg border border-dashed border-cordel-master-dark/30 rounded text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('studioSocial.uploadAvol') || "Sélectionner un fichier local"}
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-black uppercase tracking-widest bg-white border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer select-none">
                        {savingOfficialPoster ? "⏳ Téléversement..." : (localImageFile ? `📂 ${localImageFile.name}` : "Parcourir...")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalImageSelected}
                          disabled={savingOfficialPoster}
                          className="hidden"
                        />
                      </label>
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

                {/* Interface de Gestion des Tags, Lexique et Mentions pour l'Administrateur */}
                {isAuthorized && (
                  <div className="mt-2 pt-3.5 border-t border-dashed border-cordel-master-dark/15 flex flex-col gap-3">
                    {/* Raccourci vers le gestionnaire complet du Lexique */}
                    {onNavigateToView && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/80 border border-amber-800/30 rounded text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">⚙️</span>
                          <span className="font-bold text-amber-950">
                            Gestion complète du Lexique, Mentions et Hashtags
                          </span>
                        </div>
                        <CordelButton
                          variant="ocre"
                          size="small"
                          onClick={() => onNavigateToView('studio-lexique')}
                          className="text-[10px] font-black uppercase tracking-wider py-1 px-2.5"
                        >
                          Ouvrir l'onglet Lexique →
                        </CordelButton>
                      </div>
                    )}

                    {/* 1. Gestion des hashtags */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-cordel-wood">
                        ⚙️ Hashtags par défaut de l'association (Admin)
                      </span>
                      
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <span className="bg-neutral-200 border border-encre-noire/30 px-2 py-0.5 rounded text-[11px] font-semibold text-neutral-600 select-none">
                          #OGirador (Fixe)
                        </span>
                        {availableSocialTags.map((tag, idx) => {
                          const isEditing = editingTagIdx === idx;
                          const tagStr = typeof tag === 'string' ? tag : (tag?.tag || tag?.label || String(tag));
                          return (
                            <div key={idx} className="flex items-center gap-1 bg-cordel-bg-light border border-encre-noire/35 px-2 py-0.5 rounded text-[11px]">
                              {isEditing ? (
                                <div className="flex items-center gap-1 select-none">
                                  <input
                                    type="text"
                                    value={editingTagValue}
                                    onChange={(e) => setEditingTagValue(e.target.value)}
                                    className="border border-encre-noire px-1 py-0.5 rounded text-[10px] w-24 bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateSocialTag(idx, tagStr)}
                                    className="text-[var(--color-cordel-vert,#2d6a4f)] hover:brightness-75 font-extrabold"
                                    title="Enregistrer"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTagIdx(null);
                                      setEditingTagValue('');
                                    }}
                                    className="text-neutral-500 hover:text-neutral-700 font-bold"
                                    title="Annuler"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="font-bold text-encre-noire">{tagStr}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTagIdx(idx);
                                      setEditingTagValue(tagStr);
                                    }}
                                    className="text-cordel-wood hover:brightness-75 font-semibold ml-1 cursor-pointer"
                                    title="Modifier"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSocialTag(tagStr)}
                                    className="text-[var(--color-cordel-rouge,#8b2a1a)] hover:brightness-75 font-bold ml-0.5 cursor-pointer"
                                    title="Supprimer"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <form onSubmit={handleAddSocialTag} className="flex gap-2 mt-1 items-center">
                        <input
                          type="text"
                          placeholder="Nouveau tag (ex: #musique)"
                          value={newSocialTag}
                          onChange={(e) => setNewSocialTag(e.target.value)}
                          className="theme-input text-xs py-1 px-2 flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!newSocialTag.trim()}
                          className="text-[10px] font-black uppercase tracking-wider bg-cordel-secondary text-white px-3 py-1.5 rounded-[4px] border border-encre-noire cursor-pointer hover:brightness-95 disabled:opacity-50"
                        >
                          Ajouter tag
                        </button>
                      </form>
                    </div>

                    {/* 2. Gestion des mots-clés du lexique rapide */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-cordel-master-dark/10">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900">
                        📖 Lexique d'insertion rapide personnalisable (Admin)
                      </span>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {studioLexique.map((term, idx) => {
                          const isObj = typeof term === 'object' && term !== null;
                          const termLabel = isObj ? (term.preferred || term.recommande || term.term || '') : String(term || '');
                          const key = isObj ? (term.id || termLabel || idx) : `${termLabel}-${idx}`;
                          if (!termLabel) return null;
                          return (
                            <div key={key} className="flex items-center gap-1 bg-amber-50 border border-amber-900/30 px-2 py-0.5 rounded text-[11px]">
                              <span className="font-bold text-amber-950">{termLabel}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteLexiqueTerm(term)}
                                className="text-[var(--color-cordel-rouge,#8b2a1a)] hover:brightness-75 font-bold ml-0.5 cursor-pointer"
                                title={`Supprimer "${termLabel}" du lexique`}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <form onSubmit={handleAddLexiqueTerm} className="flex gap-2 mt-0.5 items-center">
                        <input
                          type="text"
                          placeholder="Nouveau mot (ex: maracatu)"
                          value={newLexiqueTerm}
                          onChange={(e) => setNewLexiqueTerm(e.target.value)}
                          className="theme-input text-xs py-1 px-2 flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!newLexiqueTerm.trim()}
                          className="text-[10px] font-black uppercase tracking-wider bg-amber-800 text-white px-3 py-1.5 rounded-[4px] border border-encre-noire cursor-pointer hover:brightness-95 disabled:opacity-50"
                        >
                          Ajouter mot
                        </button>
                      </form>
                    </div>

                    {/* 3. Gestion des mentions sociales */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-cordel-master-dark/10">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-900">
                        @ Mentions de comptes personnalisables (Admin)
                      </span>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {studioMentions.map((mention, idx) => {
                          const isObj = typeof mention === 'object' && mention !== null;
                          const handle = isObj ? (mention.handle || '') : String(mention || '');
                          const label = isObj && mention.label ? mention.label : handle;
                          const key = isObj ? (mention.id || mention.handle || idx) : `${handle}-${idx}`;

                          if (!handle && !label) return null;

                          return (
                            <div key={key} className="flex items-center gap-1 bg-blue-50 border border-blue-900/30 px-2 py-0.5 rounded text-[11px]">
                              <span className="font-bold text-blue-950">{label}</span>
                              {isObj && mention.label && mention.handle && mention.label !== mention.handle && (
                                <span className="text-[10px] text-blue-900/70 font-mono">({handle})</span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteMention(mention)}
                                className="text-[var(--color-cordel-rouge,#8b2a1a)] hover:brightness-75 font-bold ml-0.5 cursor-pointer"
                                title={`Supprimer "${label || handle}" des mentions`}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <form onSubmit={handleAddMention} className="flex gap-2 mt-0.5 items-center">
                        <input
                          type="text"
                          placeholder="Nouvelle mention (ex: @nom_partenaire)"
                          value={newMention}
                          onChange={(e) => setNewMention(e.target.value)}
                          className="theme-input text-xs py-1 px-2 flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!newMention.trim()}
                          className="text-[10px] font-black uppercase tracking-wider bg-blue-900 text-white px-3 py-1.5 rounded-[4px] border border-encre-noire cursor-pointer hover:brightness-95 disabled:opacity-50"
                        >
                          Ajouter mention
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </CordelCard>

          {selectedEvent && (
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  📝 {t('studioSocial.textTitle') || "Texte de la publication"}
                </span>
                {selectedEvent.statutPublication && (
                  <span className="text-[9.5px] font-bold text-cordel-master-dark/70">
                    Statut : <strong className="text-encre-noire capitalize">{selectedEvent.statutPublication.replace('_', ' ')}</strong>
                  </span>
                )}
              </div>

              {/* Barre d'outils typographique Unicode, Palette d'émoticônes & Guide */}
              <StudioTextToolbar
                textareaRef={textareaRef}
                text={publicationText}
                onChange={setPublicationText}
                lexique={studioLexique}
                mentions={studioMentions}
                equivalences={studioEquivalences}
                onNavigateToLexique={onNavigateToView ? () => onNavigateToView('studio-lexique') : undefined}
              />

              <textarea
                ref={textareaRef}
                value={publicationText}
                onChange={(e) => setPublicationText(e.target.value)}
                rows={7}
                placeholder="Rédigez ou personnalisez votre légende ici..."
                className="theme-input w-full font-mono text-xs p-3 leading-relaxed border border-encre-noire bg-cordel-bg-light rounded-b -mt-2"
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
                  <span className="text-xs font-heading font-black uppercase tracking-wider text-center p-4">
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
                {/* Export & Validation buttons */}
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <CordelButton
                      onClick={handleDownload}
                      variant="default"
                      useExtremeBorder={true}
                      className="text-[11px] py-2.5 font-bold uppercase tracking-wider px-1 text-center"
                    >
                      💾 {t('studioSocial.downloadBtn') || "Télécharger"}
                    </CordelButton>

                    <CordelButton
                      onClick={handleCopyImage}
                      variant={imageCopied ? "vert" : "default"}
                      useExtremeBorder={true}
                      className="text-[11px] py-2.5 font-bold uppercase tracking-wider px-1 text-center"
                      title="Copier le visuel PNG dans le presse-papier (Clipboard API)"
                    >
                      {imageCopied ? "✓ Copiée !" : "🖼️ Copier"}
                    </CordelButton>
                    
                    <CordelButton
                      onClick={handleShare}
                      variant="ocre"
                      useExtremeBorder={true}
                      className="text-[11px] py-2.5 font-bold uppercase tracking-wider px-1 text-center"
                    >
                      🔗 {t('studioSocial.shareBtn') || "Partager"}
                    </CordelButton>
                  </div>

                  <CordelButton
                    onClick={handleSendForValidation}
                    variant={selectedEvent.statutPublication === 'approuve' ? "vert" : "jaune"}
                    useExtremeBorder={true}
                    disabled={sendingValidation}
                    className="w-full text-xs py-2.5 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {sendingValidation
                      ? "Envoi en cours..."
                      : selectedEvent.statutPublication === 'approuve'
                      ? "✅ Déjà approuvé (Renvoyer mise à jour)"
                      : selectedEvent.statutPublication === 'en_attente'
                      ? "⏳ En attente (Renvoyer révision)"
                      : "💬 Soumettre pour validation (Forum)"}
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
