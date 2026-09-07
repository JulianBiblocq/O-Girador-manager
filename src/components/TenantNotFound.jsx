import React from 'react';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 bg-[var(--theme-bg)] px-4 text-center">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="text-4xl font-bold text-[var(--theme-primary)] mb-4 font-cordel">Association Introuvable</h1>
      <p className="text-lg text-[var(--color-cordel-vert)] mb-8 max-w-md">
        Nous n'avons pas pu trouver l'association correspondant à cette adresse. Vérifiez l'URL ou retournez à l'accueil.
      </p>
      <a 
        href="https://o-girador.com" 
        className="px-6 py-3 bg-[var(--color-cordel-ocre)] text-white font-bold rounded-md hover:bg-[var(--theme-primary)] transition-colors"
      >
        Retour au Hub
      </a>
    </div>
  );
}
