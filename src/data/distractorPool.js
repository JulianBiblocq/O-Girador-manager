/**
 * Dictionnaire statique de leurres (distracteurs) pour les QCM.
 * Utilisé comme solution de repli (fallback) ou pour le mode Découverte
 * lorsque la base de données ne contient pas assez d'éléments.
 */

export const distractorPool = {
  genresMusicauxHorsMaracatu: [
    "Samba-Reggae",
    "Frevo",
    "Forró",
    "Afoxé",
    "Samba de Roda",
    "Carimbó",
    "Bossa Nova",
    "Baião"
  ],
  baquesFictifsEtSimilaires: [
    "Baque Sol",
    "Baque Estrela",
    "Baque de Caboclo",
    "Baque Trovão",
    "Baque de Ouro"
  ],
  villesEtGeographie: [
    "Salvador",
    "Rio de Janeiro",
    "Brasília",
    "São Paulo",
    "Olinda",
    "Fortaleza",
    "Recife",
    "São Luís"
  ],
  materiauxEtLutherie: [
    "Archet de violon",
    "Anche de sax",
    "Corde de guitare",
    "Accordéon",
    "Triangle",
    "Peau Mylar synthétique"
  ],
  lexiqueSpecialise: [
    { pt: "Ilú", fr: "Tambour sacré cylindrique", categorie: "instruments" },
    { pt: "Rum, Rumpi, Lé", fr: "Trio de tambours rituels du Candomblé", categorie: "candomble" },
    { pt: "Babalorixá", fr: "Prêtre du Candomblé (Pai de Santo)", categorie: "candomble" },
    { pt: "Iyalorixá", fr: "Prêtresse du Candomblé (Mãe de Santo)", categorie: "candomble" },
    { pt: "Oxê", fr: "Hache double de Xangô", categorie: "candomble" },
    { pt: "Abebê", fr: "Miroir sacré d'Oxum et Yemanjá", categorie: "candomble" },
    { pt: "Agô !", fr: "Demande de permission rituelle", categorie: "candomble" },
    { pt: "Vixe !", fr: "Oula ! / Punaise !", categorie: "nordeste" },
    { pt: "Oxente !", fr: "Bah alors ! / Comment ça ?!", categorie: "nordeste" },
    { pt: "Arretado", fr: "Formidable / Trop fort", categorie: "nordeste" },
    { pt: "Massa !", fr: "Génial / Trop bien !", categorie: "nordeste" },
    { pt: "Baque", fr: "Style rythmique de frappe", categorie: "maracatu" },
    { pt: "Puxador", fr: "Soliste qui entonne le chant", categorie: "maracatu" },
    { pt: "Bacalhau", fr: "Fouet en cuir ou baguette de fût", categorie: "maracatu" },
    { pt: "Calunga", fr: "Poupée sacrée de la Dama do Paço", categorie: "maracatu" }
  ]
};
