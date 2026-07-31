import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Composant de formulaire public d'abonnement à la Newsletter.
 * Collecte les adresses e-mails des fans et visiteurs sur le site vitrine,
 * puis les enregistre dans la collection Firestore `newsletter_subscribers`.
 * 
 * @param {Object} props
 * @param {string} [props.groupId] - ID de l'association actuelle.
 * @param {string} [props.variant] - Variant d'affichage ('card' ou autonome).
 * @param {Object} [props.publicTheme] - Thème et textes dynamiques de la vitrine.
 */
export default function PublicNewsletterForm({ groupId, variant = 'card', publicTheme = {} }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const badgeNewsletter = vitrineTexts.badgeNewsletter || (variant === 'card' ? "Infolettre & Actualités" : "Infolettre & Prestations");
  const titreNewsletter = vitrineTexts.titreNewsletter || (variant === 'card' ? "Infolettre & Actualités" : "Abonnez-vous à notre Newsletter");
  const accrocheNewsletter = vitrineTexts.accrocheNewsletter || "Recevez nos prochaines dates de prestations, défilés et actualités du groupe directement dans votre boîte mail.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      // Enregistrement de l'abonné dans Firestore (collection newsletter_subscribers)
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: cleanEmail,
        dateInscription: new Date().toISOString(),
        createdAt: serverTimestamp(),
        source: 'vitrine',
        groupId: groupId || ''
      });

      setSubmittedSuccess(true);
      setEmail('');
    } catch (err) {
      console.error("Erreur lors de l'inscription à la newsletter:", err);
      setErrorMessage("Une erreur s'est produite lors de votre inscription. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // Rendu sous forme de carte blanche pour la grille 3 colonnes ("Nous Programmer")
  if (variant === 'card') {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between gap-5">
        <div className="flex flex-col gap-4">
          <h3 
            className="text-xl font-bold border-b border-stone-100 pb-3 flex items-center gap-2"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)' 
            }}
          >
            <span>📬 {titreNewsletter}</span>
          </h3>

          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
            {accrocheNewsletter}
          </p>

          {submittedSuccess ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex flex-col items-center gap-2 text-center animate-fade-in">
              <span className="text-xl">🎉</span>
              <p>Merci ! Vous êtes bien inscrit(e) à notre newsletter.</p>
              <button
                type="button"
                onClick={() => setSubmittedSuccess(false)}
                className="text-[11px] underline text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Inscrire une autre adresse
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="votre.email@exemple.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-stone-800 text-xs sm:text-sm placeholder-stone-400 focus:outline-none focus:border-stone-500 font-medium bg-stone-50/50"
              />

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                  color: 'var(--public-btn-text, #FFFFFF)',
                  fontFamily: 'var(--public-font-heading, sans-serif)'
                }}
              >
                {submitting ? '⏳ Inscription...' : "S'inscrire à l'infolettre"}
              </button>
            </form>
          )}

          {errorMessage && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded border border-red-200 text-center">
              ⚠️ {errorMessage}
            </p>
          )}
        </div>

        <div className="border-t border-stone-100 pt-3">
          <span className="text-[11px] text-stone-500 font-medium block text-center">
            🔒 Pas de spam. Désinscription à tout moment.
          </span>
        </div>
      </div>
    );
  }

  // Rendu autonome par défaut
  return (
    <section className="py-12 bg-stone-900 text-white border-t border-stone-800 relative overflow-hidden select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-6">
        
        {/* En-tête du bloc Newsletter */}
        <div className="flex flex-col items-center gap-2">
          <span 
            className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded text-white shadow-xs"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          >
            {badgeNewsletter}
          </span>

          <h3 
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase"
            style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
          >
            📬 {titreNewsletter}
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 max-w-lg leading-relaxed">
            {accrocheNewsletter}
          </p>
        </div>

        {/* Message de succès convivial */}
        {submittedSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-900/80 border border-emerald-500 text-emerald-100 text-sm font-semibold max-w-md w-full flex flex-col items-center gap-2 animate-fade-in shadow-lg">
            <span className="text-xl">🎉</span>
            <p>Merci ! Vous êtes bien inscrit(e) à notre newsletter.</p>
            <button
              type="button"
              onClick={() => setSubmittedSuccess(false)}
              className="text-xs underline text-emerald-300 hover:text-white mt-1 cursor-pointer"
            >
              Inscrire un autre e-mail
            </button>
          </div>
        ) : (
          /* Formulaire de saisie d'e-mail */
          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="votre.email@exemple.com"
              className="flex-1 px-4 py-3 rounded-lg bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-all font-medium"
            />

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--public-primary, #D32F2F)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              {submitting ? '⏳ Validation...' : "S'inscrire"}
            </button>
          </form>
        )}

        {/* Message d'erreur le cas échéant */}
        {errorMessage && (
          <p className="text-xs font-semibold text-red-400 bg-red-950/60 px-3 py-1.5 rounded border border-red-800">
            ⚠️ {errorMessage}
          </p>
        )}

        <span className="text-[11px] text-stone-500 font-medium">
          🔒 Pas de spam. Vous pourrez vous désinscrire à tout moment.
        </span>
      </div>
    </section>
  );
}
