import React from 'react';
import CordelCard from '../../CordelCard';

export default function LegalInfoBlock({ formData, handleChange, saving, signaturePresidentFile, setSignaturePresidentFile, signatureTresorierFile, setSignatureTresorierFile }) {
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        📜 Informations Légales (Devis, Factures & Vitrine)
      </h3>
      <div className="flex flex-col gap-3 text-left">
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
          Ces coordonnées administratives s'imprimeront automatiquement sur les documents PDF officiels et pourront s'afficher sur votre vitrine publique.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Structure juridique */}
          <div className="flex flex-col gap-1">
            <label htmlFor="structureJuridique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Structure Juridique
            </label>
            <input 
              id="structureJuridique"
              type="text"
              value={formData.structureJuridique || ''}
              onChange={(e) => handleChange('structureJuridique', e.target.value)}
              disabled={saving}
              placeholder="ex: Association Loi 1901"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          {/* N° SIRET / RNA */}
          <div className="flex flex-col gap-1">
            <label htmlFor="siret" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Numéro SIRET / N° RNA
            </label>
            <input 
              id="siret"
              type="text"
              value={formData.siret || formData.rna || ''}
              onChange={(e) => {
                handleChange('siret', e.target.value);
                handleChange('rna', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: 849 123 456 00012 / W291001234"
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>
        </div>

        {/* Adresse du Siège Social */}
        <div className="flex flex-col gap-1">
          <label htmlFor="adresseSiegeSocial" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Adresse de Domiciliation / Siège Social
          </label>
          <input 
            id="adresseSiegeSocial"
            type="text"
            value={formData.adresseSiegeSocial || formData.adresse || ''}
            onChange={(e) => {
              handleChange('adresseSiegeSocial', e.target.value);
              handleChange('adresse', e.target.value);
            }}
            disabled={saving}
            placeholder="ex: 12 Rue de la Paix, 29200 Brest"
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* E-mail Officiel de l'Association */}
        <div className="flex flex-col gap-1">
          <label htmlFor="emailOfficiel" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
            <span>E-mail Officiel de l'Association</span>
            <span className="text-[8px] font-normal italic text-cordel-wood">Renseigné sur les Devis PDF et utilisé par Brevo</span>
          </label>
          <input 
            id="emailOfficiel"
            type="email"
            value={formData.emailOfficiel || formData.email || ''}
            onChange={(e) => {
              handleChange('emailOfficiel', e.target.value);
              handleChange('email', e.target.value);
            }}
            disabled={saving}
            placeholder="ex: contact@votre-association.fr"
            className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* Téléphone de Contact Officiel */}
        <div className="flex flex-col gap-1">
          <label htmlFor="telephone" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Téléphone Officiel de l'Association
          </label>
          <input 
            id="telephone"
            type="tel"
            value={formData.telephone || formData.phone || ''}
            onChange={(e) => {
              handleChange('telephone', e.target.value);
              handleChange('phone', e.target.value);
            }}
            disabled={saving}
            placeholder="ex: 06 12 34 56 78"
            className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        {/* Clause Spécifique / Avertissement Contrat (Textarea Optionnel) */}
        <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
          <label htmlFor="clauseSpecifique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
            <span>📋 Clause Spécifique / Avertissement Contrat (Optionnel)</span>
            <span className="text-[8px] font-normal italic text-cordel-wood">S'imprime en bas des contrats PDF</span>
          </label>
          <textarea
            id="clauseSpecifique"
            rows={3}
            value={formData.clauseSpecifique || formData.legalClause || ''}
            onChange={(e) => {
              handleChange('clauseSpecifique', e.target.value);
              handleChange('legalClause', e.target.value);
            }}
            disabled={saving}
            placeholder="ex: Avertissement sonore : Les prestations comportent un volume sonore élevé."
            className="theme-input text-xs font-bold p-2 bg-cordel-bg-light w-full resize-none"
          />
        </div>

        {/* Signatures Numérisées du Président et du Trésorier */}
        <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/15 pt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-wood">
            ✍️ Signatures Numérisées des Représentants (Imprimées sur Devis & Contrats PDF)
          </span>
          <p className="text-[9px] text-cordel-master-dark/70 font-medium">
            Conseil : Utilisez une image au format PNG avec un fond transparent.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {/* Signature du Président / Mestre */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                Signature du Président / Mestre
              </span>
              <div className="flex items-center gap-2">
                {formData.signaturePresidentUrl ? (
                  <img
                    src={formData.signaturePresidentUrl}
                    alt="Signature Président"
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    Aucune
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSignaturePresidentFile && setSignaturePresidentFile(e.target.files?.[0] || null)}
                  disabled={saving}
                  className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                />
              </div>
              {signaturePresidentFile && (
                <span className="text-[9px] text-green-700 font-bold">✓ Sélectionné : {signaturePresidentFile.name}</span>
              )}
            </div>

            {/* Signature du Trésorier */}
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
              <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                Signature du Trésorier
              </span>
              <div className="flex items-center gap-2">
                {formData.signatureTresorierUrl ? (
                  <img
                    src={formData.signatureTresorierUrl}
                    alt="Signature Trésorier"
                    className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                  />
                ) : (
                  <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                    Aucune
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => setSignatureTresorierFile && setSignatureTresorierFile(e.target.files?.[0] || null)}
                  disabled={saving}
                  className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                />
              </div>
              {signatureTresorierFile && (
                <span className="text-[9px] text-green-700 font-bold">✓ Sélectionné : {signatureTresorierFile.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
