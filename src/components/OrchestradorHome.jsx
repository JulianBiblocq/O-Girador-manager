import React from 'react';
import useSubdomainRouter from '../hooks/useSubdomainRouter';

export default function OrchestradorHome({ brandingStyle }) {
  const { urls, isLocalhost } = useSubdomainRouter();

  const handleAction = (url) => {
    if (isLocalhost && url.startsWith('/')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div style={brandingStyle} className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[var(--cordel-bg)] text-[var(--cordel-text)]">
      <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8 bg-white/60 p-8 rounded-[8px_12px_10px_8px] border-2 border-cordel-master-dark shadow-[4px_4px_0px_0px_#181716]">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 bg-white border-2 border-encre-noire rounded-full flex items-center justify-center p-2 shadow-[2px_2px_0px_0px_#181716] mb-4">
            <span className="text-4xl font-black text-cordel-wood tracking-tighter">O•G</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-cordel-master-dark">
            O Girador Hub
          </h1>
          <p className="text-sm font-medium opacity-80 max-w-md mt-2">
            La plateforme mère de l'écosystème O Girador. Accédez aux différents modules de votre association.
          </p>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
          <button
            onClick={() => window.location.href = urls.organizador}
            className="flex flex-col items-center gap-2 p-4 bg-cordel-vert text-white border-2 border-encre-noire rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <span className="text-3xl">⚙️</span>
            <span className="font-black uppercase tracking-widest text-sm">Espace Membre / Gestion</span>
          </button>
          
          <button
            onClick={() => handleAction(urls.mostrador)}
            className="flex flex-col items-center gap-2 p-4 bg-white text-cordel-master-dark border-2 border-encre-noire rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-wood/5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <span className="text-3xl">🌍</span>
            <span className="font-black uppercase tracking-widest text-sm">Découvrir la Vitrine</span>
          </button>

          <button
            onClick={() => handleAction('https://sequenceur.o-girador.com')}
            className="flex flex-col items-center gap-2 p-4 bg-white text-[#d99f4d] border-2 border-encre-noire rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] hover:bg-[#d99f4d]/10 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <span className="text-3xl">🎛️</span>
            <span className="font-black uppercase tracking-widest text-sm text-cordel-master-dark">Séquenceur</span>
          </button>

          <button
            onClick={() => handleAction('https://dancador.o-girador.com')}
            className="flex flex-col items-center gap-2 p-4 bg-white text-cordel-rouge border-2 border-encre-noire rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-rouge/5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <span className="text-3xl">💃</span>
            <span className="font-black uppercase tracking-widest text-sm text-cordel-master-dark">Dançador</span>
          </button>
        </div>
      </div>
    </div>
  );
}
