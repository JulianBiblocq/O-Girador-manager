import React from 'react';

/**
 * Composant d'attente "En Construction / Mode Brouillon" pour les visiteurs externes
 * lorsque le site vitrine n'est pas encore publié (isPublished === false).
 * 
 * @param {Object} props
 * @param {string} props.associationName - Nom de l'association.
 * @param {string} props.logoUrl - Logo de l'association.
 * @param {Object} props.publicTheme - Thème public de l'association.
 * @param {Function} props.onOpenLogin - Callback pour ouvrir la modale de connexion.
 */
export default function PublicMaintenancePage({
  associationName = 'O Girador',
  logoUrl = '',
  publicTheme = {},
  onOpenLogin
}) {
  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--public-bg, #FAF6EE)',
        fontFamily: 'var(--public-font-body, sans-serif)',
        color: 'var(--public-text, #1C1917)'
      }}
    >
      {/* Watermark Logo d'arrière-plan */}
      {logoUrl && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none w-3/4 max-w-md mix-blend-multiply">
          <img 
            src={logoUrl} 
            alt="Watermark Logo" 
            className="w-full h-full object-contain filter grayscale" 
          />
        </div>
      )}

      {/* En-tête simple */}
      <header className="relative z-10 w-full py-6 px-6 sm:px-12 flex items-center justify-between border-b border-stone-300/40 backdrop-blur-xs bg-[#FAF6EE]/80">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt={associationName} 
              className="w-10 h-10 object-contain rounded p-1 bg-white border border-stone-300 shadow-xs"
            />
          )}
          <span 
            className="text-lg font-bold uppercase tracking-wider text-stone-900"
            style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
          >
            {associationName}
          </span>
        </div>

        {/* Bouton d'accès réservé aux membres */}
        {onOpenLogin && (
          <button
            type="button"
            onClick={onOpenLogin}
            className="text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border-2 border-stone-800 bg-stone-900 text-white hover:bg-stone-800 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔐 Espace Membres / Connexion</span>
          </button>
        )}
      </header>

      {/* Corps Principal - Message "En cours de préparation" */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center my-auto">
        <div className="max-w-xl w-full bg-white/90 backdrop-blur-md rounded-2xl border-2 border-stone-300 p-8 sm:p-12 shadow-xl flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-inner animate-pulse">
            🚧
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 self-center">
              Site en cours de préparation
            </span>
            <h1 
              className="text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight mt-2"
              style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
            >
              Revenez très bientôt !
            </h1>
          </div>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-medium">
            Le site vitrine officiel de l'association <strong className="text-stone-900">{associationName}</strong> est actuellement en cours de préparation par notre équipe.
          </p>

          <div className="p-4 bg-[#FAF6EE] border border-dashed border-stone-300 rounded-xl text-xs text-stone-700 leading-normal w-full">
            🎶 Nous peaufinons le programme de nos prochains ateliers, prestations scéniques, défilés et inscriptions.
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-stone-500 font-medium border-t border-stone-300/40 bg-[#FAF6EE]/80">
        © {new Date().getFullYear()} {associationName} — Propulsé par O Girador
      </footer>
    </div>
  );
}
