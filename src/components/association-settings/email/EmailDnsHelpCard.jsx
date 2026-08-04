import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

/**
 * Composant d'aide DNS dynamique pour le domaine personnalisé de l'association.
 * Affiche les enregistrements SPF, DKIM et DMARC recommandés à ajouter chez l'hébergeur (OVH, Gandi, Infomaniak, etc.).
 */
export default function EmailDnsHelpCard({ customDomain, replyToEmail }) {
  const [copiedKey, setCopiedKey] = useState(null);

  // Extraction propre du nom de domaine depuis le champ dédié ou à partir de l'adresse de réponse
  const extractedDomain = (customDomain && customDomain.trim()) 
    ? customDomain.trim().toLowerCase() 
    : (replyToEmail && replyToEmail.includes('@') ? replyToEmail.split('@')[1].trim().toLowerCase() : 'votre-domaine.fr');

  // Enregistrements DNS recommandés selon les normes SPF, DKIM, DMARC
  const dnsRecords = [
    {
      id: 'spf',
      type: 'TXT',
      name: '@',
      label: 'SPF (Sender Policy Framework)',
      description: 'Autorise nos serveurs à émettre des e-mails au nom de votre domaine sans rejet spam.',
      value: `v=spf1 include:mail.ogirador.fr include:${extractedDomain} ~all`
    },
    {
      id: 'dkim',
      type: 'TXT',
      name: `ogirador._domainkey.${extractedDomain}`,
      label: 'DKIM (DomainKeys Identified Mail)',
      description: 'Clef de signature cryptographique certifiant l\'authenticité de vos envois.',
      value: `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3O... (Généré par O Girador)`
    },
    {
      id: 'dmarc',
      type: 'TXT',
      name: `_dmarc.${extractedDomain}`,
      label: 'DMARC (Domain-based Message Authentication)',
      description: 'Politique de sécurité recommandant le traitement des messages non authentifiés.',
      value: `v=DMARC1; p=none; rua=mailto:dmarc-reports@${extractedDomain}`
    }
  ];

  // Copie de texte dans le presse-papier avec confirmation visuelle temporaire
  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }).catch(err => {
      console.error("Erreur de copie dans le presse-papier :", err);
    });
  };

  return (
    <CordelCard variant="default" className="p-4 bg-stone-50 border-2 border-stone-300 shadow-xs flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-stone-300 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌐</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Enregistrements DNS Recommandés pour <span className="font-mono text-[var(--color-cordel-vert,#2d6a4f)]">{extractedDomain}</span>
            </h4>
            <p className="text-[10px] text-stone-500 font-bold">
              Copiez et collez ces paramètres dans la zone DNS de votre hébergeur (OVH, Gandi, Infomaniak, Ionos, Cloudflare).
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-200/70 text-stone-700 font-extrabold uppercase text-[9px] tracking-wider border-b border-stone-300">
              <th className="p-2">Type</th>
              <th className="p-2">Hôte / Nom</th>
              <th className="p-2">Valeur / Cible</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {dnsRecords.map((record) => (
              <tr key={record.id} className="hover:bg-white transition-colors">
                <td className="p-2 font-mono font-bold text-stone-800 text-[10px]">
                  <span className="bg-stone-200 text-stone-900 px-1.5 py-0.5 rounded border border-stone-300">
                    {record.type}
                  </span>
                </td>
                <td className="p-2 font-mono text-[10px] text-stone-800 max-w-[150px] truncate" title={record.name}>
                  {record.name}
                </td>
                <td className="p-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-stone-900 bg-white p-1.5 rounded border border-stone-300 break-all select-all">
                      {record.value}
                    </span>
                    <span className="text-[9px] text-stone-500 italic mt-0.5">
                      {record.description}
                    </span>
                  </div>
                </td>
                <td className="p-2 text-right vertical-align-top">
                  <button
                    type="button"
                    onClick={() => handleCopy(record.id, record.value)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded transition-all cursor-pointer flex items-center gap-1 ml-auto ${
                      copiedKey === record.id
                        ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-xs'
                        : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border border-stone-300'
                    }`}
                  >
                    <span>{copiedKey === record.id ? '✓ Copié !' : '📋 Copier'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded text-[10px] text-stone-700 flex items-start gap-2">
        <span className="text-sm">💡</span>
        <p className="leading-relaxed">
          <strong>Remarque :</strong> La propagation des modifications DNS peut prendre de quelques minutes à 24 heures selon votre hébergeur. Une fois les enregistrements validés, le taux de délivrabilité de vos e-mails sera optimal.
        </p>
      </div>
    </CordelCard>
  );
}
