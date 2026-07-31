import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { downloadInvoicePDF, generateInvoicePDF } from '../../utils/invoicePdfGenerator';
import GigSendEmailModal from './GigSendEmailModal';

/**
 * Modale de génération de Devis commercial pour le Pôle Diffusion.
 * Croise les données du dossier de prestation (gig) et de l'événement Agenda lié.
 */
export default function GigQuoteGeneratorModal({
  isOpen,
  onClose,
  gig,
  groupId,
  associationSettings = {},
  onSuccess
}) {
  const [clientForm, setClientForm] = useState({
    nom: '',
    email: '',
    adresse: '',
    siret: ''
  });

  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState('');
  const [generatedPdfFilename, setGeneratedPdfFilename] = useState('');
  const [preparedInvoicePayload, setPreparedInvoicePayload] = useState(null);

  const [devisMeta, setDevisMeta] = useState({
    numero: '',
    dateEmission: '',
    dateEcheance: '',
    notes: ''
  });

  const [lignes, setLignes] = useState([
    { id: '1', description: 'Prestation musicale Maracatu', quantite: 1, prixUnitaire: 0 }
  ]);

  const [linkedEvent, setLinkedEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Génération du numéro de devis auto DEV-YYYYMM-XXX
  const generateAutoDevisNumber = () => {
    const d = new Date();
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = String(Math.floor(Math.random() * 900) + 100);
    return `DEV-${yearMonth}-${randomSuffix}`;
  };

  // Chargement et croisement des données à l'ouverture de la modale
  useEffect(() => {
    if (!gig || !isOpen) return;

    // 1. Données du client issues du dossier de prestation
    setClientForm({
      nom: gig.organizer || gig.eventName || 'Organisateur',
      email: gig.contactEmail || '',
      adresse: gig.location || '',
      siret: ''
    });

    // 2. Dates et numéro
    const today = new Date().toISOString().split('T')[0];
    const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setDevisMeta({
      numero: generateAutoDevisNumber(),
      dateEmission: today,
      dateEcheance: inThirtyDays,
      notes: `Devis établi pour la prestation "${gig.eventName}" du ${gig.date || today} à ${gig.location || 'Lieu à définir'}.`
    });

    // 3. Initialisation des lignes tarifaires avec le montant du gig
    const baseAmount = parseFloat(gig.amount) || 0;
    setLignes([
      { id: '1', description: `Prestation artistique Maracatu - ${gig.eventName || ''}`, quantite: 1, prixUnitaire: baseAmount }
    ]);

    // 4. Recherche croisée de l'événement lié dans Firestore `events`
    const fetchLinkedEvent = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('createdFromGigId', '==', gig.id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const evtData = snap.docs[0].data();
          setLinkedEvent({ id: snap.docs[0].id, ...evtData });
        }
      } catch (err) {
        console.warn("GigQuoteGeneratorModal - Erreur récupération événement lié :", err);
      }
    };
    fetchLinkedEvent();
  }, [gig, isOpen]);

  if (!isOpen || !gig) return null;

  // Calculs financiers dynamiques
  const totalHT = lignes.reduce((sum, item) => sum + ((item.quantite || 1) * (parseFloat(item.prixUnitaire) || 0)), 0);
  const totalTTC = totalHT; // TVA non applicable pour les associations (Art. 261-7-1° du CGI)

  // Gestion des lignes tarifaires
  const handleLineChange = (id, field, value) => {
    setLignes(prev => prev.map(line => {
      if (line.id === id) {
        return {
          ...line,
          [field]: field === 'quantite' ? (parseInt(value, 10) || 1) : field === 'prixUnitaire' ? (parseFloat(value) || 0) : value
        };
      }
      return line;
    }));
  };

  const handleAddLine = (template = null) => {
    const newId = String(Date.now());
    if (template === 'km') {
      setLignes(prev => [...prev, { id: newId, description: 'Frais de déplacement / Kilométriques (Aller-Retour)', quantite: 1, prixUnitaire: 120 }]);
    } else if (template === 'repas') {
      setLignes(prev => [...prev, { id: newId, description: 'Défraiement restauration / Repas musiciens', quantite: 10, prixUnitaire: 15 }]);
    } else if (template === 'hebergement') {
      setLignes(prev => [...prev, { id: newId, description: 'Forfait hébergement / Logistique équipe', quantite: 1, prixUnitaire: 200 }]);
    } else {
      setLignes(prev => [...prev, { id: newId, description: 'Prestation / Option complémentaire', quantite: 1, prixUnitaire: 0 }]);
    }
  };

  const handleRemoveLine = (id) => {
    if (lignes.length <= 1) return;
    setLignes(prev => prev.filter(line => line.id !== id));
  };

  // Formatage de la structure Devis pour le générateur PDF
  const buildInvoicePayload = () => {
    return {
      type: 'devis',
      numero: devisMeta.numero,
      client: {
        nom: clientForm.nom,
        email: clientForm.email,
        adresse: clientForm.adresse,
        siret: clientForm.siret
      },
      dateEmission: devisMeta.dateEmission,
      dateEcheance: devisMeta.dateEcheance,
      statut: 'envoye',
      lignes: lignes,
      montantHT: totalHT,
      montantTTC: totalTTC,
      notes: devisMeta.notes
    };
  };

  // Téléchargement direct du Devis PDF
  const handleDownloadPDF = () => {
    const invoicePayload = buildInvoicePayload();
    downloadInvoicePDF(invoicePayload, associationSettings);
  };

  // Enregistrement dans Firestore (collection `invoices`) et mise à jour du gig vers 3_devis_envoye
  const handleSaveAndRegister = async () => {
    setSaving(true);
    try {
      const invoicePayload = buildInvoicePayload();

      // 1. Inscription dans la collection `invoices`
      const newInvoiceDoc = {
        groupId: gig.groupId || groupId,
        type: 'devis',
        numero: devisMeta.numero,
        gigId: gig.id,
        client: invoicePayload.client,
        dateEmission: devisMeta.dateEmission,
        dateEcheance: devisMeta.dateEcheance,
        statut: 'envoye',
        lignes: lignes,
        montantHT: totalHT,
        montantTTC: totalTTC,
        notes: devisMeta.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'invoices'), newInvoiceDoc);

      // 2. Mise à jour du dossier de prestation (gig) vers le statut '3_devis' ("Devis transmis")
      const gigRef = doc(db, 'gigs_pipeline', gig.id);
      await updateDoc(gigRef, {
        status: '3_devis',
        amount: totalTTC,
        updatedAt: serverTimestamp()
      });

      // 3. Génération du PDF en mémoire en Base64 pour l'attachement Brevo
      const pdfDoc = generateInvoicePDF(invoicePayload, associationSettings);
      const dataUri = pdfDoc.output('datauristring');
      const base64Data = dataUri.split(',')[1] || '';
      const filename = `Devis_${devisMeta.numero}_${(clientForm.nom || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      setGeneratedPdfBase64(base64Data);
      setGeneratedPdfFilename(filename);
      setPreparedInvoicePayload(invoicePayload);

      // 4. Ouverture de la modale d'envoi d'email Brevo
      setIsSendEmailModalOpen(true);
    } catch (err) {
      console.error("GigQuoteGeneratorModal - Erreur enregistrement devis :", err);
      alert("Erreur lors de la génération du devis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-3xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto text-left relative"
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
                Génération de Devis Commercial — Pôle Diffusion
              </h3>
              <p className="text-[10px] text-stone-500 font-medium">
                Dossier : {gig.eventName} {linkedEvent ? `(Lié à l'événement Agenda le ${linkedEvent.date})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Bloc Informations Client & Métadonnées Devis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded border border-stone-200">
          {/* Informations Destinataire / Organisateur */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-extrabold uppercase text-cordel-wood">
              👤 Destinataire (Organisateur / Client) :
            </span>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={clientForm.nom}
                onChange={(e) => setClientForm(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Raison sociale / Nom du client"
                className="p-1.5 border border-stone-300 rounded font-bold bg-white"
              />
              <input
                type="text"
                value={clientForm.adresse}
                onChange={(e) => setClientForm(prev => ({ ...prev, adresse: e.target.value }))}
                placeholder="Adresse complète du client"
                className="p-1.5 border border-stone-300 rounded bg-white text-[11px]"
              />
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email de contact"
                  className="p-1.5 border border-stone-300 rounded bg-white text-[11px]"
                />
                <input
                  type="text"
                  value={clientForm.siret}
                  onChange={(e) => setClientForm(prev => ({ ...prev, siret: e.target.value }))}
                  placeholder="N° SIRET client"
                  className="p-1.5 border border-stone-300 rounded bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Numéro et Dates du Devis */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-extrabold uppercase text-cordel-wood">
              📋 Références du Devis :
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-stone-600">N° Devis :</span>
                <input
                  type="text"
                  value={devisMeta.numero}
                  onChange={(e) => setDevisMeta(prev => ({ ...prev, numero: e.target.value }))}
                  className="p-1.5 border border-stone-300 rounded font-mono font-bold text-stone-900 bg-amber-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold uppercase text-stone-500">Date émission</label>
                  <input
                    type="date"
                    value={devisMeta.dateEmission}
                    onChange={(e) => setDevisMeta(prev => ({ ...prev, dateEmission: e.target.value }))}
                    className="p-1.5 border border-stone-300 rounded bg-white text-[11px]"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[9px] font-bold uppercase text-stone-500">Date validité</label>
                  <input
                    type="date"
                    value={devisMeta.dateEcheance}
                    onChange={(e) => setDevisMeta(prev => ({ ...prev, dateEcheance: e.target.value }))}
                    className="p-1.5 border border-stone-300 rounded bg-white text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau dynamique des Lignes Tarifaires */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-stone-700">
              📊 Lignes Tarifaires du Devis :
            </span>
            {/* Templates d'ajout rapide */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleAddLine('km')}
                className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer"
              >
                + Deplacement (Km)
              </button>
              <button
                type="button"
                onClick={() => handleAddLine('repas')}
                className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer"
              >
                + Repas
              </button>
              <button
                type="button"
                onClick={() => handleAddLine('hebergement')}
                className="px-2 py-0.5 text-[9px] font-bold uppercase bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded cursor-pointer"
              >
                + Hébergement
              </button>
              <button
                type="button"
                onClick={() => handleAddLine()}
                className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-800 text-white rounded cursor-pointer"
              >
                + Ligne vierge
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border border-stone-300 rounded overflow-hidden p-2 bg-stone-50">
            <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase text-stone-600 px-1">
              <div className="col-span-6">Description de la prestation / frais</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-3 text-right">Prix Unit. HT (€)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {lignes.map((line) => (
              <div key={line.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                <input
                  type="text"
                  value={line.description}
                  onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                  placeholder="Description..."
                  className="col-span-6 p-1.5 border border-stone-300 rounded bg-white text-[11px]"
                />
                <input
                  type="number"
                  min="1"
                  value={line.quantite}
                  onChange={(e) => handleLineChange(line.id, 'quantite', e.target.value)}
                  className="col-span-2 p-1.5 border border-stone-300 rounded bg-white text-center font-bold"
                />
                <input
                  type="number"
                  step="0.01"
                  value={line.prixUnitaire}
                  onChange={(e) => handleLineChange(line.id, 'prixUnitaire', e.target.value)}
                  className="col-span-3 p-1.5 border border-stone-300 rounded bg-white text-right font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lignes.length <= 1}
                  className="col-span-1 text-center text-red-600 font-bold hover:text-red-900 cursor-pointer disabled:opacity-30"
                  title="Supprimer la ligne"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totalisation & Remarques */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-300 rounded">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-stone-700">Mention légale :</span>
            <span className="text-[10px] font-semibold text-stone-600 italic">
              TVA non applicable, art. 261-7-1° du CGI (Exonération association)
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase text-stone-600">Total Net à Payer (HT/TTC) :</span>
            <span className="text-xl font-black text-cordel-wood font-mono">
              {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </span>
          </div>
        </div>

        {/* Zone Notes / Mentions particulières */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold uppercase text-stone-700">
            Notes / Mentions particulières sur le devis :
          </label>
          <textarea
            value={devisMeta.notes}
            onChange={(e) => setDevisMeta(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="p-2 border border-stone-300 rounded text-stone-900 bg-white text-[11px] leading-relaxed"
          />
        </div>

        {/* Boutons d'Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dashed">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="text-[11px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer flex items-center gap-1"
            title="Télécharger directement le PDF sans envoyer d'e-mail"
          >
            <span>📥 Télécharger uniquement le PDF (Secours)</span>
          </button>

          <div className="flex items-center gap-2">
            <CordelButton type="button" variant="default" onClick={onClose} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton
              type="button"
              variant="vert"
              onClick={handleSaveAndRegister}
              disabled={saving}
              className="text-xs font-extrabold flex items-center gap-1.5"
            >
              <span>{saving ? 'Préparation...' : '✉️ Valider & Émettre par E-mail (Brevo)'}</span>
            </CordelButton>
          </div>
        </div>
      </CordelCard>

      {/* Modale d'envoi du devis PDF par email via Brevo */}
      <GigSendEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        gig={gig}
        invoicePayload={preparedInvoicePayload}
        associationSettings={associationSettings}
        pdfBase64={generatedPdfBase64}
        pdfFilename={generatedPdfFilename}
        onSendSuccess={() => {
          if (onSuccess) {
            onSuccess(devisMeta.numero);
          }
          onClose();
        }}
      />
    </div>
  );
}
