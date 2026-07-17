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

export const generateImageCharterPDF = (member, associationName) => {
  const doc = new jsPDF();
  const assocName = associationName || "O Girador";
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHARTE DE DROIT À L'IMAGE", 105, 30, { align: "center" });
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Document officiel de l'association : ${assocName}`, 105, 40, { align: "center" });
  
  // Horizontal line
  doc.setDrawColor(180, 180, 180);
  doc.line(20, 45, 190, 45);
  
  // Member Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BÉNÉFICIAIRE DU CONSENTEMENT :", 20, 60);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom : ${member.nom || ""}`, 25, 70);
  doc.text(`Prénom : ${member.prenom || ""}`, 25, 78);
  doc.text(`Adresse email : ${member.email || ""}`, 25, 86);
  
  // Separator
  doc.line(20, 95, 190, 95);
  
  // Body Text Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Autorisation d'exploitation de l'image", 20, 108);
  
  // Body Text Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(
    `Je soussigné(e) ${member.prenom || ""} ${member.nom || ""}, membre de l'association "${assocName}", déclare autoriser expressément et à titre gratuit l'association à fixer, reproduire, diffuser et exploiter mon image dans le cadre de ses activités de communication, de promotion et d'archivage (notamment sur son site internet, ses réseaux sociaux, ses newsletters et tout autre support imprimé ou numérique).\n\nCette autorisation est accordée sans contrepartie financière, pour le monde entier et pour toute la durée de mon adhésion à l'association.`,
    170
  );
  doc.text(textLines, 20, 118);
  
  // Electronic Signature box
  const signatureY = 175;
  doc.setDrawColor(24, 23, 22);
  doc.setFillColor(248, 248, 247);
  doc.rect(20, signatureY, 170, 38, "FD");
  
  // Signature Box Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VALIDATION ET SIGNATURE ÉLECTRONIQUE", 25, signatureY + 8);
  
  // Signature Box Content
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const sigDate = formatTimestamp(member.dateSignatureDroitImage);
  const sigText = doc.splitTextToSize(
    `Consentement recueilli et validé électroniquement par l'utilisateur le ${sigDate} depuis son espace personnel ${assocName}.`,
    160
  );
  doc.text(sigText, 25, signatureY + 18);
  
  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document généré par l'application ${assocName} Manager`, 105, 275, { align: "center" });
  
  doc.save(`Charte_Image_${member.prenom}_${member.nom}.pdf`);
};

export const generateMedicalAttestationPDF = (member, associationName) => {
  const doc = new jsPDF();
  const assocName = associationName || "O Girador";
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATTESTATION D'APTITUDE MÉDICALE", 105, 30, { align: "center" });
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Document officiel de l'association : ${assocName}`, 105, 40, { align: "center" });
  
  // Horizontal line
  doc.setDrawColor(180, 180, 180);
  doc.line(20, 45, 190, 45);
  
  // Member Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DÉCLARANT :", 20, 60);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nom : ${member.nom || ""}`, 25, 70);
  doc.text(`Prénom : ${member.prenom || ""}`, 25, 78);
  doc.text(`Adresse email : ${member.email || ""}`, 25, 86);
  
  // Separator
  doc.line(20, 95, 190, 95);
  
  // Body Text Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Attestation sur l'honneur d'absence de contre-indication médicale", 20, 108);
  
  // Body Text Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(
    `Je soussigné(e) ${member.prenom || ""} ${member.nom || ""}, membre de l'association "${assocName}", atteste sur l'honneur n'avoir aucune contre-indication médicale à la pratique des activités physiques, artistiques et culturelles proposées par l'association, notamment les percussions (Maracatu) et la danse.\n\nJe m'engage à informer l'association de tout changement concernant mon état de santé qui pourrait impacter ma pratique de ces activités physiques.`,
    170
  );
  doc.text(textLines, 20, 118);
  
  // Electronic Signature box
  const signatureY = 175;
  doc.setDrawColor(24, 23, 22);
  doc.setFillColor(248, 248, 247);
  doc.rect(20, signatureY, 170, 38, "FD");
  
  // Signature Box Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("VALIDATION ET SIGNATURE ÉLECTRONIQUE", 25, signatureY + 8);
  
  // Signature Box Content
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  const sigDate = formatTimestamp(member.dateSignatureAttestationSante);
  const sigText = doc.splitTextToSize(
    `Consentement recueilli et validé électroniquement par l'utilisateur le ${sigDate} depuis son espace personnel ${assocName}.`,
    160
  );
  doc.text(sigText, 25, signatureY + 18);
  
  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document généré par l'application ${assocName} Manager`, 105, 275, { align: "center" });
  
  doc.save(`Attestation_Sante_${member.prenom}_${member.nom}.pdf`);
};
