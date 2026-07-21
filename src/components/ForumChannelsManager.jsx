import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloMegaphone } from './XiloIcons';

/**
 * ForumChannelsManager Component
 * Admin tool for managing hierarchical forum categories, channels, and subfolders (3 levels).
 */
export default function ForumChannelsManager({ groupId, role, isSystemAdmin, onBack }) {
  const { t } = useTranslation();
  
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [readRoles, setReadRoles] = useState(['all']);
  const [writeRoles, setWriteRoles] = useState(['all']);
  const [saving, setSaving] = useState(false);

  const rolesOptions = [
    { value: 'all', label: 'Tout le monde' },
    { value: 'mestre', label: 'Mestre' },
    { value: 'super-admin', label: 'Super Admin' },
    { value: 'ca', label: 'CA' },
    { value: 'bureau', label: 'Bureau' },
    { value: 'membre', label: 'Membre' }
  ];

  // 1. Sync available channels
  useEffect(() => {
    if (!groupId) return;
    const channelsRef = collection(db, 'forum_channels');
    const q = query(channelsRef, where('groupId', '==', groupId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      // Sort: Général first, CA, Bureau, then alphabetical
      const order = ["Général", "CA", "Bureau"];
      fetched.sort((a, b) => {
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
      setChannels(fetched);
      setLoading(false);
    }, (err) => {
      console.error("ForumChannelsManager - Error syncing channels:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 2. Sync association tags
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAvailableTags(data.tagsDisponibles || []);
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleOpenCreate = (defaultParentId = null) => {
    setIsEditing(true);
    setEditingChannelId(null);
    setName('');
    setParentId(defaultParentId);
    setReadRoles(['all']);
    setWriteRoles(['all']);
  };

  const handleOpenEdit = (ch) => {
    setIsEditing(true);
    setEditingChannelId(ch.id);
    setName(ch.name);
    setParentId(ch.parentId || null);
    setReadRoles(ch.readRoles || ['all']);
    setWriteRoles(ch.writeRoles || ['all']);
  };

  const handleToggleReadRole = (value) => {
    if (value === 'all') {
      setReadRoles(['all']);
    } else {
      setReadRoles(prev => {
        const filtered = prev.filter(r => r !== 'all');
        if (filtered.includes(value)) {
          const next = filtered.filter(r => r !== value);
          return next.length === 0 ? ['all'] : next;
        } else {
          return [...filtered, value];
        }
      });
    }
  };

  const handleToggleWriteRole = (value) => {
    if (value === 'all') {
      setWriteRoles(['all']);
    } else {
      setWriteRoles(prev => {
        const filtered = prev.filter(r => r !== 'all');
        if (filtered.includes(value)) {
          const next = filtered.filter(r => r !== value);
          return next.length === 0 ? ['all'] : next;
        } else {
          return [...filtered, value];
        }
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const channelData = {
        groupId,
        name: name.trim(),
        parentId: parentId || null,
        readRoles,
        writeRoles,
        updatedAt: new Date().toISOString()
      };

      if (editingChannelId) {
        await updateDoc(doc(db, 'forum_channels', editingChannelId), channelData);
      } else {
        channelData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'forum_channels'), channelData);
      }

      setIsEditing(false);
      setName('');
      setParentId(null);
      setReadRoles(['all']);
      setWriteRoles(['all']);
      setEditingChannelId(null);
    } catch (err) {
      console.error("ForumChannelsManager - Save error:", err);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chId, chName) => {
    if (chName === 'Général') {
      alert("Le salon Général ne peut pas être supprimé.");
      return;
    }
    const confirm = window.confirm(`Voulez-vous vraiment supprimer le salon "${chName}" ? Toutes les discussions associées à ce salon et ses sous-dossiers seront également supprimées.`);
    if (!confirm) return;

    setSaving(true);
    try {
      // 1. Delete the channel document
      await deleteDoc(doc(db, 'forum_channels', chId));

      // 2. Query and delete all child channels
      const childChannels = channels.filter(c => c.parentId === chId);
      for (const child of childChannels) {
        await deleteDoc(doc(db, 'forum_channels', child.id));
      }

      // 3. Query and delete all threads inside this channel
      const forumRef = collection(db, 'forum');
      const q = query(forumRef, where('channelId', '==', chId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(doc(db, 'forum', docSnap.id));
      });
      await batch.commit();

      alert(`Le salon "${chName}" a été supprimé.`);
    } catch (err) {
      console.error("ForumChannelsManager - Delete error:", err);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to render channel tree row
  const renderChannelRow = (ch, level = 0) => {
    const childChannels = channels.filter(c => c.parentId === ch.id);

    return (
      <React.Fragment key={ch.id}>
        <CordelCard
          variant="default"
          useExtremeBorder={false}
          className={`p-3 bg-cordel-bg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${
            level > 0 ? 'ml-4 border-l-2 border-dashed border-cordel-wood/40 bg-white/40' : ''
          }`}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
                {level === 0 ? '📂' : level === 1 ? '📁' : '📄'} {ch.name}
              </span>
              {ch.name === 'Général' && (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px]">Par défaut</span>
              )}
              {ch.parentId && (
                <span className="theme-stamp-badge theme-stamp-badge-ocre text-[7px]">Sous-salon</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-cordel-master-dark opacity-80">
              <span>Lecture : <b>{ch.readRoles?.join(', ') || 'Tout le monde'}</b></span>
              <span>•</span>
              <span>Écriture : <b>{ch.writeRoles?.join(', ') || 'Tout le monde'}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleOpenCreate(ch.id)}
              className="text-[9px] font-bold px-2 py-1 bg-cordel-bg-light border border-encre-noire rounded hover:bg-white cursor-pointer"
              title="Ajouter un sous-dossier dans ce salon"
            >
              + Sous-dossier
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(ch)}
              className="text-[9px] font-bold px-2 py-1 bg-cordel-bg-light border border-encre-noire rounded hover:bg-white cursor-pointer"
            >
              ✏️ Éditer
            </button>
            {ch.name !== 'Général' && (
              <button
                type="button"
                onClick={() => handleDelete(ch.id, ch.name)}
                className="text-[9px] font-bold px-2 py-1 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 cursor-pointer"
              >
                🗑️
              </button>
            )}
          </div>
        </CordelCard>

        {/* Render nested children */}
        {childChannels.map(child => renderChannelRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const rootChannels = channels.filter(c => !c.parentId);

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs font-bold uppercase">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-black tracking-wider text-cordel-wood uppercase flex items-center gap-2">
          📁 Gestion des Salons & Catégories du Forum
        </span>
        <div className="w-12"></div>
      </div>

      <div className="flex justify-between items-center bg-white/40 p-3 rounded border border-dashed border-cordel-master-dark/20">
        <p className="text-xs text-cordel-master-dark opacity-80">
          Organisez les salons du Porte-voix en catégories et sous-dossiers (ex: Général &gt; Les 30 ans &gt; Bénévoles).
        </p>
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={() => handleOpenCreate(null)}
          className="text-[10px] px-3 py-1.5 font-black uppercase tracking-wider shrink-0"
        >
          + Nouvelle Catégorie / Salon
        </CordelButton>
      </div>

      {/* Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-lg">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase">
                  {editingChannelId ? '✏️ Modifier le salon' : '➕ Nouveau Salon / Sous-dossier'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                {/* Parent Selection */}
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Emplacement / Dossier Parent
                  </label>
                  <select
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value || null)}
                    className="theme-input text-xs font-bold bg-white"
                  >
                    <option value="">📂 Racine (Catégorie principale)</option>
                    {channels.filter(c => c.id !== editingChannelId).map(ch => (
                      <option key={ch.id} value={ch.id}>
                        {ch.parentId ? '  └─ ' : '📁 '} {ch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Nom du Salon / Sous-dossier *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Les 30 ans, Bénévoles, Concerts..."
                    required
                    disabled={saving}
                    className="theme-input text-xs font-bold w-full"
                  />
                </div>

                {/* Read Permissions */}
                <div className="flex flex-col gap-1.5 text-left border-t border-dashed border-cordel-master-dark/15 pt-3">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Qui peut LIRE et ACCÉDER à ce salon ?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {rolesOptions.map(opt => {
                      const isSel = readRoles.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleToggleReadRole(opt.value)}
                          className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded border transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-cordel-wood text-white border-encre-noire shadow-sm'
                              : 'bg-white/50 text-cordel-master-dark border-cordel-master-dark/20'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Write Permissions */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                    Qui peut ÉCRIRE et CRÉER DES SUJETS dans ce salon ?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {rolesOptions.map(opt => {
                      const isSel = writeRoles.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleToggleWriteRole(opt.value)}
                          className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded border transition-all cursor-pointer ${
                            isSel 
                              ? 'bg-cordel-wood text-white border-encre-noire shadow-sm'
                              : 'bg-white/50 text-cordel-master-dark border-cordel-master-dark/20'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={saving || !name.trim()}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer le salon"}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}

      {/* Tree view list */}
      {loading ? (
        <div className="py-8 text-center text-xs opacity-60 animate-pulse">⏳ Chargement de l'arborescence...</div>
      ) : rootChannels.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center bg-cordel-bg">
          <p className="text-xs italic text-cordel-master-dark/70">Aucun salon configuré.</p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-2">
          {rootChannels.map(ch => renderChannelRow(ch, 0))}
        </div>
      )}
    </div>
  );
}
