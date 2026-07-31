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
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Génère un document PDF officiel de Devis ou Facture pour l'association.
 *
 * @param {Object} invoice Données du devis ou de la facture
 * @param {Object} associationSettings Paramètres globaux de l'association (nom, logo, adresse, siret, rib)
 * @returns {jsPDF} Le document jsPDF généré
 */
export function generateInvoicePDF(invoice, associationSettings = {}) {
  const doc = new jsPDF();

  const isDevis = invoice.type === 'devis';
  const docTypeLabel = isDevis ? 'DEVIS' : 'FACTURE';
  const assocName = associationSettings.nom || associationSettings.associationName || 'O GIRADOR';
  const assocAdresse = associationSettings.adresse || associationSettings.publicContactAddress || '';
  const assocEmail = associationSettings.email || associationSettings.publicContactEmail || '';
  const assocPhone = associationSettings.telephone || associationSettings.publicContactPhone || '';
  const assocSiret = associationSettings.siret || associationSettings.rna || '';
  const assocRib = associationSettings.ribIban || associationSettings.iban || '';

  const client = invoice.client || {};
  const lignes = Array.isArray(invoice.lignes) ? invoice.lignes : [];

  let yPos = 20;

  // Header : Logo & Informations Association (Gauche)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(139, 42, 26); // Cordel red / wood
  doc.text(assocName.toUpperCase(), 20, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  if (assocAdresse) {
    const addrLines = doc.splitTextToSize(assocAdresse, 80);
    doc.text(addrLines, 20, yPos);
    yPos += addrLines.length * 4.5;
  }
  if (assocEmail) {
    doc.text(`Email : ${assocEmail}`, 20, yPos);
    yPos += 4.5;
  }
  if (assocPhone) {
    doc.text(`Tél : ${assocPhone}`, 20, yPos);
    yPos += 4.5;
  }
  if (assocSiret) {
    doc.text(`SIRET / RNA : ${assocSiret}`, 20, yPos);
    yPos += 4.5;
  }

  // Header Droite : Bloc Destinataire / Client
  let clientYPos = 20;
  const clientXPos = 115;

  doc.setFillColor(248, 246, 240);
  doc.setDrawColor(200, 190, 175);
  doc.rect(clientXPos - 5, clientYPos, 80, 42, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(24, 23, 22);
  doc.text('DESTINATAIRE :', clientXPos, clientYPos + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(client.nom || 'Client inconnu', clientXPos, clientYPos + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);

  let cOffset = 22;
  if (client.adresse) {
    const clientAddrLines = doc.splitTextToSize(client.adresse, 70);
    doc.text(clientAddrLines, clientXPos, clientYPos + cOffset);
    cOffset += clientAddrLines.length * 4.5;
  }
  if (client.siret) {
    doc.text(`SIRET : ${client.siret}`, clientXPos, clientYPos + cOffset);
    cOffset += 4.5;
  }
  if (client.email) {
    doc.text(`Email : ${client.email}`, clientXPos, clientYPos + cOffset);
  }

  // Titre du Document (Devis N°... / Facture N°...)
  yPos = Math.max(yPos + 10, 70);

  doc.setDrawColor(139, 42, 26);
  doc.setLineWidth(1);
  doc.line(20, yPos, 190, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 23, 22);
  doc.text(`${docTypeLabel} N° ${invoice.numero || 'BROUILLON'}`, 20, yPos);

  // Méta-données (Date émission, Date échéance, Statut)
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  const dateEmisionStr = formatDate(invoice.dateEmission);
  const dateEcheanceStr = formatDate(invoice.dateEcheance);

  let metaText = `Date d'émission : ${dateEmisionStr}`;
  if (dateEcheanceStr) {
    metaText += `   |   Date d'échéance : ${dateEcheanceStr}`;
  }
  doc.text(metaText, 20, yPos);

  yPos += 12;

  // Tableau des prestations / Lignes de facturation
  // Entête du tableau
  doc.setFillColor(45, 106, 79); // Cordel Green / Vert Validation
  doc.rect(20, yPos, 170, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION DE LA PRESTATION', 25, yPos + 5.5);
  doc.text('QTÉ', 125, yPos + 5.5, { align: 'center' });
  doc.text('PRIX UNIT. HT', 155, yPos + 5.5, { align: 'right' });
  doc.text('TOTAL HT', 185, yPos + 5.5, { align: 'right' });

  yPos += 8;

  // Contenu des lignes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  lignes.forEach((item, index) => {
    // Vérification de changement de page si le tableau est long
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
      // Réaffichage entête tableau sur la nouvelle page
      doc.setFillColor(45, 106, 79);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('DESCRIPTION DE LA PRESTATION', 25, yPos + 5.5);
      doc.text('QTÉ', 125, yPos + 5.5, { align: 'center' });
      doc.text('PRIX UNIT. HT', 155, yPos + 5.5, { align: 'right' });
      doc.text('TOTAL HT', 185, yPos + 5.5, { align: 'right' });
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
    }

    // Fond alterné pour lisibilité
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 247);
      doc.rect(20, yPos, 170, 8, 'F');
    }

    const descLines = doc.splitTextToSize(item.description || 'Prestation', 95);
    const lineHeight = descLines.length * 4.5;
    const rowHeight = Math.max(8, lineHeight + 3);

    doc.text(descLines, 25, yPos + 5);
    doc.text((item.quantite || 1).toString(), 125, yPos + 5, { align: 'center' });
    doc.text(formatMoney(item.prixUnitaire), 155, yPos + 5, { align: 'right' });
    doc.text(formatMoney((item.quantite || 1) * (item.prixUnitaire || 0)), 185, yPos + 5, { align: 'right' });

    yPos += rowHeight;
  });

  // Ligne de fin de tableau
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);

  yPos += 8;

  // Bloc Totalisation (À droite)
  const totalY = yPos;
  const totalX = 120;

  const totalHT = invoice.montantHT || 0;
  const totalTTC = invoice.montantTTC || totalHT;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Total HT :', totalX, totalY);
  doc.text(formatMoney(totalHT), 185, totalY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(139, 42, 26);
  doc.text('Net à payer (TTC) :', totalX, totalY + 8);
  doc.text(formatMoney(totalTTC), 185, totalY + 8, { align: 'right' });

  // Mention Exonération TVA à gauche
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('TVA non applicable, art. 261-7-1° du CGI', 20, totalY + 4);
  doc.text('(Association à but non lucratif)', 20, totalY + 8);

  yPos = totalY + 20;

  // Notes / Mode de Règlement / RIB
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

  // Pied de page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Document édité par ${assocName} - Association Loi 1901 - SIRET/RNA : ${assocSiret || 'N/A'}`,
    105,
    285,
    { align: 'center' }
  );

  return doc;
}

/**
 * Déclenche le téléchargement du PDF généré
 */
export function downloadInvoicePDF(invoice, associationSettings = {}) {
  const doc = generateInvoicePDF(invoice, associationSettings);
  const filename = `${invoice.numero || invoice.type || 'document'}_${(invoice.client?.nom || 'client').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
