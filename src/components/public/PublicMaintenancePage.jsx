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
  const handleLoginClick = () => {
    if (onOpenLogin) onOpenLogin();
    else window.location.href = '/login';
  };

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

      {/* En-tête avec Logo et Bouton Espace Membre */}
      <header className="relative z-10 w-full py-5 px-6 sm:px-12 flex items-center justify-between border-b border-stone-300/40 backdrop-blur-xs bg-[#FAF6EE]/80">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt={associationName} 
              className="w-10 h-10 object-contain rounded p-1 bg-white border border-stone-300 shadow-xs"
            />
          )}
          <span 
            className="text-base sm:text-lg font-bold uppercase tracking-wider text-stone-900"
            style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
          >
            {associationName}
          </span>
        </div>

        {/* Bouton Espace Membre en haut */}
        <button
          type="button"
          onClick={handleLoginClick}
          className="text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-lg border-2 border-stone-900 bg-stone-900 text-white hover:bg-amber-400 hover:text-stone-950 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🔐 Espace Membre</span>
        </button>
      </header>

      {/* Panneau Central Épuré : EN CONSTRUCTION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center my-auto">
        <div className="max-w-lg w-full bg-white/95 backdrop-blur-md rounded-2xl border-2 border-stone-300 p-8 sm:p-12 shadow-xl flex flex-col items-center gap-6">
          
          {/* Panneau Icône */}
          <div className="w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-500 flex items-center justify-center text-4xl shadow-md animate-bounce">
            🚧
          </div>

          <div className="flex flex-col gap-2">
            <h1 
              className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-stone-900 leading-tight"
              style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
            >
              EN CONSTRUCTION
            </h1>
            <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed mt-1">
              Le site web de l'association <strong className="text-stone-900">{associationName}</strong> est actuellement en cours de préparation.
            </p>
          </div>

          {/* Bouton Central Espace Membre */}
          <div className="pt-2 w-full flex justify-center">
            <button
              type="button"
              onClick={handleLoginClick}
              className="w-full sm:w-auto text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl border-2 border-stone-900 bg-stone-900 text-white hover:bg-amber-400 hover:text-stone-950 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔑 Accéder à l'Espace Membre / Connexion</span>
            </button>
          </div>
        </div>
      </main>

      {/* Pied de page épuré */}
      <footer className="relative z-10 w-full py-4 px-6 text-center text-xs text-stone-500 font-medium border-t border-stone-300/40 bg-[#FAF6EE]/80">
        © {new Date().getFullYear()} {associationName} — Propulsé par O Girador
      </footer>
    </div>
  );
}
