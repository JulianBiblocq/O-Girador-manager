import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloMegaphone } from './XiloIcons';

export default function ForumChannelsManager({ groupId, role, isSystemAdmin, onBack }) {
  const { t } = useTranslation();
  
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState([]);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [name, setName] = useState('');
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

  const handleOpenCreate = () => {
    setIsEditing(true);
    setEditingChannelId(null);
    setName('');
    setReadRoles(['all']);
    setWriteRoles(['all']);
  };

  const handleOpenEdit = (ch) => {
    setIsEditing(true);
    setEditingChannelId(ch.id);
    setName(ch.name);
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
    const confirm = window.confirm(`Voulez-vous vraiment supprimer le salon "${chName}" ? Toutes les discussions associées à ce salon seront également définitivement supprimées.`);
    if (!confirm) return;

    setSaving(true);
    try {
      // 1. Delete the channel document
      await deleteDoc(doc(db, 'forum_channels', chId));

      // 2. Query and delete all threads inside this channel
      const forumRef = collection(db, 'forum');
      const q = query(forumRef, where('channelId', '==', chId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(doc(db, 'forum', docSnap.id));
      });
      await batch.commit();
    } catch (err) {
      console.error("ForumChannelsManager - Delete error:", err);
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={onBack} 
          disabled={saving}
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center select-none"
        >
          ⬅️ Retour
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center">
          <XiloMegaphone size={14} className="inline mr-1.5" /> Gestion du Porte-voix
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement...</span>
        </div>
      ) : isEditing ? (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-4">
            {editingChannelId ? `✏️ Éditer le salon : ${name}` : '➕ Créer un nouveau salon'}
          </h3>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Nom */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Nom du salon
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving || name === 'Général'}
                placeholder="Ex : Bureau, Agbê, Répétitions..."
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Lecture Matrix */}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/15 pt-3">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                👁️ Qui peut VOIR et LIRE ce salon ?
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {rolesOptions.map(opt => {
                  const active = readRoles.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleReadRole(opt.value)}
                      disabled={saving}
                      className={`px-2 py-1 text-[10px] font-bold border rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
                        active
                          ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none'
                          : 'bg-cordel-bg border-cordel-master-dark/30 hover:border-encre-noire text-encre-noire/70'
                      }`}
                    >
                      👤 {opt.label}
                    </button>
                  );
                })}
                {availableTags.map(tag => {
                  const active = readRoles.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleReadRole(tag)}
                      disabled={saving}
                      className={`px-2 py-1 text-[10px] font-bold border rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
                        active
                          ? 'theme-bg-vert text-encre-noire border-encre-noire shadow-none'
                          : 'bg-cordel-bg border-cordel-master-dark/30 hover:border-encre-noire text-encre-noire/70'
                      }`}
                    >
                      🏷️ {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ecriture Matrix */}
            <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/15 pt-3">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                ✍️ Qui peut ÉCRIRE et RÉPONDRE dans ce salon ?
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {rolesOptions.map(opt => {
                  const active = writeRoles.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleToggleWriteRole(opt.value)}
                      disabled={saving}
                      className={`px-2 py-1 text-[10px] font-bold border rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
                        active
                          ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none'
                          : 'bg-cordel-bg border-cordel-master-dark/30 hover:border-encre-noire text-encre-noire/70'
                      }`}
                    >
                      👤 {opt.label}
                    </button>
                  );
                })}
                {availableTags.map(tag => {
                  const active = writeRoles.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleWriteRole(tag)}
                      disabled={saving}
                      className={`px-2 py-1 text-[10px] font-bold border rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
                        active
                          ? 'theme-bg-vert text-encre-noire border-encre-noire shadow-none'
                          : 'bg-cordel-bg border-cordel-master-dark/30 hover:border-encre-noire text-encre-noire/70'
                      }`}
                    >
                      🏷️ {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-dashed border-cordel-master-dark/15 pt-4 mt-2">
              <CordelButton 
                variant="default" 
                type="button" 
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-3 py-1.5 text-xs"
              >
                Annuler
              </CordelButton>
              <CordelButton 
                variant="primary" 
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-1.5 text-xs"
              >
                {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <CordelButton variant="primary" onClick={handleOpenCreate} className="px-3 py-1.5 text-xs font-black">
              ➕ Créer un salon
            </CordelButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map(ch => {
              const readCount = ch.readRoles?.length || 0;
              const writeCount = ch.writeRoles?.length || 0;
              return (
                <CordelCard key={ch.id} variant="default" useExtremeBorder={true} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
                        💬 {ch.name}
                      </h4>
                      {ch.name !== 'Général' && (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ch)}
                            className="text-xs hover:scale-105 active:scale-95 cursor-pointer"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ch.id, ch.name)}
                            className="text-xs hover:scale-105 active:scale-95 cursor-pointer"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-3 text-[10px] font-semibold text-encre-noire/80">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="opacity-65">Lecture :</span>
                        {ch.readRoles?.includes('all') ? (
                          <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded text-[9px] font-bold">Tout le monde</span>
                        ) : (
                          ch.readRoles?.map(r => (
                            <span key={r} className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[9px] font-bold">{r}</span>
                          ))
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="opacity-65">Écriture :</span>
                        {ch.writeRoles?.includes('all') ? (
                          <span className="bg-green-100 text-green-900 px-1 py-0.5 rounded text-[9px] font-bold">Tout le monde</span>
                        ) : (
                          ch.writeRoles?.map(r => (
                            <span key={r} className="bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[9px] font-bold">{r}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CordelCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
