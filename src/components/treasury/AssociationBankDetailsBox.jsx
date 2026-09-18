import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

/**
 * Encart rétractable affichant les coordonnées bancaires (IBAN, BIC, Titulaire) de l'association.
 * 
 * Utilisé dans l'espace adhérent pour faciliter les règlements par virement (adhésions,
 * cotisations, commandes groupées). Intègre la résilience des noms de champs et la copie
 * en 1 clic dans le presse-papier.
 * 
 * @param {object} props
 * @param {string} props.groupId Identifiant de l'association
 * @param {object} [props.associationData] Données d'association existantes (optionnel)
 * @param {boolean} [props.defaultOpen=false] État initial ouvert/fermé de l'encart
 * @param {string} [props.customVirementLabel] Libellé recommandé pour le virement
 */
export default function AssociationBankDetailsBox({
  groupId,
  associationData = null,
  defaultOpen = false,
  customVirementLabel = ''
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [assocData, setAssocData] = useState(associationData);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState(false);

  // Synchronisation en temps réel si les données ne sont pas passées en props
  useEffect(() => {
    if (associationData) {
      setAssocData(associationData);
      return;
    }
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAssocData(docSnap.data());
      }
    }, (err) => {
      console.warn("AssociationBankDetailsBox - Erreur onSnapshot association :", err);
    });

    return () => unsubscribe();
  }, [groupId, associationData]);

  // Résilience des champs bancaires selon la consigne
  const iban = assocData?.ribIban || assocData?.iban || assocData?.bankDetails?.iban || '';
  const bic = assocData?.bic || assocData?.bankBic || assocData?.bankDetails?.bic || '';
  const titulaire = assocData?.titulaireCompte || assocData?.nomOfficiel || assocData?.nom || '';

  const handleCopyIban = async () => {
    if (!iban) return;
    try {
      await navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } catch (err) {
      console.error("Erreur copie IBAN :", err);
      alert("IBAN de l'association : " + iban);
    }
  };

  const handleCopyLabel = async () => {
    if (!customVirementLabel) return;
    try {
      await navigator.clipboard.writeText(customVirementLabel);
      setCopiedLabel(true);
      setTimeout(() => setCopiedLabel(false), 2000);
    } catch (err) {
      console.error("Erreur copie libellé :", err);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-3 bg-white/60 dark:bg-black/20 text-left transition-all">
      {/* Bouton bascule accordéon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-xs font-black uppercase tracking-wider text-cordel-wood cursor-pointer select-none text-left"
      >
        <span className="flex items-center gap-1.5">
          🏦 Coordonnées bancaires de l'association (RIB / IBAN)
        </span>
        <span className="text-sm font-bold transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      {/* Contenu dépliable */}
      {isOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed border-cordel-master-dark/15 flex flex-col gap-2.5 text-xs animate-fadeIn">
          {!iban ? (
            <div className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/30 p-2.5 rounded border border-dashed border-amber-600/30 italic font-semibold">
              ℹ️ Les coordonnées bancaires de l'association n'ont pas encore été renseignées. Veuillez vous rapprocher du trésorier ou d'un responsable pour obtenir l'IBAN.
            </div>
          ) : (
            <>
              {/* Titulaire du compte */}
              {titulaire && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark/70">
                    Titulaire du compte :
                  </span>
                  <span className="font-black text-encre-noire dark:text-cordel-bg-light">
                    {titulaire}
                  </span>
                </div>
              )}

              {/* IBAN */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 bg-white/80 dark:bg-black/30 p-2 rounded border border-cordel-master-dark/15">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark/70">
                    IBAN :
                  </span>
                  <span className="font-mono text-xs font-bold text-encre-noire dark:text-cordel-bg-light tracking-wider select-all">
                    {iban}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyIban}
                  className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer shrink-0 select-none ${
                    copiedIban
                      ? 'bg-green-700 text-white border-green-900 shadow-sm'
                      : 'bg-cordel-wood text-cordel-bg-light border-encre-noire hover:brightness-110 shadow-[1px_1px_0px_0px_#181716]'
                  }`}
                >
                  {copiedIban ? '✓ IBAN Copié !' : '📋 Copier l\'IBAN'}
                </button>
              </div>

              {/* BIC */}
              {bic && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark/70">
                    Code BIC / SWIFT :
                  </span>
                  <span className="font-mono text-[11px] font-bold text-encre-noire dark:text-cordel-bg-light">
                    {bic}
                  </span>
                </div>
              )}

              {/* Consigne de libellé de virement si fourni */}
              {customVirementLabel && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-600/30 p-2 rounded flex flex-col gap-1 mt-1">
                  <span className="text-[9px] uppercase font-black text-amber-900 dark:text-amber-300">
                    ⚠️ Libellé obligatoire pour votre virement :
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-cordel-wood bg-white/70 dark:bg-black/30 px-1.5 py-0.5 rounded border border-amber-500/20 select-all">
                      {customVirementLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLabel}
                      className="text-[8.5px] font-bold uppercase tracking-wider text-cordel-master-dark hover:underline cursor-pointer shrink-0"
                    >
                      {copiedLabel ? '✓ Copié !' : 'Copier libellé'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </CordelCard>
  );
}
