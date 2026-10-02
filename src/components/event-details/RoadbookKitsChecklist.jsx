import React, { useState } from 'react';
import { useCollectiveKits, calculateKitStatus } from '../../hooks/useCollectiveKits';
import { useTranslation } from '../LanguageContext';

/**
 * Section Matériel & Checklist de la Feuille de Route interactive.
 * Affiche les effectifs par pupitre et le statut en temps réel des malles régie sélectionnées.
 */
export default function RoadbookKitsChecklist({
  event = {},
  logistique = {},
  presentsByInstrument = {}
}) {
  const { t } = useTranslation();
  const { kits } = useCollectiveKits(event.groupId);
  const [openMaquillage, setOpenMaquillage] = useState(false);
  const [openSecours, setOpenSecours] = useState(false);
  const [openCustomKits, setOpenCustomKits] = useState({});

  // Liste consolidée des malles sélectionnées pour cette sortie
  const selectedMalles = Array.isArray(event.logistiqueMalles) && event.logistiqueMalles.length > 0
    ? event.logistiqueMalles
    : [
        logistique.maquillageRequis ? 'Mallette Maquillage' : null,
        logistique.trousseSecoursBouchons ? 'Trousse de secours & Bouchons' : null,
        logistique.reserveBaguettes ? 'Réserve de mailloches & baguettes' : null,
        ...(Array.isArray(event.mallesSpecifiques) ? event.mallesSpecifiques : [])
      ].filter(Boolean);

  const maquillageRequis = Boolean(
    logistique.maquillageRequis || selectedMalles.some((m) => m.toLowerCase().includes('maquillage'))
  );
  const trousseSecoursBouchons = Boolean(
    logistique.trousseSecoursBouchons || selectedMalles.some((m) => m.toLowerCase().includes('secours') || m.toLowerCase().includes('pharmacie'))
  );
  const reserveBaguettes = Boolean(
    logistique.reserveBaguettes || selectedMalles.some((m) => m.toLowerCase().includes('baguette') || m.toLowerCase().includes('mailloche'))
  );

  const kitMaquillage = kits.find((k) => k.type === 'maquillage' || (k.nom || '').toLowerCase().includes('maquillage'));
  const kitSecours = kits.find((k) => k.type === 'secours' || (k.nom || '').toLowerCase().includes('secours'));

  // Autres malles régie ou consignes ponctuelles
  const otherMalles = selectedMalles.filter((m) => {
    const l = m.toLowerCase();
    return !l.includes('maquillage') && !l.includes('secours') && !l.includes('pharmacie') && !l.includes('baguette') && !l.includes('mailloche');
  });

  const renderBadge = (statusObj) => {
    if (!statusObj) return <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 font-bold">À inventorier</span>;
    if (statusObj.color === 'green') return <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-400">✅ Prête</span>;
    if (statusObj.color === 'red') return <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-red-100 text-red-900 border border-red-400">🚨 {statusObj.label}</span>;
    return <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-amber-100 text-amber-900 border border-amber-400">⚠️ {statusObj.label}</span>;
  };

  const renderKitItems = (kit) => {
    const items = kit?.items || [];
    if (items.length === 0) return <p className="text-[10px] italic text-neutral-500 pl-2">Aucun article enregistré.</p>;
    return (
      <div className="mt-1.5 p-2 bg-white/90 rounded border border-neutral-300 space-y-1 text-[11px]">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-1 border-b border-dashed border-neutral-200 pb-0.5 last:border-none">
            <span className="truncate">• {it.nom}</span>
            <span className="font-bold shrink-0 ml-1 text-neutral-700">
              {it.quantiteActuelle}/{it.quantiteCible}
              {it.statut === 'a_racheter' && <span className="ml-1 text-[8px] bg-red-100 text-red-800 px-1 rounded font-black">À racheter</span>}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[var(--color-cordel-papier-card,#f5efe6)] p-3 rounded-lg border border-[var(--theme-border-color,#181716)] text-left">
      <h3 className="font-bold text-[var(--color-cordel-encre,#181716)] mb-2 uppercase text-xs tracking-wider flex items-center justify-between">
        <span>🎒 {t('agenda.logisticsChecklist') || 'Matériel & Checklist Logistique'}</span>
        <span className="text-[10px] font-normal text-neutral-500 lowercase">contrôle régie</span>
      </h3>

      {/* Effectifs présents par pupitre */}
      <div className="mb-2.5">
        <span className="text-[10px] uppercase font-bold text-[var(--color-cordel-marron,#8b5e34)] block mb-1">
          Effectifs présents par pupitre :
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(presentsByInstrument).map(([inst, members]) => (
            <span key={inst} className="px-2 py-0.5 bg-white rounded border border-[var(--theme-border-color,#181716)] text-xs font-semibold">
              {inst} : {members.length}
            </span>
          ))}
        </div>
      </div>

      {/* Trousses & Mallettes collectives connectées */}
      <div className="space-y-2 pt-2 border-t border-[var(--theme-border-color,#181716)] text-xs">
        {/* Mallette Maquillage */}
        {maquillageRequis && (
          <div className="p-2 rounded bg-white/70 border border-neutral-300 transition-all">
            <div onClick={() => setOpenMaquillage(!openMaquillage)} className="flex items-center justify-between gap-2 cursor-pointer select-none">
              <div className="flex items-center gap-1.5 font-bold text-[var(--color-cordel-encre,#181716)]">
                <span>🧰</span>
                <span>Mallette Maquillage</span>
                <span className="text-[10px] text-neutral-500 font-normal">({(kitMaquillage?.items || []).length} articles)</span>
              </div>
              <div className="flex items-center gap-2">
                {renderBadge(kitMaquillage ? calculateKitStatus(kitMaquillage) : null)}
                <span className="text-xs text-neutral-500">{openMaquillage ? '▲' : '▼'}</span>
              </div>
            </div>
            {openMaquillage && renderKitItems(kitMaquillage)}
          </div>
        )}

        {/* Trousse Secours & Bouchons */}
        {trousseSecoursBouchons && (
          <div className="p-2 rounded bg-white/70 border border-neutral-300 transition-all">
            <div onClick={() => setOpenSecours(!openSecours)} className="flex items-center justify-between gap-2 cursor-pointer select-none">
              <div className="flex items-center gap-1.5 font-bold text-[var(--color-cordel-encre,#181716)]">
                <span>🧰</span>
                <span>Trousse de secours &amp; Bouchons</span>
                <span className="text-[10px] text-neutral-500 font-normal">({(kitSecours?.items || []).length} articles)</span>
              </div>
              <div className="flex items-center gap-2">
                {renderBadge(kitSecours ? calculateKitStatus(kitSecours) : null)}
                <span className="text-xs text-neutral-500">{openSecours ? '▲' : '▼'}</span>
              </div>
            </div>
            {openSecours && renderKitItems(kitSecours)}
          </div>
        )}

        {/* Réserve Mailloches / Baguettes */}
        {reserveBaguettes && (
          <div className="p-2 rounded bg-white/70 border border-neutral-300 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[var(--color-cordel-encre,#181716)]">
              <span>🧰</span>
              <span>Réserve de mailloches &amp; baguettes</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-400">
              ✅ Prévue
            </span>
          </div>
        )}

        {/* Autres Malles Régie et Consignes Ponctuelles */}
        {otherMalles.map((malleName) => {
          const matchedKit = kits.find((k) => k.nom === malleName || k.id === malleName);
          const status = matchedKit ? calculateKitStatus(matchedKit) : null;
          const isOpen = Boolean(openCustomKits[malleName]);

          return (
            <div key={malleName} className="p-2 rounded bg-white/70 border border-neutral-300 transition-all">
              <div
                onClick={() => matchedKit && setOpenCustomKits((prev) => ({ ...prev, [malleName]: !prev[malleName] }))}
                className={`flex items-center justify-between gap-2 select-none ${matchedKit ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[var(--color-cordel-encre,#181716)]">
                  <span>🧰</span>
                  <span>{malleName}</span>
                  {matchedKit && (
                    <span className="text-[10px] text-neutral-500 font-normal">
                      ({(matchedKit.items || []).length} articles)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {matchedKit ? renderBadge(status) : (
                    <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-stone-100 text-stone-800 border border-stone-300">
                      Consigne ponctuelle
                    </span>
                  )}
                  {matchedKit && <span className="text-xs text-neutral-500">{isOpen ? '▲' : '▼'}</span>}
                </div>
              </div>
              {isOpen && matchedKit && renderKitItems(matchedKit)}
            </div>
          );
        })}

        {selectedMalles.length === 0 && !maquillageRequis && !trousseSecoursBouchons && !reserveBaguettes && (
          <p className="text-[11px] italic text-neutral-500">Aucune malle ni consigne logistique spécifique requise pour ce rendez-vous.</p>
        )}
      </div>
    </div>
  );
}
