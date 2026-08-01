import { jsPDF } from 'jspdf';

/**
 * Formate un nombre en montant monétaire en Euros (ex: 1 250,00 €)
 */
const formatMoney = (amount) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
};

/**
 * Formate une date au format français DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '__________________';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Charge une URL d'image (ex: Firebase Storage) et la convertit en chaîne DataURI Base64 pour jsPDF.
 *
 * @param {string} url URL publique de l'image
 * @returns {Promise<string|null>} Data URI base64 ou null en cas d'erreur
 */
export async function loadImageAsBase64(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('data:image/')) return url;

  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("loadImageAsBase64 - Erreur de chargement d'image :", err);
    return null;
  }
}

/**
 * Génère un Contrat de Prestation Scénique & Artistique 100% Dynamique (SaaS / Marque Blanche)
 * avec incrustation automatique de la signature numérisée du représentant légal.
 *
 * @param {Object} gigData Données du dossier de prestation / événement
 * @param {Object} associationSettings Paramètres globaux de l'association
 * @returns {Promise<jsPDF>} Le document jsPDF généré
 */
export async function generateContractPDF(gigData = {}, associationSettings = {}) {
  const doc = new jsPDF();

  // Extraction dynamique des données de l'association (avec tirets de secours si vide)
  const assocName = (associationSettings.nom || associationSettings.associationName || associationSettings.legalName || '').trim() || '__________________';
  const assocStructure = (associationSettings.structureJuridique || '').trim() || 'Association Loi 1901';
  const assocAdresse = (associationSettings.adresseSiegeSocial || associationSettings.adresse || associationSettings.publicContactAddress || '').trim() || '__________________';
  const assocSiret = (associationSettings.siret || associationSettings.rna || '').trim() || '__________________';
  const assocEmail = (associationSettings.email || associationSettings.emailOfficiel || associationSettings.publicContactEmail || '').trim() || '__________________';
  const assocPhone = (associationSettings.telephone || associationSettings.phone || '').trim() || '__________________';
  const clauseSpecifique = (associationSettings.clauseSpecifique || associationSettings.legalClause || '').trim();

  // URLs des signatures numérisées
  const signaturePresidentUrl = associationSettings.signaturePresidentUrl || '';
  const signatureTresorierUrl = associationSettings.signatureTresorierUrl || '';

  // Chargement asynchrone des signatures en Base64 pour jsPDF
  const presidentSigBase64 = signaturePresidentUrl ? await loadImageAsBase64(signaturePresidentUrl) : null;
  const tresorierSigBase64 = signatureTresorierUrl ? await loadImageAsBase64(signatureTresorierUrl) : null;

  // Extraction des données de la prestation et de l'organisateur (client)
  const clientNom = (gigData.organizer || gigData.client?.nom || '').trim() || '__________________';
  const clientAdresse = (gigData.location || gigData.client?.adresse || '').trim() || '__________________';
  const clientEmail = (gigData.contactEmail || gigData.client?.email || '').trim() || '__________________';
  const clientPhone = (gigData.contactPhone || gigData.client?.phone || '').trim() || '__________________';
  const eventName = (gigData.eventName || gigData.titre || '').trim() || 'Prestation artistique';
  const eventDate = formatDate(gigData.date);
  const amount = parseFloat(gigData.amount) || 0;

  let yPos = 20;

  // 1. En-tête : Prestataire (Gauche)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(139, 42, 26); // Couleur Cordel
  doc.text(assocName.toUpperCase(), 20, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(assocStructure, 20, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  if (assocAdresse !== '__________________') {
    const addrLines = doc.splitTextToSize(`Siège social : ${assocAdresse}`, 85);
    doc.text(addrLines, 20, yPos);
    yPos += addrLines.length * 4.2;
  } else {
    doc.text('Siège social : __________________', 20, yPos);
    yPos += 4.2;
  }

  doc.text(`SIRET / RNA : ${assocSiret}`, 20, yPos);
  yPos += 4.2;
  doc.text(`Email : ${assocEmail}`, 20, yPos);
  yPos += 4.2;
  doc.text(`Tél : ${assocPhone}`, 20, yPos);

  // 2. En-tête : Organisateur / Client (Droite)
  let clientY = 20;
  const clientX = 115;
  doc.setFillColor(248, 246, 240);
  doc.setDrawColor(200, 190, 175);
  doc.rect(clientX - 5, clientY, 80, 42, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 23, 22);
  doc.text('L\'ORGANISATEUR (CLIENT) :', clientX, clientY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(clientNom, clientX, clientY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);

  let cOff = 20;
  if (clientAdresse !== '__________________') {
    const clientAddrLines = doc.splitTextToSize(`Lieu : ${clientAdresse}`, 72);
    doc.text(clientAddrLines, clientX, clientY + cOff);
    cOff += clientAddrLines.length * 4;
  }
  doc.text(`Email : ${clientEmail}`, clientX, clientY + cOff);
  cOff += 4;
  doc.text(`Tél : ${clientPhone}`, clientX, clientY + cOff);

  // 3. Titre du Document
  yPos = Math.max(yPos + 10, 68);
  doc.setDrawColor(139, 42, 26);
  doc.setLineWidth(1);
  doc.line(20, yPos, 190, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(24, 23, 22);
  doc.text('CONTRAT DE PRESTATION SCÉNIQUE & ARTISTIQUE', 105, yPos, { align: 'center' });

  // 4. Préambule
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ENTRE LES SOUSSIGNÉS :', 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  const preambule1 = doc.splitTextToSize(
    `1. D'une part, l'organisme "${assocName}" (${assocStructure}), SIRET/RNA N° ${assocSiret}, dont le siège social est situé à ${assocAdresse}, ci-après dénommé "Le Prestataire".`,
    170
  );
  doc.text(preambule1, 20, yPos);
  yPos += preambule1.length * 4.5 + 3;

  const preambule2 = doc.splitTextToSize(
    `2. D'autre part, la structure "${clientNom}", représentée par son responsable habilité, ci-après dénommée "L'Organisateur".`,
    170
  );
  doc.text(preambule2, 20, yPos);
  yPos += preambule2.length * 4.5 + 6;

  // 5. Articles du Contrat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 42, 26);
  doc.text('ARTICLE 1 : OBJET DE LA PRESTATION', 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const art1Text = doc.splitTextToSize(
    `Le Prestataire s'engage à assurer la prestation artistique intitulée "${eventName}" prévue le ${eventDate} à l'adresse suivante : ${clientAdresse}.`,
    170
  );
  doc.text(art1Text, 20, yPos);
  yPos += art1Text.length * 4.5 + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 42, 26);
  doc.text('ARTICLE 2 : CONDITIONS FINANCIÈRES & RÈGLEMENT', 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const art2Text = doc.splitTextToSize(
    `En contrepartie de la prestation fournie, L'Organisateur s'engage à verser au Prestataire le montant total convenu de ${formatMoney(amount)} Net (Exonération de TVA pour les organismes à but non lucratif). Le règlement s'effectuera par virement bancaire ou chèque à réception de la facture.`,
    170
  );
  doc.text(art2Text, 20, yPos);
  yPos += art2Text.length * 4.5 + 6;

  // 6. Article 3 : Clause Spécifique / Consignes Logistiques (Injectée dynamiquement si présente)
  if (clauseSpecifique) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(139, 42, 26);
    doc.text('ARTICLE 3 : CLAUSE SPÉCIFIQUE & CONSIGNES PARTICULIÈRES', 20, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const clauseLines = doc.splitTextToSize(clauseSpecifique, 170);
    doc.text(clauseLines, 20, yPos);
    yPos += clauseLines.length * 4.5 + 6;
  }

  // 7. Zone de Signatures
  let sigY = Math.max(yPos + 8, 215);
  if (sigY + 45 > 280) {
    doc.addPage();
    sigY = 25;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Fait à __________________________, le __________________________ en deux exemplaires originaux.', 20, sigY);

  sigY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 23, 22);

  // Cadre Signature Prestataire
  doc.rect(20, sigY, 80, 36);
  doc.text(`Pour Le Prestataire : ${assocName}`, 23, sigY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Mention "Lu et approuvé - Bon pour accord"', 23, sigY + 11);

  // Incrustation de la signature numérisée du Président ou Trésorier dans le cadre Prestataire
  const activeSignatureBase64 = presidentSigBase64 || tresorierSigBase64;
  if (activeSignatureBase64) {
    try {
      doc.addImage(activeSignatureBase64, 'PNG', 23, sigY + 14, 38, 18);
    } catch (e) {
      console.warn("generateContractPDF - Impossible d'insérer l'image de la signature :", e);
      doc.text('Signature & Cachet :', 23, sigY + 18);
    }
  } else {
    doc.text('Signature & Cachet :', 23, sigY + 18);
  }

  // Cadre Signature Organisateur
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.rect(110, sigY, 80, 36);
  doc.text(`Pour L'Organisateur : ${clientNom}`, 113, sigY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Mention "Lu et approuvé - Bon pour accord"', 113, sigY + 11);
  doc.text('Signature & Cachet :', 113, sigY + 18);

  // Pied de page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Document légal généré par ${assocName} - ${assocStructure} - SIRET/RNA : ${assocSiret}`,
    105,
    285,
    { align: 'center' }
  );

  return doc;
}

/**
 * Déclenche le téléchargement direct du Contrat PDF généré avec signatures numérisées
 */
export async function downloadContractPDF(gigData, associationSettings = {}) {
  const doc = await generateContractPDF(gigData, associationSettings);
  const filename = `Contrat_${(gigData.eventName || 'prestation').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
