import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, or, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTerminologie } from '../hooks/useTerminologie';
import EmojiPickerPopover, { EmojiQuickRow } from './forum/EmojiPickerPopover';

export default function PrivateChatView({ user, otherUser, profileData, initialText = '', onClose }) {
  const { tRole } = useTerminologie();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialText || '');
  const [sending, setSending] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Mettre à jour la saisie si un texte initial spécifique (ex: voeu d'anniversaire) est fourni
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  const otherUserFullName = `${otherUser?.prenom || ''} ${otherUser?.nom || ''}`.trim() || otherUser?.email || "Membre";

  // Real-time subscribe to messages between current user and other user
  useEffect(() => {
    if (!user?.uid || !otherUser?.id) return;

    const messagesRef = collection(db, 'private_messages');
    const q = query(
      messagesRef,
      or(
        where('senderId', '==', user.uid),
        where('recipientId', '==', user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Filtrer locally to obtenir messages only between this specific pair
        const isBetweenUs = (data.senderId === user.uid && data.recipientId === otherUser.id) ||
                            (data.senderId === otherUser.id && data.recipientId === user.uid);
        if (isBetweenUs) {
          fetched.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      // Trier chronologically
      fetched.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(fetched);

      // Auto mark messages from other user as read
      fetched.forEach((msg) => {
        if (msg.recipientId === user.uid && msg.senderId === otherUser.id && !msg.read) {
          updateDoc(doc(db, 'private_messages', msg.id), {
            read: true
          }).catch(err => {
            console.error("PrivateChatView - Failed to mark message as read:", err);
          });
        }
      });
    }, (error) => {
      console.error("PrivateChatView - Error syncing private messages:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, otherUser?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'private_messages'), {
        senderId: user.uid,
        recipientId: otherUser.id,
        content: trimmed,
        timestamp: new Date().toISOString(),
        read: false,
        groupId: profileData?.groupId || ''
      });
      setInputText('');
    } catch (err) {
      console.error("PrivateChatView - Error sending message:", err);
      alert("Erreur lors de l'envoi du message : " + (err.message || err));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[500px] border-2 border-encre-noire rounded-[8px_12px_10px_9px] shadow-[4px_4px_0px_0px_#181716] overflow-hidden bg-cordel-bg text-left select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-encre-noire/20 p-3 bg-white/40 dark:bg-black/10">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
          >
            ⬅️
          </button>
          
          <div className="flex items-center gap-2">
            <XiloAvatar src={otherUser?.photoURL} name={otherUserFullName} size={36} />
            <div className="flex flex-col">
              <span className="font-extrabold text-xs text-encre-noire">
                {otherUserFullName}
              </span>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-0.5 self-start scale-90 origin-left">
                {tRole(otherUser?.role || 'membre', otherUser?.genre)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-cordel-bg-light/40">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center opacity-50 select-none">
            <span className="text-xl mb-2">✉️</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Aucun message. Lancez la discussion !</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.uid;
            return (
              <div 
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-[8px_12px_10px_9px] border-2 border-encre-noire flex flex-col gap-1 ${
                    isMe 
                      ? 'bg-cordel-wood text-cordel-bg-light shadow-[2.5px_2.5px_0px_0px_rgba(24,23,22,0.15)] rounded-tr-none' 
                      : 'bg-white text-encre-noire shadow-[2.5px_2.5px_0px_0px_rgba(24,23,22,0.15)] rounded-tl-none'
                  }`}
                >
                  <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed select-text">
                    {msg.content}
                  </p>
                  <span className={`text-[8px] font-black uppercase text-right opacity-60 self-end ${
                    isMe ? 'text-cordel-bg-light' : 'text-encre-noire'
                  }`}>
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Bar avec ligne d'émoticônes */}
      <div className="flex flex-col border-t-2 border-dashed border-encre-noire/20 p-2.5 bg-white/40 dark:bg-black/10 select-none">
        {/* Ligne d'accès direct aux émoticônes fréquents */}
        <div className="flex items-center gap-1.5 px-1 pb-1.5">
          <span className="text-[8px] font-black uppercase text-cordel-wood opacity-75 shrink-0">
            Émojis :
          </span>
          <EmojiQuickRow
            onSelectEmoji={(emoji) => setInputText(prev => (prev || '') + emoji)}
            onOpenFullPicker={() => setIsEmojiPickerOpen(prev => !prev)}
            className="flex-1"
          />
        </div>

        <form 
          onSubmit={handleSendMessage}
          className="relative flex items-center gap-2"
        >
          {isEmojiPickerOpen && (
            <EmojiPickerPopover
              onSelectEmoji={(emoji) => {
                setInputText(prev => (prev || '') + emoji);
                setIsEmojiPickerOpen(false);
              }}
              onClose={() => setIsEmojiPickerOpen(false)}
            />
          )}

          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(prev => !prev)}
            className={`w-9 h-[38px] flex items-center justify-center text-sm rounded border-2 transition-all cursor-pointer shrink-0 ${
              isEmojiPickerOpen
                ? 'bg-cordel-wood text-white border-encre-noire'
                : 'bg-cordel-bg hover:bg-white border-encre-noire/40'
            }`}
            title="Choisir un émoticône"
          >
            😀
          </button>

          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Rédiger un message..."
            disabled={sending}
            className="theme-input text-xs font-bold py-2 bg-cordel-bg-light flex-grow"
          />
          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            disabled={sending || !inputText.trim()}
            className="px-4 py-2 text-[10px] font-black uppercase tracking-wider min-h-[38px] shrink-0"
          >
            Envoyer
          </CordelButton>
        </form>
      </div>
    </div>
  );
}
