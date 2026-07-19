import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloScroll } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';

export default function ActivityReports({ groupId, onBack, isEmbedded }) {
  const { t } = useTranslation();

  // Set default dates to school year (Sep 1st of current/previous year to Aug 31st of current/next year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
  const defaultStartDate = `${startYear}-09-01`;
  const defaultEndDate = `${startYear + 1}-08-31`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const [eventTypes, setEventTypes] = useState({
    prestation: true,
    repetition: true,
    stage: true,
    atelier: true,
    reunion: true
  });

  const [exportingActivity, setExportingActivity] = useState(false);

  const handleCheckboxChange = (type) => {
    setEventTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleExportActivity = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une date de début et de fin.");
      return;
    }
    setExportingActivity(true);
    try {
      // Fetch events
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);
      
      const fetchedEvents = [];
      querySnapshot.forEach((docSnap) => {
        fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Filter events by date range and type
      const filteredEvents = fetchedEvents.filter(event => {
        const eventDateStr = event.date ? event.date.substring(0, 10) : '';
        const matchesDate = eventDateStr && eventDateStr >= startDate && eventDateStr <= endDate;
        const matchesType = eventTypes[event.type] === true;
        return matchesDate && matchesType;
      });

      // Sort chronologically
      filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Build CSV content
      const headers = ["Date", "Titre", "Type", "Lieu", "Nombre de présents"];
      const rows = filteredEvents.map(event => {
        const dateStr = event.date ? event.date.substring(0, 10) : '';
        const presentCount = (event.inscriptions || []).filter(i => i.status === 'present').length;
        
        let displayType = event.type;
        if (event.type === 'prestation') displayType = "Prestation";
        else if (event.type === 'repetition') displayType = "Répétition";
        else if (event.type === 'stage') displayType = "Stage";
        else if (event.type === 'atelier') displayType = "Atelier";
        else if (event.type === 'reunion') displayType = "Réunion";

        return [
          dateStr,
          event.titre || '',
          displayType,
          event.lieu || '',
          presentCount.toString()
        ];
      });

      // Excel-friendly CSV formatting (semicolon separator, UTF-8 BOM)
      const csvContent = "\uFEFF" + [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bilan_Activite_${startDate}_au_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("ActivityReports - Error exporting activity:", error);
      alert("Erreur lors de la génération de l'export d'activité.");
    } finally {
      setExportingActivity(false);
    }
  };

  return (
    <div className={`flex flex-col text-left select-none w-full ${isEmbedded ? 'gap-4' : 'gap-6 max-w-4xl mx-auto'}`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={onBack} 
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center select-none"
          >
            ⬅️ {t('common.back') || "Retour"}
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <XiloScroll size={16} /> Rapports d'Activité
          </h2>
        </div>
      )}

      {/* Intro info box */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        📊 Ce module permet d'extraire les rapports de présence et d'activité de l'association sur une période choisie pour vous aider à préparer les bilans moraux pour vos Assemblées Générales. Les exports sont générés sous forme de fichiers tableurs CSV compatibles avec Microsoft Excel, LibreOffice et Google Sheets.
      </div>

      {/* Date Filters Card */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1 mb-1">
          📅 Choix de la Période
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de début
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="theme-input w-full font-bold text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de fin
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="theme-input w-full font-bold text-xs"
            />
          </div>
        </div>
      </CordelCard>

      {/* Export Container */}
      <div className="max-w-xl mx-auto w-full">
        <CordelCard variant="default" useExtremeBorder={false} className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-1.5">
              🎭 Exporter le Bilan d'Activité
            </h4>
            <p className="text-[10px] leading-relaxed opacity-85">
              Génère la liste des événements survenus pendant la période spécifiée avec les détails de présence. Idéal pour votre rapport d'activité.
            </p>
            <div className="flex flex-col gap-2 pt-2 text-left">
              <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Types d'événements à inclure :</span>
              <div className="flex flex-col gap-1.5 pl-1">
                {Object.keys(eventTypes).map(type => (
                  <label key={type} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={eventTypes[type]}
                      onChange={() => handleCheckboxChange(type)}
                      className="accent-cordel-wood scale-105"
                    />
                    <span className="capitalize">
                      {type === 'prestation' ? "Prestations" :
                       type === 'repetition' ? "Répétitions" :
                       type === 'stage' ? "Stages" :
                       type === 'atelier' ? "Ateliers" :
                       type === 'reunion' ? "Réunions" : type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleExportActivity}
              disabled={exportingActivity}
              className="w-full text-xs py-2.5 font-bold uppercase tracking-wider"
            >
              {exportingActivity ? "Génération..." : "📄 Exporter l'Activité (CSV)"}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
