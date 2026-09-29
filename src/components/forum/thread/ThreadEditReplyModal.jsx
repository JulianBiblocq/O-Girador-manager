import React from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import RichTextEditor from '../../RichTextEditor';

/**
 * Modale d'édition rapide d'une réponse existante
 */
export default function ThreadEditReplyModal({
  editingData,
  onClose,
  onChangeText,
  onSave,
  disabled = false,
  groupId = null
}) {
  if (!editingData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-md">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
            <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase">
              ✏️ Éditer le message
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={onSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] font-black uppercase text-cordel-master-dark">
                Message *
              </label>
              <RichTextEditor
                value={editingData.text}
                onChange={onChangeText}
                disabled={disabled}
                placeholder="Message..."
                groupId={groupId}
                minHeight="120px"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                type="button"
                variant="default"
                onClick={onClose}
                disabled={disabled}
                className="py-2 px-4 text-xs font-bold uppercase"
              >
                Annuler
              </CordelButton>
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={disabled || !editingData.text.trim()}
                className="py-2 px-4 text-xs font-black uppercase tracking-wider"
              >
                {disabled ? "Enregistrement..." : "Enregistrer"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
