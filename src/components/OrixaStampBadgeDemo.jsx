import React from 'react';
import SeloAxeStamp from './SeloAxeStamp';

const OrixaStampBadgeDemo = () => {
  return (
    <div className="p-8 min-h-screen" style={{ backgroundColor: 'var(--cordel-bg)' }}>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-[Cactus] mb-2" style={{ color: 'var(--cordel-text)' }}>
            Démo : Selo de Axé (OrixaStampBadge)
          </h1>
          <p className="opacity-80" style={{ color: 'var(--cordel-text)' }}>
            Composant visuel style Cordel (Xylogravure) avec micro-rotations et fonds dynamiques.
          </p>
        </header>

        {/* Tailles */}
        <section>
          <h2 className="text-2xl font-[Cactus] border-b-2 mb-6 pb-2" style={{ borderColor: 'var(--cordel-border)' }}>
            1. Variations de Taille
          </h2>
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="orixa" couleurs={['#facc15']} size="sm" />
              <span className="text-sm font-semibold">Small (sm)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="orixa" couleurs={['#facc15']} size="md" />
              <span className="text-sm font-semibold">Medium (md)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="orixa" couleurs={['#facc15']} size="lg" />
              <span className="text-sm font-semibold">Large (lg)</span>
            </div>
          </div>
        </section>

        {/* Couleurs */}
        <section>
          <h2 className="text-2xl font-[Cactus] border-b-2 mb-6 pb-2" style={{ borderColor: 'var(--cordel-border)' }}>
            2. Fonds Dynamiques (1 ou 2 couleurs)
          </h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="cortejo" couleurs={['var(--color-cordel-vert)']} size="lg" />
              <span className="text-sm">Une couleur (Vert)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="cortejo" couleurs={['var(--color-cordel-rouge)', 'var(--color-cordel-ocre)']} size="lg" />
              <span className="text-sm">Bicolore (Rouge / Ocre)</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <SeloAxeStamp stampKey="cortejo" couleurs={['#3b82f6', '#ffffff']} size="lg" />
              <span className="text-sm">Bicolore (Bleu / Blanc)</span>
            </div>
          </div>
        </section>

        {/* Thèmes / Tampons */}
        <section>
          <h2 className="text-2xl font-[Cactus] border-b-2 mb-6 pb-2" style={{ borderColor: 'var(--cordel-border)' }}>
            3. Types de Tampons (Thèmes)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="orixa" couleurs={['#eab308']} size="md" />
              <span className="text-sm font-medium">Orixás</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="cuisine" couleurs={['#f97316']} size="md" />
              <span className="text-sm font-medium">Cuisine</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="histoire" couleurs={['#8b5cf6']} size="md" />
              <span className="text-sm font-medium">Histoire</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="musique" couleurs={['#ec4899', '#ffffff']} size="md" />
              <span className="text-sm font-medium">Musique</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="cortejo" couleurs={['#14b8a6', '#fcd34d']} size="md" />
              <span className="text-sm font-medium">Cortejo</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="territoire" couleurs={['#22c55e']} size="md" />
              <span className="text-sm font-medium">Territoire</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/50 rounded-lg shadow-sm border" style={{ borderColor: 'var(--cordel-border)' }}>
              <SeloAxeStamp stampKey="folklore" couleurs={['#ef4444']} size="md" />
              <span className="text-sm font-medium">Folklore</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrixaStampBadgeDemo;
