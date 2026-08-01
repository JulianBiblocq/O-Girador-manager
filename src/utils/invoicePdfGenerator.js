import { jsPDF } from 'jspdf';
import { loadImageAsBase64 } from './contractPdfGenerator';

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
 * Génère le document PDF (Devis ou Facture) avec incrustation de la signature numérisée.
 *
 * @param {Object} invoice Objet Devis / Facture contenant les lignes et infos clients
 * @param {Object} associationSettings Paramètres globaux de l'association (Firestore)
 * @returns {Promise<jsPDF>} Document jsPDF généré
 */
export async function generateInvoicePDF(invoice = {}, associationSettings = {}) {
  const doc = new jsPDF();

  const isDevis = invoice.type === 'devis';
  const docTypeLabel = isDevis ? 'DEVIS' : 'FACTURE';
  const assocName = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const assocStructure = associationSettings.structureJuridique || 'Association Loi 1901';
  const assocAdresse = associationSettings.adresseSiegeSocial || associationSettings.adresse || associationSettings.publicContactAddress || '';
  const assocEmail = associationSettings.email || associationSettings.emailOfficiel || associationSettings.publicContactEmail || '';
  const assocPhone = associationSettings.telephone || associationSettings.publicContactPhone || '';
  const assocSiret = associationSettings.siret || associationSettings.rna || '';
  const assocRib = associationSettings.ribIban || associationSettings.iban || '';
  const assocMentionTVA = associationSettings.mentionTVA || 'TVA non applicable, art. 261-7-1° du CGI';

  const signatureTresorierUrl = associationSettings.signatureTresorierUrl || '';
  const signaturePresidentUrl = associationSettings.signaturePresidentUrl || '';

  // Chargement asynchrone de la signature numérisée
  const tresorierSigBase64 = signatureTresorierUrl ? await loadImageAsBase64(signatureTresorierUrl) : null;
  const presidentSigBase64 = signaturePresidentUrl ? await loadImageAsBase64(signaturePresidentUrl) : null;
  const activeSignatureBase64 = tresorierSigBase64 || presidentSigBase64;

  const client = invoice.client || {};
  const lignes = Array.isArray(invoice.lignes) ? invoice.lignes : [];

  let yPos = 20;

  // Header : Logo & Informations Association (Gauche)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(139, 42, 26); // Cordel red / wood
  doc.text(assocName.toUpperCase(), 20, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(assocStructure, 20, yPos);

  yPos += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  if (assocAdresse) {
    const addrLines = doc.splitTextToSize(assocAdresse, 80);
    doc.text(addrLines, 20, yPos);
    yPos += addrLines.length * 4.2;
  }

  if (assocSiret) {
    doc.text(`SIRET / RNA : ${assocSiret}`, 20, yPos);
    yPos += 4.2;
  }

  if (assocEmail) {
    doc.text(`Email : ${assocEmail}`, 20, yPos);
    yPos += 4.2;
  }

  if (assocPhone) {
    doc.text(`Tél : ${assocPhone}`, 20, yPos);
    yPos += 4.2;
  }

  // Header : Cartouche Document & Numéro (Droite)
  let headerRightY = 20;
  const headerRightX = 120;

  doc.setFillColor(248, 246, 240);
  doc.setDrawColor(200, 190, 175);
  doc.rect(headerRightX - 5, headerRightY, 75, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(139, 42, 26);
  doc.text(docTypeLabel, headerRightX, headerRightY + 9);

  doc.setFontSize(10);
  doc.setTextColor(24, 23, 22);
  doc.text(`N° ${invoice.numero || '0001'}`, headerRightX, headerRightY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date d'émission : ${invoice.dateEmission || new Date().toLocaleDateString('fr-FR')}`, headerRightX, headerRightY + 22);

  yPos = Math.max(yPos + 5, 58);

  // Bloc Client (Destinataire)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.rect(115, yPos, 75, 30, 'F');
  doc.setDrawColor(139, 42, 26);
  doc.setLineWidth(0.5);
  doc.line(115, yPos, 115, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(139, 42, 26);
  doc.text('DESTINATAIRE :', 120, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 23, 22);
  doc.text(client.nom || 'Client non spécifié', 120, yPos + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  let cY = yPos + 17;
  if (client.adresse) {
    const cAddr = doc.splitTextToSize(client.adresse, 68);
    doc.text(cAddr, 120, cY);
    cY += cAddr.length * 3.8;
  }
  if (client.email) {
    doc.text(`Email : ${client.email}`, 120, cY);
  }

  yPos += 36;

  // Tableau des Lignes de Facturation / Devis
  doc.setLineWidth(0.2);

  const startTableY = yPos;
  doc.setFillColor(45, 106, 79); // Vert Cordel
  doc.rect(20, startTableY, 170, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  doc.text('DESCRIPTION / PRESTATION', 23, startTableY + 5);
  doc.text('QTÉ', 135, startTableY + 5, { align: 'right' });
  doc.text('P.U. NET', 160, startTableY + 5, { align: 'right' });
  doc.text('TOTAL', 187, startTableY + 5, { align: 'right' });

  yPos = startTableY + 7;

  let totalTTC = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);

  lignes.forEach((item, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    const qty = parseFloat(item.quantite) || 1;
    const pu = parseFloat(item.prixUnitaire) || 0;
    const lineTotal = qty * pu;
    totalTTC += lineTotal;

    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 246);
      doc.rect(20, yPos, 170, 7, 'F');
    }

    const descLines = doc.splitTextToSize(item.description || 'Prestation', 105);
    doc.text(descLines, 23, yPos + 5);

    doc.text(qty.toString(), 135, yPos + 5, { align: 'right' });
    doc.text(formatMoney(pu), 160, yPos + 5, { align: 'right' });
    doc.text(formatMoney(lineTotal), 187, yPos + 5, { align: 'right' });

    yPos += Math.max(7, descLines.length * 4.5);
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);

  // Bloc Totaux & Net à Payer
  let totalY = yPos + 6;
  doc.setFillColor(248, 246, 240);
  doc.setDrawColor(200, 190, 175);
  doc.rect(120, totalY, 70, 16, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 23, 22);
  doc.text('TOTAL NET À PAYER :', 123, totalY + 10);
  doc.setTextColor(45, 106, 79);
  doc.text(formatMoney(totalTTC), 187, totalY + 10, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(assocMentionTVA, 20, totalY + 4);
  doc.text(`(${assocStructure})`, 20, totalY + 8);

  yPos = totalY + 20;

  // Conditions de Règlement & Coordonnées Bancaires
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 251, 248);
  doc.rect(20, yPos, 170, 28, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 23, 22);
  doc.text('CONDITIONS DE RÈGLEMENT & COORDONNÉES BANCAIRES :', 25, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);

  if (assocRib) {
    doc.text(`RIB / IBAN : ${assocRib}`, 25, yPos + 13);
  } else {
    doc.text(`Règlement par virement bancaire ou chèque à l'ordre de "${assocName}".`, 25, yPos + 13);
  }

  if (invoice.notes) {
    const notesLines = doc.splitTextToSize(`Note : ${invoice.notes}`, 160);
    doc.text(notesLines, 25, yPos + 19);
  } else {
    doc.text('Paiement à réception de facture. Aucun escompte accordé pour paiement anticipé.', 25, yPos + 19);
  }

  // Signature du Prestataire / Émetteur sur Devis & Facture
  let sigBoxY = yPos + 32;
  if (sigBoxY + 30 > 275) {
    doc.addPage();
    sigBoxY = 20;
  }

  // Zone "Pour l'Émetteur" (Gauche) avec Signature Numérisée
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(255, 255, 255);
  doc.rect(20, sigBoxY, 80, 28, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 23, 22);
  doc.text(`POUR L'ÉMETTEUR : ${assocName}`, 23, sigBoxY + 6);

  if (activeSignatureBase64) {
    try {
      doc.addImage(activeSignatureBase64, 'PNG', 23, sigBoxY + 8, 35, 18);
    } catch (e) {
      console.warn("generateInvoicePDF - Erreur insertion signature :", e);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text('Signature & Cachet Officiel', 23, sigBoxY + 16);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Cachet Officiel', 23, sigBoxY + 16);
  }

  // Zone "Bon pour accord" spécifique aux Devis (Droite)
  if (isDevis) {
    doc.rect(115, sigBoxY, 75, 28, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 23, 22);
    doc.text('BON POUR ACCORD (CLIENT)', 120, sigBoxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Date :', 120, sigBoxY + 13);
    doc.text('Signature & Cachet du client :', 120, sigBoxY + 20);
  }

  // Pied de page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Document édité par ${assocName} - ${assocStructure} - SIRET/RNA : ${assocSiret || 'N/A'}`,
    105,
    285,
    { align: 'center' }
  );

  return doc;
}

/**
 * Déclenche le téléchargement du PDF Devis / Facture généré avec signature numérisée
 */
export async function downloadInvoicePDF(invoice, associationSettings = {}) {
  const doc = await generateInvoicePDF(invoice, associationSettings);
  const filename = `${invoice.numero || invoice.type || 'document'}_${(invoice.client?.nom || 'client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
