import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { distractorPool } from '../../data/distractorPool';
import useConfirm from '../../hooks/useConfirm';

export default function QuizDistractorManager({ profileData }) {
  const { confirm } = useConfirm();
  const [distractors, setDistractors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInputs, setNewInputs] = useState({
    genresMusicaux: '',
    baquesPlausibles: '',
    geographieEtVilles: '',
    lutherieEtMateriaux: '',
    expressionsTraduction: ''
  });

  const categories = [
    { key: 'genresMusicaux', label: 'Genres Musicaux hors-Maracatu', desc: 'Utilisés pour les leurres faciles sur les Toadas.' },
    { key: 'baquesPlausibles', label: 'Baques et Rythmes Fictifs', desc: 'Utilisés comme faux choix de Rythmes en mode extrême.' },
    { key: 'geographieEtVilles', label: 'Villes & Géographie', desc: 'Faux choix pour les questions géographiques ou lieux de la Culture.' },
    { key: 'lutherieEtMateriaux', label: 'Lutherie & Matériaux', desc: 'Leurres pour les QCM des Ateliers (parties d\'instruments, matières).' },
    { key: 'expressionsTraduction', label: 'Traductions et Expressions', desc: 'Faux choix portugais ou français pour le QCM de lexique/traduction.' }
  ];

  useEffect(() => {
    const loadDistractors = async () => {
      if (!profileData?.groupId) return;
      try {
        const d = await getDoc(doc(db, 'associations', profileData.groupId));
        if (d.exists()) {
          const data = d.data();
          if (data.quizDistractors) {
            setDistractors(data.quizDistractors);
          } else {
            // Initialiser with default pool structure if not present
            setDistractors({
              genresMusicaux: distractorPool.genresMusicauxHorsMaracatu || [],
              baquesPlausibles: distractorPool.baquesFictifsEtSimilaires || [],
              geographieEtVilles: distractorPool.villesEtGeographie || [],
              lutherieEtMateriaux: distractorPool.materiauxEtLutherie || [],
              expressionsTraduction: []
            });
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des distracteurs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDistractors();
  }, [profileData?.groupId]);

  const handleSave = async () => {
    if (!profileData?.groupId || !distractors) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'associations', profileData.groupId), {
        quizDistractors: distractors
      });
      alert('Banque de leurres sauvegardée avec succès !');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const isOk = await confirm("Voulez-vous vraiment réinitialiser toutes les catégories aux valeurs par défaut de l'application ? Toutes vos personnalisations seront perdues.");
    if (isOk) {
      setDistractors({
        genresMusicaux: distractorPool.genresMusicauxHorsMaracatu || [],
        baquesPlausibles: distractorPool.baquesFictifsEtSimilaires || [],
        geographieEtVilles: distractorPool.villesEtGeographie || [],
        lutherieEtMateriaux: distractorPool.materiauxEtLutherie || [],
        expressionsTraduction: []
      });
    }
  };

  const removeTag = (categoryKey, indexToRemove) => {
    setDistractors(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey].filter((_, i) => i !== indexToRemove)
    }));
  };

  const addTag = (categoryKey) => {
    const val = newInputs[categoryKey]?.trim();
    if (!val) return;
    setDistractors(prev => {
      const currentList = prev[categoryKey] || [];
      if (currentList.includes(val)) return prev;
      return {
        ...prev,
        [categoryKey]: [...currentList, val]
      };
    });
    setNewInputs(prev => ({ ...prev, [categoryKey]: '' }));
  };

  const handleKeyDown = (e, categoryKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(categoryKey);
    }
  };

  if (loading) return <div className="p-4">Chargement de la banque de leurres...</div>;
  if (!distractors) return <div className="p-4 text-cordel-rouge">Erreur d'initialisation.</div>;

  return (
    <div className="bg-[#fdfaf2] min-h-full">
      <div className="p-4 sm:p-6 bg-white border-b-2 border-encre-noire/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cactus text-3xl font-bold text-encre-noire tracking-wide">Banque de Leurres</h2>
          <p className="text-sm text-encre-noire/70 mt-1">
            Gérez les fausses réponses (distracteurs) injectées dans vos quiz pédagogiques. 
            Une liste riche garantit des QCM variés !
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 border-2 border-cordel-rouge/50 text-cordel-rouge rounded font-bold hover:bg-cordel-rouge hover:text-white transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-cordel-vert text-white rounded font-bold hover:bg-[#20513b] transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {categories.map(cat => {
          const list = distractors[cat.key] || [];
          return (
            <div key={cat.key} className="bg-white p-4 rounded-lg shadow border-l-4 border-cordel-wood">
              <div className="mb-3">
                <h3 className="font-bold text-lg text-encre-noire flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cordel-wood"></span>
                  {cat.label}
                </h3>
                <p className="text-xs text-encre-noire/60">{cat.desc}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {list.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-[#fdfaf2] border border-encre-noire/20 text-encre-noire px-3 py-1 rounded-full text-sm font-medium">
                    <span>{item}</span>
                    <button
                      onClick={() => removeTag(cat.key, idx)}
                      className="ml-1 text-encre-noire/40 hover:text-cordel-rouge focus:outline-none"
                      title="Supprimer ce leurre"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {list.length === 0 && (
                  <span className="text-sm text-encre-noire/40 italic">Aucun leurre dans cette catégorie. Le QCM utilisera le dictionnaire universel en secours.</span>
                )}
              </div>

              <div className="flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Ajouter un leurre..."
                  className="flex-1 px-3 py-1.5 border border-encre-noire/20 rounded focus:outline-none focus:border-cordel-wood text-sm bg-transparent"
                  value={newInputs[cat.key] || ''}
                  onChange={(e) => setNewInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, cat.key)}
                />
                <button
                  onClick={() => addTag(cat.key)}
                  className="px-3 py-1.5 bg-cordel-wood text-white rounded font-bold hover:opacity-90"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
