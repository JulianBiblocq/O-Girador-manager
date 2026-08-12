import React, { useState, useEffect } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useTreasury } from '../hooks/useTreasury';
import TreasuryDashboard from './treasury/TreasuryDashboard';
import TreasuryCotisations from './treasury/TreasuryCotisations';
import TreasuryEvents from './treasury/TreasuryEvents';
import TreasuryInvoices from './treasury/TreasuryInvoices';
import TreasuryOperations from './treasury/TreasuryOperations';
import KilometricReimbursementManager from './KilometricReimbursementManager';
import ReportsExports from './ReportsExports';

export default function TreasuryManager({ groupId, onBack, role, isSystemAdmin, hasAccessTresorerie, profileData, initialTab }) {
  const { t } = useTranslation();

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessTresorerie === true;

  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard-finance');

  // Sync activeTab with initialTab from navigation
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load all treasury data through custom hook
  const {
    members,
    transactions,
    events,
    associationSettings,
    helloAssoSignatureKey,
    loading,
    error,
    savingSettings,
    savingTx,
    updatingEventId,
    handleAddTx,
    handleDeleteTx,
    handleUpdateEventFinances,
    handleSaveAssociationSettings,
    calculateGlobalBalance
  } = useTreasury(groupId);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('widgetTreasury.accessDenied') || "ACCÈS REFUSÉ"}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {t('widgetTreasury.accessDeniedDesc') || "Vous devez être administrateur pour accéder au module de trésorerie."}
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ {t('common.back')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard-finance':
        return (
          <TreasuryDashboard 
            calculateGlobalBalance={calculateGlobalBalance}
            associationSettings={associationSettings}
            handleSaveAssociationSettings={handleSaveAssociationSettings}
            groupId={groupId}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'cotisations':
        return (
          <TreasuryCotisations
            members={members}
            associationSettings={associationSettings}
            helloAssoSignatureKey={helloAssoSignatureKey}
            savingSettings={savingSettings}
            handleSaveAssociationSettings={handleSaveAssociationSettings}
            groupId={groupId}
          />
        );
      case 'facturation':
        return (
          <TreasuryInvoices
            groupId={groupId}
            associationSettings={associationSettings}
            handleSaveAssociationSettings={handleSaveAssociationSettings}
          />
        );
      case 'events-finances':
        return (
          <TreasuryEvents
            events={events}
            groupId={groupId}
            updatingEventId={updatingEventId}
            handleUpdateEventFinances={handleUpdateEventFinances}
            lieuxImportants={associationSettings?.lieuxImportants || []}
          />
        );
      case 'operations-diverses':
        return (
          <TreasuryOperations
            transactions={transactions}
            savingTx={savingTx}
            handleAddTx={handleAddTx}
            handleDeleteTx={handleDeleteTx}
            associationSettings={associationSettings}
            handleSaveAssociationSettings={handleSaveAssociationSettings}
          />
        );
      case 'frais-km':
        return (
          <KilometricReimbursementManager 
            groupId={groupId}
            role={role}
            isSystemAdmin={isSystemAdmin}
            hasAccessTresorerie={hasAccessTresorerie}
            isEmbedded={true}
            onBack={onBack}
          />
        );
      case 'reports-exports':
        return (
          <ReportsExports 
            groupId={groupId}
            role={role}
            isSystemAdmin={isSystemAdmin}
            hasAccessTresorerie={hasAccessTresorerie}
            profileData={profileData}
            isEmbedded={true}
            onBack={onBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-4xl mx-auto w-full">


      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de la Trésorerie...</span>
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>{t('common.back')}</CordelButton>
        </CordelCard>
      ) : (
        renderActiveTab()
      )}
    </div>
  );
}
