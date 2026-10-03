import React, { useState } from 'react';
import CordelButton from '../CordelButton';
import KitItemRow from './KitItemRow';
import { useModalEscape } from '../../hooks/useModalEscape';

/**
 * Modale de contrôle et d'inventaire détaillé d'une mallette ou trousse collective régie.
 *
 * @param {Object} props
 */
export default function KitDetailModal({ isOpen, onClose, kit, onUpdateKit, currentUser }) {
  const [items, setItems] = useState(kit?.items || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTarget, setNewItemTarget] = useState(1);
  const [saving, setSaving] = useState(false);
  const [orderAlertMessage, setOrderAlertMessage] = useState('');

  // Fermeture accessible avec la touche Échap
  useModalEscape(isOpen, onClose, saving);

  if (!isOpen || !kit) return null;

  const handleUpdateItem = (itemId, updates) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
  };

  const handleRemoveItem = (itemId) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      nom: newItemName.trim(),
      quantiteCible: Number(newItemTarget) || 1,
      quantiteActuelle: Number(newItemTarget) || 1,
      statut: 'ok',
      stockReserveLocal: 0
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemTarget(1);
  };

  const handleSave = async (signNow = false) => {
    setSaving(true);
    try {
      const verifDate = signNow ? new Date().toISOString() : kit.derniereVerification;
      const verifNom = signNow
        ? `${currentUser?.prenom || ''} ${currentUser?.nom || ''}`.trim() || 'Régisseur'
        : kit.verifieParNom || 'Régie';

      await onUpdateKit(kit.id, {
        items,
        derniereVerification: verifDate,
        verifieParNom: verifNom
      });
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement kit :", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignalOrder = (itemName) => {
    setOrderAlertMessage(`🛒 « ${itemName} » ajouté à la liste des besoins régie pour commande groupée !`);
    setTimeout(() => setOrderAlertMessage(''), 3500);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col bg-[var(--color-cordel-papier,#fdfbf7)] text-[var(--color-cordel-encre,#181716)] rounded-xl border-2 border-[var(--theme-border-color,#181716)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête (Fixe) */}
        <div className="shrink-0 px-4 py-3 border-b-2 border-[var(--theme-border-color,#181716)] bg-[var(--color-cordel-papier-card,#f5efe6)] flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm m-0 leading-tight">🧰 {kit.nom}</h3>
            <span className="text-[11px] text-[var(--color-cordel-marron,#8b5e34)] block">📍 {kit.emplacement || 'Emplacement non défini'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/10 text-neutral-600 transition-colors">✕</button>
        </div>

        {/* Notification alerte commande */}
        {orderAlertMessage && (
          <div className="shrink-0 px-3 py-1.5 bg-amber-100 text-amber-900 border-b border-amber-300 text-xs font-bold text-center animate-in fade-in">
            {orderAlertMessage}
          </div>
        )}

        {/* Corps de la modale (Défilable) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3 text-xs text-left">
          {/* Signature dernière vérification */}
          <div className="p-2.5 rounded bg-white/70 border border-neutral-300 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-neutral-500 block">Dernier contrôle régie :</span>
              <span className="font-semibold text-xs">
                {kit.derniereVerification ? new Date(kit.derniereVerification).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais vérifié'}
                {kit.verifieParNom && ` (par ${kit.verifieParNom})`}
              </span>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded hover:opacity-90 transition-opacity"
            >
              ✍️ Signer la vérification maintenant
            </button>
          </div>

          {/* Tableau des articles */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-cordel-marron,#8b5e34)] block">
              Contenu de la trousse ({items.length} article{items.length > 1 ? 's' : ''}) :
            </span>

            {items.map((item) => (
              <KitItemRow
                key={item.id}
                item={item}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={handleRemoveItem}
                onSignalOrder={handleSignalOrder}
              />
            ))}
          </div>

          {/* Formulaire ajout article */}
          <form onSubmit={handleAddItem} className="pt-2 border-t border-dashed border-neutral-300 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ajouter un article (ex: compresses, scotch...)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 theme-input text-xs py-1 px-2 rounded border border-neutral-300"
            />
            <input
              type="number"
              min="1"
              max="999"
              value={newItemTarget}
              onChange={(e) => setNewItemTarget(parseInt(e.target.value, 10) || 1)}
              className="w-16 theme-input text-xs py-1 px-1.5 text-center rounded border border-neutral-300"
              title="Quantité cible"
            />
            <button type="submit" className="px-3 py-1 bg-[var(--color-cordel-ocre,#c05621)] text-white rounded text-xs font-bold shrink-0">
              + Ajouter
            </button>
          </form>
        </div>

        {/* Pied de page (Fixe) */}
        <div className="shrink-0 px-4 py-3 border-t border-[var(--theme-border-color,#181716)] bg-[var(--color-cordel-papier-card,#f5efe6)] flex justify-end gap-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <button type="button" onClick={onClose} className="px-3 py-1 rounded bg-neutral-200 text-neutral-700 font-bold text-xs shrink-0">
            Fermer
          </button>
          <CordelButton variant="vert" onClick={() => handleSave(false)} disabled={saving} className="shrink-0">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
