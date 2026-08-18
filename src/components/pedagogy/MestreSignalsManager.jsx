import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import useConfirm from '../../hooks/useConfirm';

export default function MestreSignalsManager({ profileData }) {
  const { confirm } = useConfirm();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'visuel', // visuel, sonore, autre
    imageUrl: ''
  });

  const fetchSignals = async () => {
    setLoading(true);
    try {
      // NOTE: For now mestre_signals is global, but we could filter by groupId if needed in the future.
      const querySnapshot = await getDocs(collection(db, 'mestre_signals'));
      const data = [];
      querySnapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data() });
      });
      // Sort by name
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setSignals(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des signaux :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', type: 'visuel', imageUrl: '' });
  };

  const handleEdit = (signal) => {
    setEditingId(signal.id);
    setFormData({
      name: signal.name || '',
      description: signal.description || '',
      type: signal.type || 'visuel',
      imageUrl: signal.imageUrl || ''
    });
  };

  const handleDelete = async (id) => {
    const isOk = await confirm("Voulez-vous vraiment supprimer ce signal ? Il ne sera plus disponible dans les quiz.");
    if (!isOk) return;
    try {
      await deleteDoc(doc(db, 'mestre_signals', id));
      setSignals(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        imageUrl: formData.imageUrl.trim(),
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'mestre_signals', editingId), payload);
        setSignals(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s));
      } else {
        payload.createdAt = new Date().toISOString();
        // Optionnel : lier au groupId actuel si on veut les scinder plus tard
        if (profileData?.groupId) payload.groupId = profileData.groupId;
        
        const docRef = await addDoc(collection(db, 'mestre_signals'), payload);
        setSignals(prev => [...prev, { id: docRef.id, ...payload }].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
      resetForm();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      alert("Erreur lors de l'enregistrement du signal.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center opacity-50 animate-pulse font-black uppercase text-xs">Chargement des signaux...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-dashed border-cordel-wood/30 pb-4">
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider text-cordel-wood">
            Configuration des Signaux
          </h3>
          <p className="text-xs text-encre-noire/70 mt-1">
            Gérez la liste des signaux (visuels, sonores...) utilisés par le Mestre pour diriger la Roda. Ces signaux apparaîtront automatiquement dans les Quiz des rythmes.
          </p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Formulaire d'ajout/édition */}
        <div className="w-full xl:w-1/3 sticky top-4">
          <CordelCard variant="default" className="p-5">
            <h4 className="font-black text-xs uppercase tracking-widest text-cordel-wood mb-4 pb-2 border-b-2 border-dashed border-cordel-wood/30">
              {editingId ? '✏️ Modifier le signal' : '➕ Nouveau signal'}
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-encre-noire/60 mb-1">Nom du signal</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Signal d'arrêt, Appel aux agbês..."
                  className="w-full p-2 text-xs border-2 border-encre-noire/20 rounded focus:outline-none focus:border-cordel-wood bg-[#fdfaf2]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase text-encre-noire/60 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 text-xs border-2 border-encre-noire/20 rounded focus:outline-none focus:border-cordel-wood bg-[#fdfaf2]"
                >
                  <option value="visuel">👁️ Visuel (Geste, Main, Regard)</option>
                  <option value="sonore">🔊 Sonore (Sifflet / Apito, Voix)</option>
                  <option value="autre">🧩 Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-encre-noire/60 mb-1">Description / Geste</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ex: Bras levé avec poing fermé..."
                  className="w-full p-2 text-xs border-2 border-encre-noire/20 rounded focus:outline-none focus:border-cordel-wood bg-[#fdfaf2] min-h-[80px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-encre-noire/60 mb-1">URL de l'image / GIF</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full p-2 text-xs border-2 border-encre-noire/20 rounded focus:outline-none focus:border-cordel-wood bg-[#fdfaf2]"
                />
              </div>

              <div className="flex gap-2 mt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 text-[10px] font-black uppercase border-2 border-encre-noire/20 text-encre-noire/60 rounded hover:bg-neutral-100 transition-colors"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="flex-1 py-2 text-[10px] font-black uppercase bg-cordel-wood text-white rounded shadow hover:bg-[#6a1f12] transition-colors disabled:opacity-50"
                >
                  {saving ? '...' : (editingId ? 'Mettre à jour' : 'Ajouter')}
                </button>
              </div>
            </form>
          </CordelCard>
        </div>

        {/* Liste des signaux */}
        <div className="w-full xl:w-2/3 flex flex-col gap-3">
          {signals.length === 0 ? (
            <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
              <p className="text-sm font-bold">Aucun signal n'a encore été configuré.</p>
            </div>
          ) : (
            signals.map(signal => (
              <div key={signal.id} className="flex justify-between items-start p-4 bg-white border-2 border-encre-noire/10 hover:border-cordel-wood/50 rounded shadow-sm transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" title={signal.type === 'visuel' ? 'Signal visuel' : (signal.type === 'sonore' ? 'Signal sonore' : 'Autre')}>
                      {signal.type === 'visuel' ? '👁️' : (signal.type === 'sonore' ? '🔊' : '🧩')}
                    </span>
                    <h4 className="text-sm font-black text-encre-noire">{signal.name || signal.nom || 'Sans nom'}</h4>
                  </div>
                  <p className="text-xs text-encre-noire/70 ml-7">{signal.description}</p>
                </div>
                
                {signal.imageUrl && (
                  <div className="mx-4 flex-shrink-0">
                    <img src={signal.imageUrl} alt={signal.name} className="h-10 w-10 object-cover rounded shadow-sm border border-encre-noire/10" />
                  </div>
                )}
                
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <button
                    onClick={() => handleEdit(signal)}
                    className="p-2 text-encre-noire/40 hover:text-cordel-wood transition-colors"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(signal.id)}
                    className="p-2 text-encre-noire/40 hover:text-cordel-rouge transition-colors"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
