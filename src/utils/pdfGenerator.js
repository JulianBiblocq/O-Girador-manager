import { jsPDF } from 'jspdf';

const formatTimestamp = (ts) => {
  if (!ts) return "date inconnue";
  let date;
  if (typeof ts.toDate === 'function') {
    date = ts.toDate();
  } else if (ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    date = new Date(ts);
  }
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const generateImageCharterPDF = (member, associationInfo) => {
  const doc = new jsPDF();
  const isSettingsObj = typeof associationInfo === 'object' && associationInfo !== null;
  const assocName = (isSettingsObj ? associationInfo.nom : associationInfo) || "O Girador";
  const assocAdresse = isSettingsObj ? (associationInfo.adresseSiegeSocial || associationInfo.adresse || "") : "";
  
  // Titre du document
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHARTE DE DROIT À L'IMAGE", 105, 30, { align: "center" });
  
  // Sous-titre
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Document officiel de l'association : ${assocName}`, 105, 39, { align: "center" });
  
  if (assocAdresse.trim()) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Siège social : ${assocAdresse.trim()}`, 105, 45, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  // Ligne horizontale de séparation
  doc.setDrawColor(180, 180, 180);
  doc.line(20, 48, 190, 48);
  
  // Informations du membre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BÉNÉFICIAIRE DU CONSENTEMENT :", 20, 62);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom : ${member.nom || ""}`, 25, 72);
  doc.text(`Prénom : ${member.prenom || ""}`, 25, 80);
  doc.text(`Adresse email : ${member.email || ""}`, 25, 88);
  
  // Ligne de séparation
  doc.line(20, 97, 190, 97);
  
  // Titre du corps du texte
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Autorisation d'exploitation de l'image", 20, 110);
  
  // Contenu du texte
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(
    `Je soussigné(e) ${member.prenom || ""} ${member.nom || ""}, membre de l'association "${assocName}", déclare autoriser expressément et à titre gratuit l'association à fixer, reproduire, diffuser et exploiter mon image dans le cadre de ses activités de communication, de promotion et d'archivage (notamment sur son site internet, ses réseaux sociaux, ses newsletters et tout autre support imprimé ou numérique).\n\nCette autorisation est accordée sans contrepartie financière, pour le monde entier et pour toute la durée de mon adhésion à l'association.`,
    170
  );
  doc.text(textLines, 20, 120);
  
  // Encadré de signature électronique
  const signatureY = 175;
  doc.setDrawColor(24, 23, 22);
  doc.setFillColor(248, 248, 247);
  doc.rect(20, signatureY, 170, 38, "FD");
  
  // En-tête de l'encadré de signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VALIDATION ET SIGNATURE ÉLECTRONIQUE", 25, signatureY + 8);
  
  // Contenu de l'encadré de signature
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const sigDate = formatTimestamp(member.dateSignatureDroitImage);
  const sigText = doc.splitTextToSize(
    `Consentement recueilli et validé électroniquement par l'utilisateur le ${sigDate} depuis son espace personnel ${assocName}.`,
    160
  );
  doc.text(sigText, 25, signatureY + 18);
  
  // Pied de page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document généré par l'application ${assocName} Manager`, 105, 275, { align: "center" });
  
  doc.save(`Charte_Image_${member.prenom || 'Membre'}_${member.nom || ''}.pdf`);
};

export const generateMedicalAttestationPDF = (member, associationInfo) => {
  const doc = new jsPDF();
  const isSettingsObj = typeof associationInfo === 'object' && associationInfo !== null;
  const assocName = (isSettingsObj ? associationInfo.nom : associationInfo) || "O Girador";
  const assocAdresse = isSettingsObj ? (associationInfo.adresseSiegeSocial || associationInfo.adresse || "") : "";
  
  // Titre du document
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATTESTATION D'APTITUDE MÉDICALE", 105, 30, { align: "center" });
  
  // Sous-titre
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Document officiel de l'association : ${assocName}`, 105, 39, { align: "center" });

  if (assocAdresse.trim()) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Siège social : ${assocAdresse.trim()}`, 105, 45, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }
  
  // Ligne horizontale de séparation
  doc.setDrawColor(180, 180, 180);
  doc.line(20, 48, 190, 48);
  
  // Informations du membre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DÉCLARANT :", 20, 62);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom : ${member.nom || ""}`, 25, 72);
  doc.text(`Prénom : ${member.prenom || ""}`, 25, 80);
  doc.text(`Adresse email : ${member.email || ""}`, 25, 88);
  
  // Ligne de séparation
  doc.line(20, 97, 190, 97);
  
  // Titre du corps du texte
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Attestation sur l'honneur d'absence de contre-indication médicale", 20, 110);
  
  // Contenu du texte
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(
    `Je soussigné(e) ${member.prenom || ""} ${member.nom || ""}, membre de l'association "${assocName}", atteste sur l'honneur n'avoir aucune contre-indication médicale à la pratique des activités physiques, artistiques et culturelles proposées par l'association, notamment les percussions (Maracatu) et la danse.\n\nJe m'engage à informer l'association de tout changement concernant mon état de santé qui pourrait impacter ma pratique de ces activités physiques.`,
    170
  );
  doc.text(textLines, 20, 120);
  
  // Encadré de signature électronique
  const signatureY = 175;
  doc.setDrawColor(24, 23, 22);
  doc.setFillColor(248, 248, 247);
  doc.rect(20, signatureY, 170, 38, "FD");
  
  // En-tête de l'encadré de signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VALIDATION ET SIGNATURE ÉLECTRONIQUE", 25, signatureY + 8);
  
  // Contenu de l'encadré de signature
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const sigDate = formatTimestamp(member.dateSignatureAttestationSante);
  const sigText = doc.splitTextToSize(
    `Consentement recueilli et validé électroniquement par l'utilisateur le ${sigDate} depuis son espace personnel ${assocName}.`,
    160
  );
  doc.text(sigText, 25, signatureY + 18);
  
  // Pied de page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document généré par l'application ${assocName} Manager`, 105, 275, { align: "center" });
  
  doc.save(`Attestation_Sante_${member.prenom || 'Membre'}_${member.nom || ''}.pdf`);
};

/**
 * Génère le PDF officiel du compte-rendu de réunion pour le Varal et l'archivage.
 *
 * @param {Object} event Événement / Réunion concerné(e)
 * @param {Array} points Liste des points d'ordre du jour et leurs notes
 * @param {Array} presents Liste des membres présents
 * @param {string|Object} associationInfo Nom ou paramètres complets de l'association
 * @returns {jsPDF} Document jsPDF généré
 */
export const generateCompteRenduPDF = (event, points = [], presents = [], associationInfo = "O Girador") => {
  const doc = new jsPDF();

  const isSettingsObj = typeof associationInfo === 'object' && associationInfo !== null;
  const assocName = (isSettingsObj ? associationInfo.nom : associationInfo) || "O Girador";
  const bureauMembres = isSettingsObj && Array.isArray(associationInfo.bureauMembres) ? associationInfo.bureauMembres : [];
  const directionArtistique = isSettingsObj && Array.isArray(associationInfo.directionArtistique) ? associationInfo.directionArtistique : [];
  const afficherMestriaPV = isSettingsObj ? Boolean(associationInfo.afficherMestriaPV) : false;
  
  // Titre du document
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("COMPTE-RENDU OFFICIEL DE RÉUNION", 105, 25, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Association : ${assocName}`, 105, 33, { align: "center" });

  doc.setDrawColor(139, 42, 26);
  doc.setLineWidth(1);
  doc.line(20, 38, 190, 38);

  // Méta-informations de l'événement
  let yPos = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Événement :", 20, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(`${event.titre || "Réunion"}`, 55, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Date & Heure :", 20, yPos);
  doc.setFont("helvetica", "normal");
  const eventDate = event.date ? new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Non spécifiée";
  doc.text(`${eventDate}`, 55, yPos);

  // Injections dynamiques : Membres du Bureau Officiel
  if (bureauMembres.length > 0) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Bureau Officiel :", 20, yPos);
    doc.setFont("helvetica", "normal");
    const bureauText = bureauMembres
      .filter(m => m.nom || m.role)
      .map(m => `${m.role ? m.role + ' : ' : ''}${m.nom || ''}`.trim())
      .join(' | ');
    const bureauLines = doc.splitTextToSize(bureauText || "Non renseigné", 135);
    doc.text(bureauLines, 55, yPos);
    yPos += ((bureauLines.length - 1) * 5);
  }

  // Injections dynamiques : Direction Artistique (si cochée)
  if (afficherMestriaPV && directionArtistique.length > 0) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Direction Artistique :", 20, yPos);
    doc.setFont("helvetica", "normal");
    const mestriaText = directionArtistique
      .filter(m => m.nom || m.role)
      .map(m => `${m.role ? m.role + ' : ' : ''}${m.nom || ''}`.trim())
      .join(' | ');
    const mestriaLines = doc.splitTextToSize(mestriaText || "Non renseignée", 55 ? 135 : 135);
    doc.text(mestriaLines, 55, yPos);
    yPos += ((mestriaLines.length - 1) * 5);
  }

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Membres présents :", 20, yPos);
  doc.setFont("helvetica", "normal");
  const presentsText = (presents && presents.length > 0)
    ? (typeof presents[0] === 'string' ? presents.join(', ') : presents.map(p => p.userName || `${p.prenom || ''} ${p.nom || ''}`.trim()).join(', '))
    : "Aucun présent enregistré";
  const presentsLines = doc.splitTextToSize(presentsText, 135);
  doc.text(presentsLines, 55, yPos);

  yPos += (presentsLines.length * 6) + 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  // Entête des points
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("ORDRE DU JOUR & NOTES DE SÉANCE", 20, yPos);
  yPos += 8;

  if (!points || points.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Aucun point consigné dans ce compte-rendu.", 20, yPos);
  } else {
    points.forEach((pt, idx) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      const pointTitre = typeof pt === 'string' ? pt : (pt.titre || `Point ${idx + 1}`);
      const pointNotes = typeof pt === 'object' && pt.notesCR ? pt.notesCR : "Aucune note rédigée.";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${pointTitre}`, 20, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const notesLines = doc.splitTextToSize(pointNotes, 165);
      doc.text(notesLines, 25, yPos);
      yPos += (notesLines.length * 5) + 6;
    });
  }

  // Signature & bas de page
  if (yPos > 240) {
    doc.addPage();
    yPos = 30;
  }

  doc.setDrawColor(45, 106, 79);
  doc.setFillColor(240, 248, 244);
  doc.rect(20, yPos, 170, 25, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(45, 106, 79);
  doc.text("STATUT DU COMPTE-RENDU : VALIDÉ & ARCHIVÉ AU VARAL", 25, yPos + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text("Document validé par les membres présents et archivé automatiquement sous la catégorie Comptes-rendus.", 25, yPos + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document officiel généré par ${assocName} Manager le ${new Date().toLocaleDateString('fr-FR')}`, 105, 285, { align: "center" });

  return doc;
};
