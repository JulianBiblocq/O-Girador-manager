import React, { useState, useEffect, useRef } from 'react';

/**
 * Modale de discussion privée dédiée à l'équipage d'un véhicule de covoiturage.
 * Permet au chauffeur et aux passagers de régler les détails du trajet en temps réel.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilité de la modale
 * @param {Function} props.onClose - Fermeture de la modale
 * @param {Object} props.voiture - Données du véhicule
 * @param {string} props.eventName - Nom de l'événement
 * @param {Object} props.currentUser - Utilisateur actuel
 * @param {Function} props.onSendMessage - Fonction d'envoi (carId, text)
 */
export default function CarDiscussionModal({
  isOpen,
  onClose,
  voiture = {},
  eventName = '',
  currentUser = {},
  onSendMessage
}) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = voiture.messages || [];
  const passengers = voiture.passengers || voiture.passagers || [];

  // Défilement automatique vers le bas à l'ouverture ou lors de nouveaux messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(voiture.id, inputText.trim());
      setInputText('');
    } catch (err) {
      console.error("Erreur envoi message équipage :", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg flex flex-col h-[520px] max-h-[90vh] bg-[var(--color-cordel-papier,#fdfbf7)] text-[var(--color-cordel-encre,#181716)] rounded-xl border-2 border-[var(--theme-border-color,#181716)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête */}
        <div className="px-4 py-3 border-b-2 border-[var(--theme-border-color,#181716)] bg-[var(--color-cordel-papier-card,#f5efe6)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-cordel-encre,#181716)] m-0 leading-tight">
                Équipage de {voiture.chauffeurNom || 'Conducteur'}
              </h3>
              <span className="text-[10px] text-[var(--color-cordel-marron,#8b5e34)] block truncate max-w-[240px] sm:max-w-xs">
                {eventName || 'Événement'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 text-neutral-600 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Trombinoscope / Liste des membres de l'équipage */}
        <div className="px-3 py-2 bg-white/70 border-b border-neutral-200 text-xs flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-[9px] font-black uppercase text-neutral-500 mr-1">Équipage :</span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-cordel-papier-card,#f5efe6)] border border-neutral-300 font-bold text-[10px] flex items-center gap-1">
            👨‍✈️ {voiture.chauffeurNom} {voiture.retourDirect && <span title="Retour direct">⚡</span>}
          </span>
          {passengers.filter(p => p.isPassenger !== false && p.uid !== voiture.chauffeurId).map((p, idx) => (
            <span key={p.uid || idx} className="px-2 py-0.5 rounded bg-white border border-neutral-200 font-medium text-[10px] flex items-center gap-1">
              👤 {p.nom || p.name} {p.doitRentrerDirect && <span title="Retour direct demandé">⚡</span>}
            </span>
          ))}
        </div>

        {/* Fil de discussion */}
        <div className="flex-1 overflow-y-auto p-3.5 pb-6 space-y-2.5 text-xs bg-[var(--color-cordel-papier,#fdfbf7)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 p-4">
              <span className="text-3xl mb-2">🚗💬</span>
              <p className="font-semibold text-xs text-neutral-600">Aucun message pour le moment.</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Coordonnez ici l'heure de départ, les points de passage et les détails du voyage.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.uid;
              const timeStr = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-bold text-neutral-500 mb-0.5 px-1">
                    {isMine ? 'Vous' : msg.senderName} {timeStr && `• ${timeStr}`}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed break-words shadow-xs border ${
                      isMine
                        ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-amber-900 rounded-tr-none'
                        : 'bg-white text-neutral-900 border-neutral-300 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-2 shrink-0" />
        </div>

        {/* Zone de saisie */}
        <form onSubmit={handleSend} className="shrink-0 p-2.5 border-t border-[var(--theme-border-color,#181716)] bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Écrire un message à l'équipage..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 theme-input text-xs py-2 px-3 rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="px-3.5 py-2 bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded-lg font-bold text-xs hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1 shadow-sm shrink-0"
          >
            {sending ? '...' : 'Envoyer ➤'}
          </button>
        </form>
      </div>
    </div>
  );
}
