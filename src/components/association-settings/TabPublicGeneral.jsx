import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import LegalInfoBlock from './blocks/LegalInfoBlock';
import { useTenantContext } from '../../context/TenantContext';
import { getVitrineUrl } from '../../utils/urlUtils';

/**
 * Composant d'administration dédié aux paramètres globaux du site vitrine public :
 * - Statut de publication (Mode Brouillon / En ligne)
 * - Référencement SEO (Mots-clés, Meta Description, Titre de la page)
 * - Coordonnées générales de contact (E-mail public, Téléphone)
 * 
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association
 * @param {Function} props.handleChange - Handler de mise à jour des champs
 * @param {string} props.groupId - Identifiant de l'association
 * @param {boolean} props.saving - État de sauvegarde globale
 */
export default function TabPublicGeneral({ formData, handleChange, groupId, saving }) {
  const { urls } = useTenantContext();
  const publicTheme = formData.publicTheme || {};
  const [publishing, setPublishing] = useState(false);

  const isVitrinePublished = publicTheme.isPublished !== false;

  // Mise à jour d'un champ spécifique dans publicTheme
  const handleThemeChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  // Bascule rapide du statut de publication (Publication directe)
  const handleTogglePublish = async () => {
    const nextStatus = !isVitrinePublished;
    handleThemeChange('isPublished', nextStatus);

    if (groupId) {
      try {
        setPublishing(true);
        const assocRef = doc(db, 'associations', groupId);
        await setDoc(assocRef, {
          publicTheme: {
            ...publicTheme,
            isPublished: nextStatus
          }
        }, { merge: true });
      } catch (err) {
        console.error("Erreur lors de la mise à jour du statut de publication :", err);
      } finally {
        setPublishing(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none">
      
      {/* SECTION 1 : Statut Général de Publication (Mode Brouillon / En Ligne) */}
      <CordelCard 
        variant="default" 
        className={`p-5 flex flex-col gap-4 border-2 transition-all ${
          isVitrinePublished 
            ? 'bg-emerald-50/80 border-emerald-700 shadow-md' 
            : 'bg-amber-50/90 border-amber-600 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-dashed border-stone-300 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isVitrinePublished ? '🟢' : '🟡'}</span>
            <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">
              Statut de Publication de la Vitrine Publique
            </h4>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border shadow-2xs ${
            isVitrinePublished
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-amber-600 text-white border-amber-700 animate-pulse'
          }`}>
            {isVitrinePublished ? '🌐 EN LIGNE (PUBLIÉ)' : '🚧 MODE BROUILLON (MASQUÉ)'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black uppercase tracking-wide text-stone-900 flex items-center gap-2">
              <span>🌍 Publier le site vitrine pour le grand public</span>
            </label>
            <p className="text-[11px] text-stone-700 leading-relaxed max-w-xl">
              {isVitrinePublished
                ? "Votre site vitrine est actuellement en ligne et totalement accessible par les visiteurs externes et moteurs de recherche."
                : "Mode Brouillon actif : les visiteurs voient une page d'attente \"En construction\". Seuls les membres connectés peuvent prévisualiser le site."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={saving || publishing}
              onClick={handleTogglePublish}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[6px_8px_5px_7px] border-2 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ${
                isVitrinePublished
                  ? 'bg-red-800 text-white border-encre-noire hover:brightness-110'
                  : 'bg-emerald-700 text-white border-encre-noire hover:brightness-110'
              }`}
            >
              <span>{publishing ? 'Patientez...' : (isVitrinePublished ? '🔒 Passer en Mode Brouillon' : '🌍 Publier le Site Maintenant')}</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(getVitrineUrl(urls, formData), '_blank', 'noopener,noreferrer')}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-cordel-vert text-white rounded-[6px_8px_5px_7px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer flex items-center gap-1.5 select-none"
              title="Ouvrir le site public dans un nouvel onglet"
            >
              <span>🌍 Voir le site public ↗</span>
            </button>
          </div>
        </div>
      </CordelCard>

      {/* SECTION 1.5 : Domaine Personnalisé */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
          <span>🔗 Nom de domaine personnalisé</span>
        </h4>
        
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-600 leading-relaxed">
            Si vous possédez votre propre nom de domaine (ex: <strong>www.mon-association.fr</strong>), vous pouvez le renseigner ici. 
            Il servira d'adresse principale pour votre site vitrine au lieu de l'adresse par défaut.
          </p>
            <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Domaines personnalisés
            </label>
            <div className="flex flex-wrap gap-2 mb-1">
              {(formData.customDomains || []).map((domain, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-stone-100 border border-stone-300 text-stone-700 text-[10px] font-bold px-2 py-1 rounded">
                  {domain}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      handleChange('customDomains', (formData.customDomains || []).filter(d => d !== domain));
                    }}
                    className="text-stone-400 hover:text-red-600 font-bold ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newDomain = e.target.value.trim().replace(/^https?:\/\//, '').toLowerCase();
                  if (newDomain && !(formData.customDomains || []).includes(newDomain)) {
                    handleChange('customDomains', [...(formData.customDomains || []), newDomain]);
                    e.target.value = '';
                  }
                }
              }}
              disabled={saving}
              placeholder="Tapez un domaine (ex: www.mon-asso.fr) et appuyez sur Entrée"
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white w-full sm:max-w-md"
            />
            <span className="text-[10px] text-stone-500 font-medium">Appuyez sur <kbd className="bg-stone-100 border border-stone-300 rounded px-1">Entrée</kbd> pour ajouter un domaine. Saisissez le domaine sans "http://" ou "https://". Pensez à configurer les DNS de votre nom de domaine pour pointer vers notre serveur.</span>
          </div>
        </div>
      </CordelCard>

      {/* SECTION 2 : Coordonnées Générales de Contact */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2">
          <span>📧 Coordonnées Générales de Contact</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* E-mail de contact */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Adresse E-mail publique de contact
            </label>
            <input
              type="email"
              value={publicTheme.publicContactEmail || ''}
              onChange={(e) => handleThemeChange('publicContactEmail', e.target.value)}
              disabled={saving}
              placeholder="contact@nom-association.fr"
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>

          {/* Téléphone de contact */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80">
              Numéro de téléphone de contact
            </label>
            <input
              type="tel"
              value={publicTheme.publicContactPhone || ''}
              onChange={(e) => handleThemeChange('publicContactPhone', e.target.value)}
              disabled={saving}
              placeholder="06 12 34 56 78"
              className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white"
            />
          </div>
        </div>
      </CordelCard>

      {/* SECTION 3 : Référencement SEO & Méta-Données */}
      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>🔎 Référencement SEO & Méta-Données (Google)</span>
          </h4>
          <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-300">
            Moteurs de recherche
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Optimisez le titre, la description et les mots-clés de votre site vitrine pour apparaître en haut des résultats sur Google.
        </p>

        {/* Titre de la page SEO */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>Titre de la page (Balise Meta Title)</span>
            <span className="text-[10px] text-stone-400 font-normal">Recommandé : 50-60 caractères</span>
          </label>
          <input
            type="text"
            value={publicTheme.seoTitle || ''}
            onChange={(e) => handleThemeChange('seoTitle', e.target.value)}
            disabled={saving}
            placeholder="Ex: Groupe Maracatu & Percussions Brésiliennes - Nom Association"
            className="text-xs font-bold px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>

        {/* Description Meta */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>Description de la page (Meta Description)</span>
            <span className="text-[10px] text-stone-400 font-normal">Recommandé : 150-160 caractères</span>
          </label>
          <textarea
            rows={3}
            value={publicTheme.seoDescription || ''}
            onChange={(e) => handleThemeChange('seoDescription', e.target.value)}
            disabled={saving}
            placeholder="Ex: Retrouvez nos ateliers de percussion brésilienne et de danse traditionnelle maracatu, nos prochaines dates de concert et prestations scéniques."
            className="text-xs font-medium px-3 py-2 border border-encre-noire/30 rounded bg-white resize-none"
          />
        </div>

        {/* Mots-Clés SEO */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/80 flex items-center justify-between">
            <span>Mots-clés SEO (Séparés par des virgules)</span>
            <span className="text-[10px] text-stone-400 font-normal">Ex: maracatu, batucada, musique brésilienne</span>
          </label>
          <input
            type="text"
            value={publicTheme.seoKeywords || ''}
            onChange={(e) => handleThemeChange('seoKeywords', e.target.value)}
            disabled={saving}
            placeholder="maracatu, percussions, danse brésilienne, batucada, spectacle de rue"
            className="text-xs font-mono px-3 py-2 border border-encre-noire/30 rounded bg-white"
          />
        </div>
      </CordelCard>

      {/* SECTION 4 : Mentions Légales & Structure */}
      <CordelCard variant="default" className="p-4 bg-[#fdfaf2] dark:bg-[#201d1a] border-2 border-cordel-master-dark/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center gap-2 mb-4">
          <span>⚖️ Structure Juridique (Mentions Légales)</span>
        </h4>
        <LegalInfoBlock 
          formData={formData} 
          handleChange={handleChange} 
          saving={saving} 
        />
      </CordelCard>

    </div>
  );
}
