import React from 'react';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 bg-[#f4ecd8] px-4 text-center">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="text-4xl font-bold text-[#8b2a1a] mb-4 font-cordel">Association Introuvable</h1>
      <p className="text-lg text-[#2d6a4f] mb-8 max-w-md">
        Nous n'avons pas pu trouver l'association correspondant à cette adresse. Vérifiez l'URL ou retournez à l'accueil.
      </p>
      <a 
        href="https://o-girador.com" 
        className="px-6 py-3 bg-[#c05621] text-white font-bold rounded-md hover:bg-[#8b2a1a] transition-colors"
      >
        Retour au Hub
      </a>
    </div>
  );
}
