import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import BankDetailsBlock from '../association-settings/blocks/BankDetailsBlock';
import { useTranslation } from '../LanguageContext';

/**
 * Accordéon de gestion des coordonnées bancaires (IBAN, BIC, Titulaire, Mentions TVA)
 * affiché dans le tableau de bord de la Trésorerie.
 */
export default function TreasuryBankDetailsAccordion({
  associationSettings,
  handleSaveAssociationSettings
}) {
  const { t } = useTranslation();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    mentionTVA: '',
    ribIban: '',
    iban: '',
    titulaireCompte: '',
    domiciliationBancaire: ''
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  useEffect(() => {
    if (associationSettings) {
      setBankFormData({
        mentionTVA: associationSettings.mentionTVA || '',
        ribIban: associationSettings.ribIban || associationSettings.iban || '',
        iban: associationSettings.iban || associationSettings.ribIban || '',
        titulaireCompte: associationSettings.titulaireCompte || '',
        domiciliationBancaire: associationSettings.domiciliationBancaire || ''
      });
    }
  }, [associationSettings]);

  const handleBankFieldChange = (key, value) => {
    setBankFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    if (!handleSaveAssociationSettings) return;
    setSavingBank(true);
    setBankSuccessMsg('');
    try {
      await handleSaveAssociationSettings({
        mentionTVA: bankFormData.mentionTVA,
        ribIban: bankFormData.ribIban,
        iban: bankFormData.ribIban,
        titulaireCompte: bankFormData.titulaireCompte,
        domiciliationBancaire: bankFormData.domiciliationBancaire
      });
      setBankSuccessMsg('Coordonnées bancaires enregistrées avec succès !');
      setTimeout(() => setBankSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des coordonnées bancaires :', err);
      alert('Erreur lors de la sauvegarde des coordonnées bancaires.');
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 sm:p-4">
      <div
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setShowBankDetails(!showBankDetails)}
      >
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-1.5">
          <span>🏦 {t('treasury.bankDetailsBillingTitle')}</span>
        </h3>
        <span className="text-xs font-black">
          {showBankDetails ? `▲ ${t('treasury.toggleCollapse')}` : `▼ ${t('treasury.toggleExpand')}`}
        </span>
      </div>

      {showBankDetails && (
        <form
          onSubmit={handleSaveBankDetails}
          className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left"
        >
          <BankDetailsBlock
            formData={bankFormData}
            handleChange={handleBankFieldChange}
            saving={savingBank}
          />

          {bankSuccessMsg && (
            <div className="text-xs text-emerald-800 font-bold bg-emerald-100 border border-emerald-400 p-2 rounded">
              ✅ {bankSuccessMsg}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              disabled={savingBank}
              className="px-6 py-2 uppercase font-black tracking-wider text-xs"
            >
              {savingBank ? 'Enregistrement...' : '💾 Enregistrer les Coordonnées'}
            </CordelButton>
          </div>
        </form>
      )}
    </CordelCard>
  );
}

