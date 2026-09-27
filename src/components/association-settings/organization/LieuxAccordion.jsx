import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import useConfirm from '../../../hooks/useConfirm';
import LieuEditModal from './LieuEditModal';
import DefaultLocationsByEventTypeGrid from './DefaultLocationsByEventTypeGrid';

/**
 * Accordéon compact pour le carnet des salles habituelles et repères GPS.
 * Chaque lieu est pliable individuellement avec accès carte à la demande.
 */
export default function LieuxAccordion({ formData = {}, handleChange, saving }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedLieuId, setExpandedLieuId] = useState(null);
  const [modalLieu, setModalLieu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { confirm } = useConfirm();

  const lieuxImportants = Array.isArray(formData.lieuxImportants) ? formData.lieuxImportants : [];

  const handleSaveLieu = (savedLieu) => {
    const list = [...lieuxImportants];
    const index = list.findIndex(l => l.id === savedLieu.id);
    if (index !== -1) {
      list[index] = savedLieu;
    } else {
      list.push(savedLieu);
    }
    handleChange('lieuxImportants', list);
    setIsModalOpen(false);
    setModalLieu(null);
  };

  const handleDeleteLieu = async (id) => {
    const isOk = await confirm("Voulez-vous vraiment retirer ce lieu du carnet ?");
    if (isOk) {
      handleChange('lieuxImportants', lieuxImportants.filter(l => l.id !== id));
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* Bandeau principal d'en-tête */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">📍</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Carnet des Salles & Repères GPS ({lieuxImportants.length}) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            (Répétitions, local, scènes habituelles)
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? 'Fermer' : 'Gérer'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-stone-200">
            <p className="text-[10px] text-cordel-master-dark/70 font-semibold">
              Répertoire des lieux proposés en sélection rapide lors de la création d'événements.
            </p>
            <CordelButton
              variant="vert"
              useExtremeBorder={true}
              onClick={() => {
                setModalLieu(null);
                setIsModalOpen(true);
              }}
              className="text-[10px] font-black uppercase px-2.5 py-1 cursor-pointer shrink-0"
            >
              ＋ Ajouter un lieu
            </CordelButton>
          </div>

          {/* Liste pliable des lieux */}
          {lieuxImportants.length === 0 ? (
            <div className="p-3 border border-dashed border-stone-300 rounded text-center text-[10px] italic text-stone-500 bg-white/60">
              Aucun lieu enregistré dans le carnet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lieuxImportants.map((lieu) => {
                const isLieuExpanded = expandedLieuId === lieu.id;
                return (
                  <div key={lieu.id} className="border border-cordel-master-dark/20 rounded bg-white overflow-hidden shadow-2xs">
                    <div 
                      onClick={() => setExpandedLieuId(isLieuExpanded ? null : lieu.id)}
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-cordel-wood">📍 {lieu.nom}</span>
                        <span className="text-[10px] text-stone-500 font-medium truncate max-w-xs sm:max-w-md">
                          {lieu.adresse}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-stone-600">
                        {isLieuExpanded ? '▲' : '▾'}
                      </span>
                    </div>

                    {isLieuExpanded && (
                      <div className="p-3 border-t border-dashed border-stone-200 bg-stone-50/50 flex flex-col gap-2 animate-fade-in text-[10px]">
                        <p className="font-semibold text-stone-800">
                          <strong>Adresse :</strong> {lieu.adresse}
                        </p>
                        {lieu.notes && (
                          <p className="p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                            🔑 <strong>Accès :</strong> {lieu.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-stone-200">
                          {lieu.googleMapsUrl && (
                            <a
                              href={lieu.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                            >
                              🗺️ Voir sur Google Maps ↗
                            </a>
                          )}
                          <div className="flex gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setModalLieu(lieu);
                                setIsModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-[9px] font-bold bg-stone-200 hover:bg-stone-300 rounded cursor-pointer"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLieu(lieu.id)}
                              className="px-2 py-0.5 text-[9px] font-bold text-red-700 bg-red-100 hover:bg-red-200 rounded cursor-pointer"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Grille de correspondance par type d'événement modulaire */}
          {lieuxImportants.length > 0 && (
            <DefaultLocationsByEventTypeGrid
              defaultLocations={formData.defaultLocationsByEventType || {}}
              lieuxImportants={lieuxImportants}
              onChange={(updated) => handleChange('defaultLocationsByEventType', updated)}
            />
          )}
        </div>
      )}

      {/* Modale d'édition / création avec repère carte à la demande */}
      <LieuEditModal
        isOpen={isModalOpen}
        initialLieu={modalLieu}
        onClose={() => {
          setIsModalOpen(false);
          setModalLieu(null);
        }}
        onSave={handleSaveLieu}
        saving={saving}
      />
    </CordelCard>
  );
}
