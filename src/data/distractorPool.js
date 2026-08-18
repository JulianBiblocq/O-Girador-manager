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
  ],
  localPlaces: ['Recife', 'Olinda', 'São José', 'Peixinhos', 'Igarassu', 'Nazareth', 'Pernambouc'],
  fallbackFailsTraductions: ['Tambour', 'Baguette', 'Danse', 'Couronne', 'Costume traditionnel', 'Instrument de percussion'],
  orixasNames: ['Oxum', 'Iansã', 'Xangô', 'Ogum', 'Oxóssi', 'Iemanjá', 'Nanã', 'Obaluaiê', 'Exu', 'Oxalá'],
  orixasTitles: ['Le seigneur du feu et du tonnerre', 'Le guerrier de la paix', 'La reine de la mer', 'L\'enfant divin'],
  orixasTools: ['Miroir et éventail', 'Arc et flèche', 'Épée de fer', 'Hache double (Oxê)', 'Balai de paille (Íroko)', 'Lance de combat', 'Poignard et bouclier'],
  danseGestes: ['Giro (Tour)', 'Passo de Índio', 'Balanço', 'Avancée', 'Saut', 'Marche croisée', 'Ondes des bras'],
  elementsNaturels: ['Feu', 'Terre', 'Eaux douces', 'Océan', 'Air et Tempêtes', 'Forêt', 'Fer / Forge', 'Boue'],
  villesCortejo: ['Recife', 'Olinda', 'Nazaré da Mata', 'Salvador', 'Rio de Janeiro', 'Fortaleza'],
  rolesCortejo: ['Le Roi', 'La Reine', 'Le Porte-Étendard', 'Batuqueiro', 'Caboclo de Lança', 'La Dame de Palais', 'Dama do Paço', 'Baiana'],
  regionsCuisineStyle: ['Bahia', 'Pernambouc', 'Minas Gerais', 'Rio de Janeiro', 'Amazonie', 'São Paulo'],
  epoquesCuisine: ['Époque coloniale', 'XIXe siècle', 'Période pré-colombienne', 'XXe siècle', 'Antiquité'],
  ingredientsCuisine: ['Haricots noirs', 'Farine de manioc', 'Huile de palme (Dendê)', 'Lait de coco', 'Maïs', 'Piment'],
  figuresMusique: ['Chico Science', 'Lia de Itamaracá', 'Mestre Salustiano', 'Luiz Gonzaga', 'Naná Vasconcelos', 'Pixinguinha'],
  epoquesMusique: ['Années 1990', 'Début du XXe siècle', 'Époque coloniale', 'Années 1950', 'XIXe siècle'],
  regionsTerritoire: ['Nordeste', 'Sudeste', 'Amazonie', 'Centre-Ouest', 'Sud', 'Pernambouc'],
  epoquesTerritoire: ["Cycle de l'or", 'Cycle du sucre', 'Cycle du café', 'Époque contemporaine', 'Période pré-coloniale'],
  populationsTerritoire: ['Sertanejo', 'Cangaceiro', 'Ribeirinho', 'Quilombola', 'Indigène'],
  biomesTerritoire: ['Caatinga', 'Sertão', 'Mangrove', 'Agreste', 'Cerrado', 'Forêt Atlantique'],
  defaultOthersSongs: ['Maracatu Nação', 'Caboclinho', 'Ciranda', 'Coco', 'Afoxé'],
  fallbacksDanseNoms: ['Maculelê', 'Ginga', 'Passo de Índio', 'Giro', 'Balanço'],
  fallbackDanseFamilles: ['Guerrier', 'Base', 'Aérien', 'Tournant', 'Marche']
};
