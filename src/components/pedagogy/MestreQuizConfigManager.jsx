import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export default function MestreQuizConfigManager({ groupId, onTestQuiz }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState({
    themes: {
      toadas: true,
      traduction: true,
      culture: true,
      atelier: true
    },
    difficulty: 'easy',
    questionCount: 10
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!groupId) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'associations', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().quizConfig) {
          // Merge with default values
          setConfig(prev => ({
            ...prev,
            ...docSnap.data().quizConfig,
            themes: {
              ...prev.themes,
              ...(docSnap.data().quizConfig.themes || {})
            }
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [groupId]);

  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'associations', groupId);
      await updateDoc(docRef, { quizConfig: config });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = (themeKey) => {
    setConfig(prev => ({
      ...prev,
      themes: {
        ...prev.themes,
        [themeKey]: !prev.themes[themeKey]
      }
    }));
  };

  if (loading) return <div className="p-4 text-xs font-bold text-center">{t('pedagogy.progress.chargementDeLaConfiguration')}</div>;

  return (
    <CordelCard variant="default" className="p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          <span>⚙️</span>{t('pedagogy.progress.configurationGlobaleDesQcm')}</h3>
        <p className="text-xs text-cordel-master-dark opacity-80 leading-relaxed">{t('pedagogy.progress.definissezIciQuelsThemesSeront')}</p>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood">{t('pedagogy.progress.themesActives')}</span>

        {/* Toadas */}
        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded border transition-colors ${config.themes.toadas ? 'bg-[#fdfaf2] border-cordel-wood' : 'bg-neutral-50 border-encre-noire/10 opacity-70'}`}>
          <input 
            type="checkbox" 
            checked={config.themes.toadas}
            onChange={() => toggleTheme('toadas')}
            className="accent-cordel-wood w-5 h-5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-encre-noire">{t('pedagogy.progress.toadasChants')}</span>
            <span className="text-[9px] text-encre-noire/60">{t('pedagogy.progress.quizSurLeRythmeLa')}</span>
          </div>
        </label>

        {/* Traduction */}
        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded border transition-colors ${config.themes.traduction ? 'bg-[#fdfaf2] border-cordel-wood' : 'bg-neutral-50 border-encre-noire/10 opacity-70'}`}>
          <input 
            type="checkbox" 
            checked={config.themes.traduction}
            onChange={() => toggleTheme('traduction')}
            className="accent-cordel-wood w-5 h-5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-encre-noire">{t('pedagogy.progress.traductionPtFr')}</span>
            <span className="text-[9px] text-encre-noire/60">{t('pedagogy.progress.autoEvaluationSurLeVocabulaire')}</span>
          </div>
        </label>

        {/* Culture */}
        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded border transition-colors ${config.themes.culture ? 'bg-[#fdfaf2] border-cordel-wood' : 'bg-neutral-50 border-encre-noire/10 opacity-70'}`}>
          <input 
            type="checkbox" 
            checked={config.themes.culture}
            onChange={() => toggleTheme('culture')}
            className="accent-cordel-wood w-5 h-5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-encre-noire">{t('pedagogy.progress.cultureHistoire')}</span>
            <span className="text-[9px] text-encre-noire/60">{t('pedagogy.progress.questionsATrousBaseesSur')}</span>
          </div>
        </label>

        {/* Atelier */}
        <label className={`flex items-center gap-3 cursor-pointer p-3 rounded border transition-colors ${config.themes.atelier ? 'bg-[#fdfaf2] border-cordel-wood' : 'bg-neutral-50 border-encre-noire/10 opacity-70'}`}>
          <input 
            type="checkbox" 
            checked={config.themes.atelier}
            onChange={() => toggleTheme('atelier')}
            className="accent-cordel-wood w-5 h-5"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-encre-noire">{t('pedagogy.progress.atelierCouture')}</span>
            <span className="text-[9px] text-encre-noire/60">{t('pedagogy.progress.questionsPratiquesBaseesSurLes')}</span>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-cordel-wood">{t('pedagogy.progress.difficulteParDefaut')}</label>
          <select 
            value={config.difficulty} 
            onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
            className="w-full p-2 border-2 border-encre-noire/30 rounded text-xs font-bold"
          >
            <option value="easy">{t('pedagogy.progress.debutantOptionsSimples')}</option>
            <option value="medium">{t('pedagogy.progress.confirmeOptionsMixtes')}</option>
            <option value="hard">{t('pedagogy.progress.expertPiegesSemantiques')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-cordel-wood">{t('pedagogy.progress.nombreDeQuestions')}</label>
          <select 
            value={config.questionCount} 
            onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
            className="w-full p-2 border-2 border-encre-noire/30 rounded text-xs font-bold"
          >
            <option value={5}>{t('pedagogy.progress.cinqQuestionsSessionRapide')}</option>
            <option value={10}>{t('pedagogy.progress.dixQuestionsStandard')}</option>
            <option value={15}>{t('pedagogy.progress.quinzeQuestionsDefiLong')}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-cordel-master-dark/30 mt-2">
        <CordelButton 
          variant="secondary" 
          onClick={() => onTestQuiz && onTestQuiz(config)} 
          className="px-4 py-2 text-[10px] font-black uppercase"
        >{t('pedagogy.progress.testerUneSessionQuiz')}</CordelButton>
        <CordelButton 
          variant="ocre" 
          onClick={handleSave} 
          disabled={saving}
          className="px-6 py-2 text-xs font-black uppercase tracking-widest"
        >
          {saving ? t('pedagogy.progress.sauvegarde') : t('pedagogy.progress.enregistrer')}
        </CordelButton>
      </div>
    </CordelCard>
  );
}
