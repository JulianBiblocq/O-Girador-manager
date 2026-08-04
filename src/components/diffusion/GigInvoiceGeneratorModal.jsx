import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { downloadInvoicePDF, generateInvoicePDF } from '../../utils/invoicePdfGenerator';
import GigSendEmailModal from './GigSendEmailModal';

/**
 * Modale de génération de Facture officielle pour le Pôle Diffusion et l'Agenda.
 * Génère le PDF de Facture N° FAC-YYYYMM-XXX et prépare le pont vers la Trésorerie.
 */
export default function GigInvoiceGeneratorModal({
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

  const [invoiceMeta, setInvoiceMeta] = useState({
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

  // Génération du numéro de facture auto FAC-YYYYMM-XXX
  const generateAutoInvoiceNumber = () => {
    const d = new Date();
    const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = String(Math.floor(Math.random() * 900) + 100);
    return `FAC-${yearMonth}-${randomSuffix}`;
  };

  // Chargement et croisement des données à l'ouverture
  useEffect(() => {
    if (!gig || !isOpen) return;

    setClientForm({
      nom: gig.organizer || '',
      email: gig.contactEmail || '',
      adresse: gig.location || '',
      siret: ''
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setInvoiceMeta({
      numero: generateAutoInvoiceNumber(),
      dateEmission: todayStr,
      dateEcheance: in30Days,
      notes: 'Paiement à réception par virement bancaire ou chèque.'
    });

    const montantInitial = parseFloat(gig.amount) || 0;
    setLignes([
      {
        id: '1',
        description: `Prestation artistique "${gig.eventName || 'Maracatu'}" (${gig.date || 'Date convenue'})`,
        quantite: 1,
        prixUnitaire: montantInitial
      }
    ]);

    // Croisement des données logistiques depuis l'Agenda
    const fetchLinkedEventData = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('gigId', '==', gig.id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const evtData = snap.docs[0].data();
          setLinkedEvent(evtData);
          if (evtData.description && !gig.notes) {
            setInvoiceMeta(prev => ({
              ...prev,
              notes: `${prev.notes}\n[Agenda] Logistique : ${evtData.description}`
            }));
          }
        }
      } catch (err) {
        console.warn("GigInvoiceGeneratorModal - Erreur de lecture événement lié :", err);
      }
    };

    fetchLinkedEventData();
  }, [gig, isOpen]);

  if (!isOpen || !gig) return null;

  // Calculs financiers
  const totalTTC = lignes.reduce((acc, l) => acc + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0), 0);

  // Gestion des lignes de tarification
  const handleLineChange = (id, field, value) => {
    setLignes(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddLine = () => {
    setLignes(prev => [
      ...prev,
      { id: String(Date.now()), description: '', quantite: 1, prixUnitaire: 0 }
    ]);
  };

  const handleRemoveLine = (id) => {
    if (lignes.length <= 1) return;
    setLignes(prev => prev.filter(l => l.id !== id));
  };

  // Construction de l'objet payload de Facture
  const buildInvoicePayload = () => {
    return {
      type: 'facture',
      numero: invoiceMeta.numero,
      dateEmission: invoiceMeta.dateEmission,
      dateEcheance: invoiceMeta.dateEcheance,
      client: {
        nom: clientForm.nom,
        email: clientForm.email,
        adresse: clientForm.adresse,
        siret: clientForm.siret
      },
      lignes: lignes.map(l => ({
        description: l.description,
        quantite: parseFloat(l.quantite) || 0,
        prixUnitaire: parseFloat(l.prixUnitaire) || 0
      })),
      montantHT: totalTTC,
      montantTTC: totalTTC,
      notes: invoiceMeta.notes
    };
  };

  // Téléchargement direct du PDF Facture
  const handleDownloadPDF = async () => {
    const invoicePayload = buildInvoicePayload();
    await downloadInvoicePDF(invoicePayload, associationSettings);
  };

  // Enregistrement dans Firestore (collection `invoices`) et mise à jour vers statut 5_facture_emise
  const handleSaveAndRegister = async () => {
    setSaving(true);
    try {
      const invoicePayload = buildInvoicePayload();

      // 1. Inscription dans la collection `invoices`
      const newInvoiceDoc = {
        groupId: gig.groupId || groupId,
        type: 'facture',
        numero: invoiceMeta.numero,
        gigId: gig.id,
        client: invoicePayload.client,
        dateEmission: invoiceMeta.dateEmission,
        dateEcheance: invoiceMeta.dateEcheance,
        statut: 'envoye',
        montantHT: totalTTC,
        montantTTC: totalTTC,
        lignes: invoicePayload.lignes,
        notes: invoiceMeta.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'invoices'), newInvoiceDoc);
      invoicePayload.id = docRef.id;

      // 2. Mise à jour du statut du dossier gig dans Pôle Diffusion vers '5_facture_emise'
      const gigRef = doc(db, 'associations', gig.groupId || groupId, 'gigs', gig.id);
      await updateDoc(gigRef, {
        status: '5_facture_emise',
        invoiceNumber: invoiceMeta.numero,
        invoiceId: docRef.id,
        amount: totalTTC,
        updatedAt: serverTimestamp()
      });

      // 3. Génération du PDF en mémoire en Base64 pure pour Brevo
      const pdfDoc = await generateInvoicePDF(invoicePayload, associationSettings);
      const base64Data = pdfDoc.output('base64');
      const filename = `Facture_${invoiceMeta.numero}_${(clientForm.nom || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      setGeneratedPdfBase64(base64Data);
      setGeneratedPdfFilename(filename);
      setPreparedInvoicePayload(invoicePayload);

      // 4. Ouverture de la modale d'envoi d'email Brevo
      setIsSendEmailModalOpen(true);
    } catch (err) {
      console.error("GigInvoiceGeneratorModal - Erreur lors de l'émission :", err);
      alert("Erreur lors de l'enregistrement de la facture : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
        tabIndex={-1}
        onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
      >
        <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
          {/* 1. Header (Fixe) */}
          <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧾</span>
              <div>
                <h3 className="text-base font-extrabold uppercase text-cordel-wood">
                  Génération de Facture Officielle
                </h3>
                <p className="text-[10px] text-stone-500 font-bold">
                  Prestation : {gig.eventName} ({gig.date})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
              title="Fermer (Échap)"
            >
              ✕
            </button>
          </div>

          {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Identifiants & Dates Facture */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">N° Chronologique Facture</label>
              <input
                type="text"
                required
                value={invoiceMeta.numero}
                onChange={(e) => setInvoiceMeta({ ...invoiceMeta, numero: e.target.value })}
                className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Date d'Émission</label>
              <input
                type="date"
                required
                value={invoiceMeta.dateEmission}
                onChange={(e) => setInvoiceMeta({ ...invoiceMeta, dateEmission: e.target.value })}
                className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Date d'Échéance</label>
              <input
                type="date"
                value={invoiceMeta.dateEcheance}
                onChange={(e) => setInvoiceMeta({ ...invoiceMeta, dateEcheance: e.target.value })}
                className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          {/* Destinataire Client / Organisateur */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50 border border-stone-200 rounded">
            <h4 className="text-[11px] font-extrabold uppercase text-cordel-wood border-b pb-1">
              🏢 Informations Organisateur / Destinataire
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Nom du Client / Organisme *</label>
                <input
                  type="text"
                  required
                  value={clientForm.nom}
                  onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                  placeholder="Mairie de Lille, Association..."
                  className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">E-mail de Facturation</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="facturation@client.com"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-stone-700">Adresse Postale</label>
                <input
                  type="text"
                  value={clientForm.adresse}
                  onChange={(e) => setClientForm({ ...clientForm, adresse: e.target.value })}
                  placeholder="Hôtel de Ville, Place du Théâtre, 59000 Lille"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-stone-700">SIRET Client (Optionnel)</label>
                <input
                  type="text"
                  value={clientForm.siret}
                  onChange={(e) => setClientForm({ ...clientForm, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                  className="text-xs font-mono px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Lignes de Prestations */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                📊 Lignes de Tarification & Prestations
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-[10px] font-extrabold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                + Ajouter une ligne
              </button>
            </div>

            <div className="flex flex-col gap-1 border border-stone-200 rounded overflow-hidden">
              <div className="grid grid-cols-12 gap-1 bg-stone-100 p-2 text-[9px] font-extrabold uppercase text-stone-600 border-b">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Quantité</div>
                <div className="col-span-3 text-right">Prix Unit. HT (€)</div>
                <div className="col-span-1"></div>
              </div>

              {lignes.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-1 p-1.5 text-xs border-b last:border-0 bg-white items-center">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(line.id, 'description', e.target.value)}
                    placeholder="Libellé prestation..."
                    className="col-span-6 p-1 border border-stone-300 rounded text-xs font-semibold"
                  />
                  <input
                    type="number"
                    min="1"
                    value={line.quantite}
                    onChange={(e) => handleLineChange(line.id, 'quantite', e.target.value)}
                    className="col-span-2 p-1 border border-stone-300 rounded text-center text-xs font-bold"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={line.prixUnitaire}
                    onChange={(e) => handleLineChange(line.id, 'prixUnitaire', e.target.value)}
                    className="col-span-3 p-1 border border-stone-300 rounded text-right font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.id)}
                    disabled={lignes.length <= 1}
                    className="col-span-1 text-center text-red-600 hover:text-red-800 disabled:opacity-30 font-bold cursor-pointer"
                    title="Supprimer la ligne"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Total Net et Notes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cordel-bg-light p-3 rounded border border-cordel-master-dark/20">
            <div className="flex flex-col gap-1 w-full sm:w-2/3">
              <label className="text-[9px] font-extrabold uppercase text-cordel-wood">
                Conditions de Règlement & Mentions
              </label>
              <input
                type="text"
                value={invoiceMeta.notes}
                onChange={(e) => setInvoiceMeta(prev => ({ ...prev, notes: e.target.value }))}
                className="text-xs font-bold px-2.5 py-1 border border-stone-300 rounded bg-white w-full"
              />
            </div>

            <div className="flex flex-col items-end w-full sm:w-1/3">
              <span className="text-[9px] font-extrabold uppercase text-stone-500">Total Net à Payer</span>
              <span className="text-xl font-black text-emerald-800 font-mono">
                {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dashed">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="text-[11px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer flex items-center gap-1"
            title="Télécharger directement le PDF de la facture sans envoyer d'e-mail"
          >
            <span>📥 Télécharger la Facture PDF (Secours)</span>
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
              <span>{saving ? 'Émission...' : '✉️ Valider & Envoyer la Facture (Brevo)'}</span>
            </CordelButton>
          </div>
        </div>

        {/* Modale d'envoi de la Facture PDF par email via Brevo */}
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
              onSuccess(invoiceMeta.numero);
            }
            onClose();
          }}
        />
      </div>
    </div>
  );
}
