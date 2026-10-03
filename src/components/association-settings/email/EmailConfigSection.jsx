import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import EmailDnsHelpCard from './EmailDnsHelpCard';

/**
 * Composant de configuration de l'expéditeur et des e-mails SaaS (Marque Blanche & Multi-Fournisseurs).
 * Permet de basculer entre le service d'envoi certifié centralisé O Girador et un service externe (API/SMTP) avec domaine personnalisé.
 */
export default function EmailConfigSection({ formData, handleChange, saving, t: propT }) {
  const { t: hookT } = useTranslation();
  const t = typeof propT === 'function' ? propT : hookT;
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Extraction ou valeur par défaut des champs de configuration e-mail
  const emailSenderName = formData.emailSenderName !== undefined ? formData.emailSenderName : (formData.nom || '');
  const emailReplyTo = formData.emailReplyTo !== undefined ? formData.emailReplyTo : (formData.email || formData.emailOfficiel || '');
  const emailDeliveryMode = formData.emailDeliveryMode || 'ogirador'; // 'ogirador' ou 'custom'
  const emailConnectionType = formData.emailConnectionType || 'api'; // 'api' ou 'smtp'
  const emailApiProvider = formData.emailApiProvider || 'brevo'; // 'brevo', 'resend', 'sendgrid', 'mailgun', 'postmark', 'custom_api'
  const emailProviderApiKey = formData.emailProviderApiKey || '';
  const smtpHost = formData.smtpHost || '';
  const smtpPort = formData.smtpPort || 587;
  const smtpUser = formData.smtpUser || '';
  const smtpPassword = formData.smtpPassword || '';
  const smtpSecure = formData.smtpSecure || 'tls'; // 'tls', 'ssl', 'none'
  const customEmailDomain = formData.customEmailDomain || '';

  // Mise à jour simplifiée des champs
  const updateField = (field, value) => {
    handleChange(field, value);
  };

  return (
    <CordelCard variant="default" className="p-5 bg-white border-2 border-stone-300 shadow-xs flex flex-col gap-5 text-left">
      {/* Header de la section */}
      <div className="border-b border-dashed border-stone-300 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">✉️</span>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-cordel-wood">
              {t('studio.communication.configurationDeLExpediteurEt')}
            </h3>
            <p className="text-xs text-stone-500 font-bold mt-0.5">
              {t('studio.communication.personnalisezLIdentiteVisuelleDe')}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded border ${
          emailDeliveryMode === 'ogirador'
            ? 'bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)] border-emerald-300'
            : 'bg-amber-50 text-[var(--color-cordel-ocre,#c05621)] border-amber-300'
        }`}>
          {emailDeliveryMode === 'ogirador' ? t('studio.communication.serviceCertifieOGirador') : t('studio.communication.serviceExterneActif')}
        </span>
      </div>

      {/* 1. Nom d'expéditeur & Adresse Reply-To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom d'expéditeur dynamique */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center justify-between">
            <span>{t('studio.communication.nomDExpediteurDynamique')}</span>
            <span className="text-[10px] text-stone-400 font-normal">{t('studio.communication.exSamambaiaMaracatu')}</span>
          </label>
          <input
            type="text"
            value={emailSenderName}
            onChange={(e) => updateField('emailSenderName', e.target.value)}
            disabled={saving}
            placeholder={formData.nom || "Samambaia Maracatu"}
            className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-bold text-stone-900 focus:border-[var(--color-cordel-vert,#2d6a4f)] outline-none"
          />
        </div>

        {/* Adresse de réponse (Reply-To) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-stone-700 flex items-center justify-between">
            <span>{t('studio.communication.adresseEMailDeReponse')}</span>
            <span className="text-[10px] text-stone-400 font-normal">{t('studio.communication.exContactMonAssoFr')}</span>
          </label>
          <input
            type="email"
            value={emailReplyTo}
            onChange={(e) => updateField('emailReplyTo', e.target.value)}
            disabled={saving}
            placeholder={formData.email || "contact@mon-asso.fr"}
            className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-900 focus:border-[var(--color-cordel-vert,#2d6a4f)] outline-none"
          />
        </div>
      </div>

      {/* 2. Mode d'envoi (Bascule Option A / Option B) */}
      <div className="flex flex-col gap-3 pt-2">
        <label className="text-xs font-black uppercase tracking-wider text-stone-800 border-b border-dashed border-stone-200 pb-1">
          {t('studio.communication.modeDEnvoiDE')}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option A : Service Certifié O Girador */}
          <div
            onClick={() => updateField('emailDeliveryMode', 'ogirador')}
            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2 ${
              emailDeliveryMode === 'ogirador'
                ? 'border-[var(--color-cordel-vert,#2d6a4f)] bg-emerald-50/50 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[var(--color-cordel-vert,#2d6a4f)] flex items-center gap-1.5">
                <span>{t('studio.communication.optionARecommandee')}</span>
              </span>
              <input
                type="radio"
                name="emailDeliveryMode"
                checked={emailDeliveryMode === 'ogirador'}
                onChange={() => updateField('emailDeliveryMode', 'ogirador')}
                className="accent-[var(--color-cordel-vert,#2d6a4f)] cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              <strong>{t('studio.communication.serviceEMailCertifieO')}</strong> {t('studio.communication.envoieVosNotificationsEtDocuments')}
            </p>
          </div>

          {/* Option B : Service Externe / Serveur SMTP */}
          <div
            onClick={() => updateField('emailDeliveryMode', 'custom')}
            className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2 ${
              emailDeliveryMode === 'custom'
                ? 'border-[var(--color-cordel-ocre,#c05621)] bg-amber-50/50 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[var(--color-cordel-ocre,#c05621)] flex items-center gap-1.5">
                <span>{t('studio.communication.optionBServiceExterneDomaine')}</span>
              </span>
              <input
                type="radio"
                name="emailDeliveryMode"
                checked={emailDeliveryMode === 'custom'}
                onChange={() => updateField('emailDeliveryMode', 'custom')}
                className="accent-[var(--color-cordel-ocre,#c05621)] cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              <strong>{t('studio.communication.serviceEMailingDedieOu')}</strong> {t('studio.communication.connectezVotrePropreCompteBrevo')}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Configuration détaillée si Option B sélectionnée */}
      {emailDeliveryMode === 'custom' && (
        <div className="p-4 rounded-lg border-2 border-stone-200 bg-stone-50/80 flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                {t('studio.communication.parametresDuCanalDEnvoi')}
              </h4>
              <p className="text-[10px] text-stone-500 font-bold">
                {t('studio.communication.selectionnezLeProtocoleDeConnexion')}
              </p>
            </div>

            {/* Type de connexion (API vs SMTP) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded border border-stone-300">
              <button
                type="button"
                onClick={() => updateField('emailConnectionType', 'api')}
                className={`px-3 py-1 text-[11px] font-bold uppercase rounded transition-all cursor-pointer ${
                  emailConnectionType === 'api'
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t('studio.communication.cleApiService')}
              </button>
              <button
                type="button"
                onClick={() => updateField('emailConnectionType', 'smtp')}
                className={`px-3 py-1 text-[11px] font-bold uppercase rounded transition-all cursor-pointer ${
                  emailConnectionType === 'smtp'
                    ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t('studio.communication.serveurSmtp')}
              </button>
            </div>
          </div>

          {/* Formulaire Clé API */}
          {emailConnectionType === 'api' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700">
                  {t('studio.communication.fournisseurApiEMailing')}
                </label>
                <select
                  value={emailApiProvider}
                  onChange={(e) => updateField('emailApiProvider', e.target.value)}
                  disabled={saving}
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-bold text-stone-800"
                >
                  <option value="brevo">{t('studio.communication.brevoExSendinblue')}</option>
                  <option value="resend">{t('studio.communication.resend')}</option>
                  <option value="sendgrid">{t('studio.communication.sendgrid')}</option>
                  <option value="mailgun">{t('studio.communication.mailgun')}</option>
                  <option value="postmark">{t('studio.communication.postmark')}</option>
                  <option value="custom_api">{t('studio.communication.autreApiRestHttp')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700 flex items-center justify-between">
                  <span>{t('studio.communication.cleDApiSecurisee')}{emailApiProvider.toUpperCase()}) *</span>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-stone-500 hover:text-stone-800 font-normal cursor-pointer"
                  >
                    {showApiKey ? t('studio.communication.masquer') : t('studio.communication.afficher')}
                  </button>
                </label>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={emailProviderApiKey}
                  onChange={(e) => updateField('emailProviderApiKey', e.target.value)}
                  disabled={saving}
                  placeholder={t('studio.communication.xkeysibOuRe_')}
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
                />
              </div>
            </div>
          )}

          {/* Formulaire Serveur SMTP */}
          {emailConnectionType === 'smtp' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700">
                  {t('studio.communication.hoteSmtpHost')}
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => updateField('smtpHost', e.target.value)}
                  disabled={saving}
                  placeholder={t('studio.communication.exSsl0OvhNet')}
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700">
                  {t('studio.communication.portSmtp')}
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => updateField('smtpPort', Number(e.target.value))}
                  disabled={saving}
                  placeholder="587"
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700">
                  {t('studio.communication.securiteProtocole')}
                </label>
                <select
                  value={smtpSecure}
                  onChange={(e) => updateField('smtpSecure', e.target.value)}
                  disabled={saving}
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-bold text-stone-800"
                >
                  <option value="tls">{t('studio.communication.tlsStarttlsPort587Recommande')}</option>
                  <option value="ssl">{t('studio.communication.sslPort465')}</option>
                  <option value="none">{t('studio.communication.aucuneNonSecurise')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-stone-700">
                  {t('studio.communication.utilisateurSmtpUser')}
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => updateField('smtpUser', e.target.value)}
                  disabled={saving}
                  placeholder="contact@mon-asso.fr"
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold uppercase text-stone-700 flex items-center justify-between">
                  <span>{t('studio.communication.motDePasseSmtp')}</span>
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="text-[10px] text-stone-500 hover:text-stone-800 font-normal cursor-pointer"
                  >
                    {showSmtpPassword ? t('studio.communication.masquer') : t('studio.communication.afficher')}
                  </button>
                </label>
                <input
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={smtpPassword}
                  onChange={(e) => updateField('smtpPassword', e.target.value)}
                  disabled={saving}
                  placeholder="••••••••••••"
                  className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
                />
              </div>
            </div>
          )}

          {/* Champ Domaine Personnalisé */}
          <div className="flex flex-col gap-1.5 border-t border-stone-200 pt-3">
            <label className="text-xs font-extrabold uppercase text-stone-800 flex items-center justify-between">
              <span>{t('studio.communication.domaineEMailPersonnaliseCustomemaildomain')}</span>
              <span className="text-[10px] text-stone-400 font-normal">{t('studio.communication.exMonAssoFr')}</span>
            </label>
            <input
              type="text"
              value={customEmailDomain}
              onChange={(e) => updateField('customEmailDomain', e.target.value)}
              disabled={saving}
              placeholder={t('studio.communication.monAssoFr')}
              className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-900 focus:border-[var(--color-cordel-vert,#2d6a4f)] outline-none"
            />
          </div>
        </div>
      )}

      {/* 4. Bloc d'aide DNS dynamique */}
      {(emailDeliveryMode === 'custom' || customEmailDomain || emailReplyTo) && (
        <div className="pt-2">
          <EmailDnsHelpCard
            customDomain={customEmailDomain}
            replyToEmail={emailReplyTo}
          />
        </div>
      )}
    </CordelCard>
  );
}
