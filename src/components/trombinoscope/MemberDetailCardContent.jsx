import React from 'react';
import CordelButton from '../CordelButton';
import { formatTagGender } from '../../utils/tagUtils';

/**
 * Sous-composant affichant les détails musicaux, coordonnées et tags
 * dans la modale de consultation de membre (Bloc Anti-Monolithe).
 */
export default function MemberDetailCardContent({
  member,
  percussions = [],
  hasDanse = false,
  niveauDanse = '',
  niveauxParInstrument = {},
  niveau = '',
  getPupitreName = (i) => i,
  showPhone = false,
  telephone = '',
  showBirthdate = false,
  dateNaissance = '',
  displayCity = '',
  validTags = [],
  majoriteFeminine = false,
  tagsDisponibles = [],
  isCurrentUser = false,
  onContactUser,
  onClose,
  t = (key) => key
}) {
  return (
    <>
      {/* Pupitres et Instruments */}
      <div className="w-full p-2.5 rounded-lg bg-white/70 border border-encre-noire/20 text-left flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold text-stone-600 block border-b border-stone-200 pb-0.5">
          Pratique musicale &amp; Pupitre
        </span>
        {percussions.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            {percussions.map((inst) => {
              const instNiveau = niveauxParInstrument[inst] || niveau;
              return (
                <span key={inst} className="px-2 py-0.5 rounded bg-cordel-bg border border-encre-noire/20 text-[10.5px] font-bold flex items-center gap-1">
                  <span>🪘</span> {getPupitreName(inst) || inst}
                  {instNiveau && instNiveau !== 'aucun' && (
                    <span className="text-[8px] uppercase text-stone-500 font-black">
                      ({instNiveau === 'confirme' ? 'Confirmé' : 'Débutant'})
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
        {hasDanse && (
          <div className="pt-1 border-t border-dotted border-stone-200 text-[11px] font-bold text-[var(--color-cordel-marron,#8b2a1a)]">
            💃 Danse {niveauDanse && niveauDanse !== 'aucun' ? `(${niveauDanse})` : ''}
          </div>
        )}
      </div>

      {/* Coordonnées si autorisées */}
      {(showPhone || showBirthdate || displayCity) && (
        <div className="w-full p-2.5 rounded-lg bg-white/70 border border-encre-noire/20 text-left text-[11px] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-stone-600 block border-b border-stone-200 pb-0.5">
            Coordonnées &amp; Informations
          </span>
          {showPhone && (
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Téléphone :</span>
              <a href={`tel:${telephone.replace(/\s+/g, '')}`} className="font-bold text-[var(--color-cordel-vert)] hover:underline">
                📞 {telephone}
              </a>
            </div>
          )}
          {showBirthdate && (
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Anniversaire :</span>
              <strong className="text-encre-noire">🎂 {dateNaissance}</strong>
            </div>
          )}
          {displayCity && (
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Localité :</span>
              <strong className="text-encre-noire">📍 {displayCity}</strong>
            </div>
          )}
        </div>
      )}

      {/* Badges / Étiquettes Cordel */}
      {validTags.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center pt-1">
          {validTags.map((tag, idx) => (
            <span
              key={idx}
              className="theme-stamp-badge theme-stamp-badge-wood text-[8px] rotate-[-2deg]"
            >
              {formatTagGender(tag, member.genre, majoriteFeminine, tagsDisponibles)}
            </span>
          ))}
        </div>
      )}

      {/* Bouton d'action directe : Contacter */}
      {!isCurrentUser && onContactUser && (
        <div className="w-full pt-2">
          <CordelButton
            variant="primary"
            onClick={() => {
              onContactUser(member.id);
              onClose();
            }}
            className="w-full py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>✉️</span> {t('trombinoscope.contact') || 'Envoyer un message'}
          </CordelButton>
        </div>
      )}
    </>
  );
}
