import fs from 'fs';

// Traductions PT-BR pour l'intégralité des 255 clés suggérées
const ptTranslationsMap = {
  // --- GENERAL : tabPublicGeneral ---
  "vitrine.admin.general.tabPublicGeneral.statutDePublicationDeLa": "Status de Publicação da Vitrine Pública",
  "vitrine.admin.general.tabPublicGeneral.enLignePublie": "🌐 ONLINE (PUBLICADO)",
  "vitrine.admin.general.tabPublicGeneral.modeBrouillonMasque": "🚧 MODO RASCUNHO (OCULTO)",
  "vitrine.admin.general.tabPublicGeneral.publierLeSiteVitrinePour": "🌍 Publicar a vitrine para o grande público",
  "vitrine.admin.general.tabPublicGeneral.votreSiteVitrineEstActuellement": "Sua vitrine pública está atualmente online e totalmente acessível para visitantes externos e mecanismos de busca.",
  "vitrine.admin.general.tabPublicGeneral.modeBrouillonActifLesVisiteurs": "Modo Rascunho ativo: os visitantes veem uma página de espera \"Em construção\". Apenas membros conectados podem pré-visualizar o site.",
  "vitrine.admin.general.tabPublicGeneral.patientez": "Aguarde...",
  "vitrine.admin.general.tabPublicGeneral.passerEnModeBrouillon": "🔒 Mudar para Modo Rascunho",
  "vitrine.admin.general.tabPublicGeneral.publierLeSiteMaintenant": "🌍 Publicar o Site Agora",
  "vitrine.admin.general.tabPublicGeneral.ouvrirLeSitePublicDans": "Abrir o site público em uma nova aba",
  "vitrine.admin.general.tabPublicGeneral.voirLeSitePublic": "🌍 Ver a vitrine pública ↗",
  "vitrine.admin.general.tabPublicGeneral.nomDeDomainePersonnalise": "🔗 Nome de domínio personalizado",
  "vitrine.admin.general.tabPublicGeneral.siVousPossedezVotrePropre": "Se você possui seu próprio nome de domínio (ex:",
  "vitrine.admin.general.tabPublicGeneral.wwwMonAssociationFr": "www.minha-associacao.com.br",
  "vitrine.admin.general.tabPublicGeneral.vousPouvezLeRenseignerIci": "), você pode informá-lo aqui. Ele servirá como endereço principal para sua vitrine em vez do endereço padrão.",
  "vitrine.admin.general.tabPublicGeneral.domainesPersonnalises": "Domínios personalizados",
  "vitrine.admin.general.tabPublicGeneral.tapezUnDomaineExWww": "Digite um domínio (ex: www.meu-bloco.com.br) e pressione Enter",
  "vitrine.admin.general.tabPublicGeneral.appuyezSur": "Pressione",
  "vitrine.admin.general.tabPublicGeneral.entree": "Enter",
  "vitrine.admin.general.tabPublicGeneral.pourAjouterUnDomaineSaisissez": "para adicionar um domínio. Digite o domínio sem \"http://\" ou \"https://\". Lembre-se de configurar o DNS do seu domínio para apontar para o nosso servidor.",
  "vitrine.admin.general.tabPublicGeneral.coordonneesGeneralesDeContact": "📧 Contatos Gerais da Associação",
  "vitrine.admin.general.tabPublicGeneral.adresseEMailPubliqueDe": "Endereço de e-mail público de contato",
  "vitrine.admin.general.tabPublicGeneral.contactNomAssociationFr": "contato@nome-associacao.com.br",
  "vitrine.admin.general.tabPublicGeneral.numeroDeTelephoneDeContact": "Telefone de contato",
  "vitrine.admin.general.tabPublicGeneral.referencementSeoMetaDonneesGoogle": "🔎 Otimização SEO & Metadados (Google)",
  "vitrine.admin.general.tabPublicGeneral.moteursDeRecherche": "Mecanismos de busca",
  "vitrine.admin.general.tabPublicGeneral.optimisezLeTitreLaDescription": "Otimize o título, a descrição e as palavras-chave da sua vitrine pública para aparecer no topo dos resultados do Google.",
  "vitrine.admin.general.tabPublicGeneral.titreDeLaPageBalise": "Título da página (Tag Meta Title)",
  "vitrine.admin.general.tabPublicGeneral.recommande5060Caracteres": "Recomendado: 50-60 caracteres",
  "vitrine.admin.general.tabPublicGeneral.exGroupeMaracatuPercussionsBresiliennes": "Ex: Grupo de Maracatu & Percussão Brasileira - Nome da Associação",
  "vitrine.admin.general.tabPublicGeneral.descriptionDeLaPageMeta": "Descrição da página (Meta Description)",
  "vitrine.admin.general.tabPublicGeneral.recommande150160Caracteres": "Recomendado: 150-160 caracteres",
  "vitrine.admin.general.tabPublicGeneral.exRetrouvezNosAteliersDe": "Ex: Conheça nossas oficinas de percussão brasileira e dança tradicional de maracatu, próximas apresentações e datas de shows.",
  "vitrine.admin.general.tabPublicGeneral.motsClesSeoSeparesPar": "Palavras-chave SEO (Separadas por vírgulas)",
  "vitrine.admin.general.tabPublicGeneral.exMaracatuBatucadaMusiqueBresilienne": "Ex: maracatu, batucada, música brasileira",
  "vitrine.admin.general.tabPublicGeneral.maracatuPercussionsDanseBresilienneBatucada": "maracatu, percussão, dança brasileira, batucada, cortejo de rua",
  "vitrine.admin.general.tabPublicGeneral.structureJuridiqueMentionsLegales": "⚖️ Estrutura Jurídica (Dados Legais)",

  // --- GENERAL : legalInfoBlock ---
  "vitrine.admin.general.legalInfoBlock.informationsLegalesDevisFacturesVitrine": "📜 Informações Legais (Orçamentos, Faturas & Vitrine)",
  "vitrine.admin.general.legalInfoBlock.cesCoordonneesAdministrativesSImprimeront": "Estes dados administrativos serão impressos automaticamente nos documentos oficiais em PDF e poderão ser exibidos na sua vitrine pública.",
  "vitrine.admin.general.legalInfoBlock.structureJuridique": "Estrutura Jurídica",
  "vitrine.admin.general.legalInfoBlock.exAssociationLoi1901": "ex: Associação Cultural / Sem fins lucrativos",
  "vitrine.admin.general.legalInfoBlock.numeroSiretNRna": "CNPJ / Registro Associativo",
  "vitrine.admin.general.legalInfoBlock.ex84912345600012": "ex: 12.345.678/0001-90",
  "vitrine.admin.general.legalInfoBlock.adresseDeDomiciliationSiegeSocial": "Endereço da Sede Social / Domicílio",
  "vitrine.admin.general.legalInfoBlock.ex12RueDeLa": "ex: Rua das Flores, 123 - Centro",
  "vitrine.admin.general.legalInfoBlock.eMailOfficielDeL": "E-mail Oficial da Associação",
  "vitrine.admin.general.legalInfoBlock.renseigneSurLesDevisPdf": "Informado nos orçamentos em PDF e utilizado para notificações",
  "vitrine.admin.general.legalInfoBlock.exContactVotreAssociationFr": "ex: contato@sua-associacao.com.br",
  "vitrine.admin.general.legalInfoBlock.telephoneOfficielDeLAssociation": "Telefone Oficial da Associação",
  "vitrine.admin.general.legalInfoBlock.ex06123456": "ex: (11) 98765-4321",
  "vitrine.admin.general.legalInfoBlock.clauseSpecifiqueAvertissementContratOptionnel": "📋 Cláusula Específica / Aviso Contratual (Opcional)",
  "vitrine.admin.general.legalInfoBlock.sImprimeEnBasDes": "Impresso no rodapé dos contratos em PDF",
  "vitrine.admin.general.legalInfoBlock.exAvertissementSonoreLesPrestations": "ex: Aviso sonoro: As apresentações possuem volume sonoro elevado.",
  "vitrine.admin.general.legalInfoBlock.signaturesNumeriseesDesRepresentantsImprimees": "✍️ Assinaturas Digitalizadas dos Representantes (Impressas em Orçamentos & Contratos)",
  "vitrine.admin.general.legalInfoBlock.conseilUtilisezUneImageAu": "Dica: Use uma imagem no formato PNG com fundo transparente.",
  "vitrine.admin.general.legalInfoBlock.signatureDuPresidentMestre": "Assinatura do Presidente / Mestre",
  "vitrine.admin.general.legalInfoBlock.signaturePresident": "Assinatura do Presidente",
  "vitrine.admin.general.legalInfoBlock.aucune": "Nenhuma",
  "vitrine.admin.general.legalInfoBlock.selectionne": "✓ Selecionado:",
  "vitrine.admin.general.legalInfoBlock.signatureDuTresorier": "Assinatura do Tesoureiro",
  "vitrine.admin.general.legalInfoBlock.signatureTresorier": "Assinatura do Tesoureiro",

  // --- THEME : tabPublicTheme ---
  "vitrine.admin.theme.tabPublicTheme.cactusTypoCordelOfficielle": "Cactus (Tipografia Cordel Oficial)",
  "vitrine.admin.theme.tabPublicTheme.robotoModernePolyvalente": "Roboto (Moderna & Versátil)",
  "vitrine.admin.theme.tabPublicTheme.montserratGeometriqueEpuree": "Montserrat (Geométrica & Elegante)",
  "vitrine.admin.theme.tabPublicTheme.openSansExcellenteLisibilite": "Open Sans (Excelente legibilidade)",
  "vitrine.admin.theme.tabPublicTheme.oswaldTitresCondensesAFort": "Oswald (Títulos condensados de alto impacto)",
  "vitrine.admin.theme.tabPublicTheme.playfairDisplaySerifElegante": "Playfair Display (Serif Elegante)",
  "vitrine.admin.theme.tabPublicTheme.latoChaleureuseEquilibree": "Lato (Acolhedora & Equilibrada)",
  "vitrine.admin.theme.tabPublicTheme.poppinsArrondieTendance": "Poppins (Arredondada & Moderna)",
  "vitrine.admin.theme.tabPublicTheme.cinzelClassiquePrestigieuse": "Cinzel (Clássica & Prestigiosa)",
  "vitrine.admin.theme.tabPublicTheme.ryeCordelGravureBois": "Rye (Cordel / Xilogravura)",
  "vitrine.admin.theme.tabPublicTheme.sancreekCordelTypoRetro": "Sancreek (Cordel / Tipo Retrô)",
  "vitrine.admin.theme.tabPublicTheme.apparenceVisuelleCharteGraphique": "🎨 Identidade Visual & Paleta de Cores",
  "vitrine.admin.theme.tabPublicTheme.personnalisezFinementLaPaletteVisuelle": "Personalize com precisão a paleta visual (6 cores semânticas) e a tipografia da sua vitrine pública.",
  "vitrine.admin.theme.tabPublicTheme.paletteDes6CouleursVitrine": "🎨 Paleta das 6 Cores da Vitrine",
  "vitrine.admin.theme.tabPublicTheme.1CouleurPrimaireTitresMarqueurs": "1. Cor Primária (Títulos, destaques)",
  "vitrine.admin.theme.tabPublicTheme.2CouleurSecondaireBadgesElements": "2. Cor Secundária (Badges, elementos de ênfase)",
  "vitrine.admin.theme.tabPublicTheme.3CouleurDeFondArriere": "3. Cor de Fundo (Plano de fundo principal)",
  "vitrine.admin.theme.tabPublicTheme.4CouleurDuTexteParagraphes": "4. Cor do Texto (Parágrafos e corpo)",
  "vitrine.admin.theme.tabPublicTheme.5CouleurDeFondDes": "5. Cor de Fundo dos Botões (CTA)",
  "vitrine.admin.theme.tabPublicTheme.6CouleurDuTexteDes": "6. Cor do Texto dos Botões",
  "vitrine.admin.theme.tabPublicTheme.policesDeCaracteres": "🔤 Fontes Tipográficas",
  "vitrine.admin.theme.tabPublicTheme.policeDesTitresHeadings": "Fonte dos Títulos (Headings)",
  "vitrine.admin.theme.tabPublicTheme.policeDuTexteBody": "Fonte do Texto (Body)",
  "vitrine.admin.theme.tabPublicTheme.policeCactus": "Fonte Cactus:",
  "vitrine.admin.theme.tabPublicTheme.laTypographieCordelOfficielleEst": "A tipografia Cordel oficial é pré-carregada localmente e não requer nenhum download externo.",
  "vitrine.admin.theme.tabPublicTheme.voileSurLImageD": "🖼️ Camada sobre a imagem de destaque (Hero Overlay)",
  "vitrine.admin.theme.tabPublicTheme.ajustezLAssombrissementDeLa": "Ajuste o escurecimento da foto de capa para deixá-la vibrante (0% = imagem pura, 25% = recomendado, 50% = escuro).",
  "vitrine.admin.theme.tabPublicTheme.10Eclatant": "10% (Vibrante)",
  "vitrine.admin.theme.tabPublicTheme.25Recommande": "25% (Recomendado)",
  "vitrine.admin.theme.tabPublicTheme.50Sombre": "50% (Escuro)",
  "vitrine.admin.theme.tabPublicTheme.apercuEnDirectDuTheme": "⚡ Prévia em tempo real do Tema",
  "vitrine.admin.theme.tabPublicTheme.titreDeLaVitrinePublique": "Título da Vitrine Pública",
  "vitrine.admin.theme.tabPublicTheme.ceciEstUnExempleDe": "Este é um exemplo de parágrafo. Ele utiliza a cor de texto configurada e a tipografia selecionada para o corpo da página.",
  "vitrine.admin.theme.tabPublicTheme.exempleDeBoutonCta": "Exemplo de Botão (CTA)",
  "vitrine.admin.theme.tabPublicTheme.badgeSecondaire": "Badge Secundário",

  // --- CONTENT : heroHeaderAccordion ---
  "vitrine.admin.content.heroHeaderAccordion.enTeteAccrocheHero": "Cabeçalho & Destaque (Hero)",
  "vitrine.admin.content.heroHeaderAccordion.titrePhraseDAccrocheVisuel": "Título, frase de efeito, imagem de capa e botão de ação principal",
  "vitrine.admin.content.heroHeaderAccordion.titrePrincipalDuSiteNom": "🏷️ Título Principal do Site / Nome da Associação",
  "vitrine.admin.content.heroHeaderAccordion.exSamambaia": "Ex: Samambaia",
  "vitrine.admin.content.heroHeaderAccordion.phraseDAccrocheHeroSection": "Frase de Efeito (Seção Hero)",
  "vitrine.admin.content.heroHeaderAccordion.exLEnergiePercutanteEt": "Ex: A energia marcante e solar do Maracatu pernambucano!",
  "vitrine.admin.content.heroHeaderAccordion.imageDeCouvertureHeroBanniere": "Imagem de Capa Hero (Banner / Fundo)",
  "vitrine.admin.content.heroHeaderAccordion.nouvelleImage": "✓ Nova imagem (",
  "vitrine.admin.content.heroHeaderAccordion.ko": "KB)",
  "vitrine.admin.content.heroHeaderAccordion.voileDAssombrissementSurL": "Camada de escurecimento sobre a imagem de destaque (Hero Overlay)",
  "vitrine.admin.content.heroHeaderAccordion.eclatant": "Vibrante",
  "vitrine.admin.content.heroHeaderAccordion.equilibre": "Equilibrado",
  "vitrine.admin.content.heroHeaderAccordion.sombre": "Escuro",
  "vitrine.admin.content.heroHeaderAccordion.lienVideoYoutubeOuVimeo": "Link de Vídeo do YouTube ou Vimeo (Opcional)",
  "vitrine.admin.content.heroHeaderAccordion.exHttpsWwwYoutubeCom": "Ex: https://www.youtube.com/watch?v=...",
  "vitrine.admin.content.heroHeaderAccordion.boutonDActionPrincipalHero": "🔘 Botão de Ação Principal (Hero CTA)",
  "vitrine.admin.content.heroHeaderAccordion.hautDeLaVitrine": "Topo da vitrine",
  "vitrine.admin.content.heroHeaderAccordion.texteDuBoutonCta": "Texto do botão CTA",
  "vitrine.admin.content.heroHeaderAccordion.exNousRejoindreProchainesDates": "Ex: Venha tocar conosco, Próximas datas...",
  "vitrine.admin.content.heroHeaderAccordion.iconeEmoji": "Ícone / Emoji",
  "vitrine.admin.content.heroHeaderAccordion.lienRedirection": "Link / Redirecionamento",
  "vitrine.admin.content.heroHeaderAccordion.exAgendaRecrutementMailto": "Ex: #agenda, #recrutamento, mailto:...",
  "vitrine.admin.content.heroHeaderAccordion.afficherLIcone": "Exibir o ícone",

  // --- CONTENT : presentationVieAccordion ---
  "vitrine.admin.content.presentationVieAccordion.presentationVieAssociative": "Apresentação & Vida Associativa",
  "vitrine.admin.content.presentationVieAccordion.textesQuiSommesNousQuotidien": "Textes Quem somos, cotidiano do grupo e oficinas semanais",
  "vitrine.admin.content.presentationVieAccordion.titreDeLaSectionPresentation": "👋 Título da seção Apresentação",
  "vitrine.admin.content.presentationVieAccordion.quiSommesNous": "Quem somos?",
  "vitrine.admin.content.presentationVieAccordion.presentationQuiSommesNous": "Apresentação \"Quem somos?\"",
  "vitrine.admin.content.presentationVieAccordion.presentezLHistoireDeVotre": "Apresente a história da sua associação, suas raízes, mestres e sua energia...",
  "vitrine.admin.content.presentationVieAccordion.notreQuotidienOrganisation": "🌿 Nosso Cotidiano & Organização",
  "vitrine.admin.content.presentationVieAccordion.sectionActive": "Seção Ativa",
  "vitrine.admin.content.presentationVieAccordion.titreQuotidien": "Título do Cotidiano",
  "vitrine.admin.content.presentationVieAccordion.notreQuotidienVieAssociative": "Nosso Cotidiano / Vida Associativa",
  "vitrine.admin.content.presentationVieAccordion.badgeQuotidien": "Badge do Cotidiano",
  "vitrine.admin.content.presentationVieAccordion.vieDeLaTroupe": "Vida do Grupo",
  "vitrine.admin.content.presentationVieAccordion.descriptionDuQuotidienAteliersRepetitions": "Descrição do Cotidiano (Oficinas, Ensaios)",
  "vitrine.admin.content.presentationVieAccordion.exRepetitionsDEnsembleLe": "Ex: Ensaios gerais nas noites de quinta, oficinas de confecção às segundas...",

  // --- RECRUITMENT : formulesRecrutementAccordion ---
  "vitrine.admin.recruitment.formulesRecrutementAccordion.formulesRecrutement": "Fórmulas & Recrutamento",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree": "Fórmulas Dança/Percussão ({param} configurada{param}), mensalidades e inscrições",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.afficherLaSectionRecrutement": "Exibir a seção Recrutamento",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.activerLesBoutonsHelloasso": "Ativar os botões de inscrição online",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.titreRecrutement": "Título de Recrutamento",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezLaTroupe": "Venha fazer parte do grupo!",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.titreDeLaCampagneD": "Título da campanha de adesão",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezLAVenture": "Venha Fazer Parte!",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.badgeSurTitre": "Badge / Sobretítulo",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.nousRejoindre": "Faça Parte",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.descriptionDeLInvitationA": "Descrição do convite para novos integrantes",
  "vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezNosAteliersHebdomadairesEt": "Participe das nossas oficinas semanais e viva uma experiência musical única.",

  // --- RECRUITMENT : formulesManager ---
  "vitrine.admin.recruitment.formulesManager.formulePercussion": "Fórmula Percussão",
  "vitrine.admin.recruitment.formulesManager.ateliersHebdomadairesDePercussionMaracatu": "Oficinas semanais de percussão de maracatu (Alfaia, Caixa, Gonguê, Agbê, Mineiro).",
  "vitrine.admin.recruitment.formulesManager.adhesionAnnuelle": "Adesão anual",
  "vitrine.admin.recruitment.formulesManager.pretDesInstrumentsInclus": "Empréstimo de instrumentos incluso",
  "vitrine.admin.recruitment.formulesManager.accesAuxRepetitionsPrestations": "Acesso a ensaios e apresentações",
  "vitrine.admin.recruitment.formulesManager.apprentissageDesRythmesEtDe": "Aprendizado dos ritmos e da técnica",
  "vitrine.admin.recruitment.formulesManager.formuleDanseChant": "Fórmula Dança & Canto",
  "vitrine.admin.recruitment.formulesManager.ateliersDeDanseTraditionnelleBresilienne": "Oficinas de dança tradicional brasileira, expressão cênica e canto polifônico.",
  "vitrine.admin.recruitment.formulesManager.developpementCorporelChoregraphies": "Desenvolvimento corporal e coreografias",
  "vitrine.admin.recruitment.formulesManager.accesAuxCostumesEtSorties": "Acesso aos figurinos e cortejos",
  "vitrine.admin.recruitment.formulesManager.ouvertATousNiveaux": "Aberto a todos os níveis",
  "vitrine.admin.recruitment.formulesManager.formuleComplete": "Fórmula Completa",
  "vitrine.admin.recruitment.formulesManager.accesIllimiteALEnsemble": "Acesso ilimitado a todas as oficinas de percussão, dança, canto e vivências especiais.",
  "vitrine.admin.recruitment.formulesManager.tarifPreferentiel": "Valor promocional",
  "vitrine.admin.recruitment.formulesManager.accesATousLesAteliers": "Acesso a todas as oficinas da semana",
  "vitrine.admin.recruitment.formulesManager.participationPrioritaireAuxStages": "Prioridade de participação em vivências e oficinas",
  "vitrine.admin.recruitment.formulesManager.immersionTotaleDansLaCulture": "Imersão total na cultura do Maracatu",
  "vitrine.admin.recruitment.formulesManager.leFichierSelectionneDoitEtre": "O arquivo selecionado deve ser uma imagem (JPG, PNG, WebP...).",
  "vitrine.admin.recruitment.formulesManager.uneErreurEstSurvenuePendant": "Ocorreu um erro durante o envio da imagem.",
  "vitrine.admin.recruitment.formulesManager.formulesDAdhesionCartesRecrutement": "🎫 Fórmulas de Adesão & Cartões de Recrutamento",
  "vitrine.admin.recruitment.formulesManager.ajouterUneFormule": "➕ Adicionar fórmula",
  "vitrine.admin.recruitment.formulesManager.personnalisezLesCartesDAdhesion": "Personalize os cartões de adesão exibidos na seção de recrutamento do site público (ex: Dança, Percussão, Fórmula Completa).",
  "vitrine.admin.recruitment.formulesManager.formule": "Fórmula",
  "vitrine.admin.recruitment.formulesManager.editer": "✏️ Editar",
  "vitrine.admin.recruitment.formulesManager.supprimer": "🗑️ Excluir",
  "vitrine.admin.recruitment.formulesManager.nouvelleFormuleDAdhesion": "➕ Nova Fórmula de Adesão",
  "vitrine.admin.recruitment.formulesManager.modifierLaFormule": "✏️ Modificar Fórmula",
  "vitrine.admin.recruitment.formulesManager.iconeEmoji": "Ícone / Emoji",
  "vitrine.admin.recruitment.formulesManager.titreDeLaFormule": "Título da Fórmula *",
  "vitrine.admin.recruitment.formulesManager.libelleDuTarifPeriode": "Descrição do Valor / Período",
  "vitrine.admin.recruitment.formulesManager.adhesionAnnuelleTarifReduit": "Adesão anual / Meia-entrada",
  "vitrine.admin.recruitment.formulesManager.texteDuBoutonSurLa": "Texto do botão no cartão",
  "vitrine.admin.recruitment.formulesManager.enSavoirPlus": "Saiba mais",
  "vitrine.admin.recruitment.formulesManager.descriptionCourteAfficheeSurLa": "Descrição curta (Exibida no cartão)",
  "vitrine.admin.recruitment.formulesManager.texteRicheGrasPuces": "Texto formatado (Negrito, tópicos...)",
  "vitrine.admin.recruitment.formulesManager.descriptionDetailleeDansLaModale": "Descrição detalhada (Na janela \"Saiba mais\")",
  "vitrine.admin.recruitment.formulesManager.texteRicheStructureGrasPuces": "Texto detalhado estruturado (Negrito, tópicos...)",
  "vitrine.admin.recruitment.formulesManager.precisezLeFonctionnementLesLieux": "Informe a dinâmica, locais, horários exatos, vestimenta recomendada, objetivos de aprendizado...",
  "vitrine.admin.recruitment.formulesManager.lienDInscriptionHelloassoSpecifique": "💳 Link de pagamento / inscrição específico (Opcional)",
  "vitrine.admin.recruitment.formulesManager.surchargeLeLienGlobalSi": "Substitui o link padrão quando preenchido",
  "vitrine.admin.recruitment.formulesManager.imageDArrierePlanDe": "🖼️ Imagem de Fundo do Cartão (Fórmula)",
  "vitrine.admin.recruitment.formulesManager.photoDArrierePlan": "Foto de fundo",
  "vitrine.admin.recruitment.formulesManager.televersement": "⏳ Enviando...",
  "vitrine.admin.recruitment.formulesManager.choisirUnePhotoLocale": "📁 Escolher foto local",
  "vitrine.admin.recruitment.formulesManager.retirerLImage": "🗑️ Remover imagem",
  "vitrine.admin.recruitment.formulesManager.ouUrlDirecteDeL": "Ou link direto da imagem do cartão:",
  "vitrine.admin.recruitment.formulesManager.photoDIllustrationPourLa": "📸 Foto Ilustrativa para a Janela HD (\"Saiba mais\")",
  "vitrine.admin.recruitment.formulesManager.grandFormat": "Formato amplo",
  "vitrine.admin.recruitment.formulesManager.uploaderPhotoHdModale": "📁 Enviar foto HD para a janela",
  "vitrine.admin.recruitment.formulesManager.retirerLImageHd": "🗑️ Remover imagem HD",
  "vitrine.admin.recruitment.formulesManager.ouUrlDeLImage": "Ou link da imagem HD:",
  "vitrine.admin.recruitment.formulesManager.apercuDuRenduFinalAvec": "Prévia do visual com escurecimento (bg-black/60)",
  "vitrine.admin.recruitment.formulesManager.pointsFortsAvantagesInclusUn": "Destaques / Vantagens inclusas (Um por linha)",
  "vitrine.admin.recruitment.formulesManager.chaqueLigneDeviendraUnePuce": "Cada linha se tornará um item marcado ✓",
  "vitrine.admin.recruitment.formulesManager.pretDesInstrumentsInclusAcces": "Empréstimo de instrumentos incluso\nAcesso a ensaios e apresentações\nAberto a todos os níveis",
  "vitrine.admin.recruitment.formulesManager.annuler": "Cancelar",
  "vitrine.admin.recruitment.formulesManager.validerLaFormule": "Confirmar fórmula",

  // --- PRO DOCS : proDocsAccordion ---
  "vitrine.admin.proDocs.proDocsAccordion.documentsEspacePro": "Documentos Espaço Profissional",
  "vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan": "Dossiê artístico, ficha técnica, mapa de palco, kit de imprensa ({param}/4 configurado{param})",

  // --- PRO DOCS : tabPublicProDocs ---
  "vitrine.admin.proDocs.tabPublicProDocs.dossierDePresentationCompletPdf": "📄 Dossiê de apresentação completo (PDF)",
  "vitrine.admin.proDocs.tabPublicProDocs.presentationCompleteDeLaTroupe": "Apresentação completa do grupo, histórico e universo artístico.",
  "vitrine.admin.proDocs.tabPublicProDocs.ficheTechniqueBesoinsSonLumiere": "🛠️ Ficha técnica (Necessidades de som/luz/logística) (PDF)",
  "vitrine.admin.proDocs.tabPublicProDocs.ficheTechniqueOfficielleDecrivantLes": "Ficha técnica oficial detalhando as necessidades sonoras e de infraestrutura.",
  "vitrine.admin.proDocs.tabPublicProDocs.planDeScenePdfOu": "📐 Mapa de palco (PDF ou Imagem)",
  "vitrine.admin.proDocs.tabPublicProDocs.planDePlacementSurScene": "Mapa de posicionamento no palco ou esquema de distribuição cênica.",
  "vitrine.admin.proDocs.tabPublicProDocs.kitPresseTextePhotosHd": "📦 Kit de Imprensa (Texto & Fotos HD) (ZIP ou PDF)",
  "vitrine.admin.proDocs.tabPublicProDocs.kitPresseCompletIncluantVisuels": "Kit de imprensa completo com fotos em alta resolução e releases para a mídia.",
  "vitrine.admin.proDocs.tabPublicProDocs.documentsEspaceProOrganisateurs": "📑 Documentos Espaço Profissional & Contratantes",
  "vitrine.admin.proDocs.tabPublicProDocs.telechargementsVitrine": "Downloads da Vitrine",
  "vitrine.admin.proDocs.tabPublicProDocs.ajoutezLesDocumentsOfficielsTelechargeables": "Adicione os documentos oficiais disponíveis para download por contratantes de shows e imprensa. Apenas os documentos cadastrados terão botão de download ativo na vitrine pública.",
  "vitrine.admin.proDocs.tabPublicProDocs.afficherLeBlocEspacePro": "Exibir a seção \"Espaço Profissional\" (downloads) no rodapé da vitrine",
  "vitrine.admin.proDocs.tabPublicProDocs.consulterLeFichier": "👁️ Visualizar arquivo",
  "vitrine.admin.proDocs.tabPublicProDocs.supprimerLeDocumentActuel": "Excluir o documento atual",
  "vitrine.admin.proDocs.tabPublicProDocs.supprimer": "🗑️ Excluir",
  "vitrine.admin.proDocs.tabPublicProDocs.annuler": "✖ Cancelar",
  "vitrine.admin.proDocs.tabPublicProDocs.nouveauFichierPretAL": "📌 Novo arquivo pronto para envio:",
  "vitrine.admin.proDocs.tabPublicProDocs.ko": "KB)",

  // --- GALLERY : gallerySouvenirsAccordion ---
  "vitrine.admin.gallery.gallerySouvenirsAccordion.galerieSouvenirs": "Galeria & Lembranças",
  "vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam": "Seleção de fotos públicas ({param} foto{param} online)",

  // --- GALLERY : tabPublicGallery ---
  "vitrine.admin.gallery.tabPublicGallery.optimisationEnvoiDe0Param": "Otimização & Envio de 0 / {param}...",
  "vitrine.admin.gallery.tabPublicGallery.traitementDeLaPhotoParam": "Processando foto {param} / {param}...",
  "vitrine.admin.gallery.tabPublicGallery.paramPhotoSAjouteeS": "✓ {param} foto(s) adicionada(s) com sucesso!",
  "vitrine.admin.gallery.tabPublicGallery.erreurLorsDeLEnvoi": "❌ Erro durante o envio: {param}",
  "vitrine.admin.gallery.tabPublicGallery.sectionGaleriePhotosEnImages": "📸 Seção Galeria de Fotos (\"Em Imagens\")",
  "vitrine.admin.gallery.tabPublicGallery.sectionActive": "✓ Seção Ativa",
  "vitrine.admin.gallery.tabPublicGallery.sectionMasquee": "⚪ Seção Oculta",
  "vitrine.admin.gallery.tabPublicGallery.afficherLaSectionGaleriePhotos": "Exibir a seção Galeria de Fotos na vitrine pública",
  "vitrine.admin.gallery.tabPublicGallery.titreDeLaSectionGalerie": "Título da seção Galeria",
  "vitrine.admin.gallery.tabPublicGallery.galeriePhotosEnImages": "Galeria de Fotos / Em Imagens",
  "vitrine.admin.gallery.tabPublicGallery.surTitreBadgeGalerie": "Sobretítulo / Badge da Galeria",
  "vitrine.admin.gallery.tabPublicGallery.enImages": "Em Imagens",
  "vitrine.admin.gallery.tabPublicGallery.descriptionAccrocheGalerie": "Descrição / Apresentação da Galeria",
  "vitrine.admin.gallery.tabPublicGallery.decouvrezNosPrestationsSceniquesRepetitions": "Confira nossas apresentações nos palcos, ensaios e momentos marcantes em imagens!",
  "vitrine.admin.gallery.tabPublicGallery.televerserDeNouvellesPhotosSelection": "📤 Enviar novas fotos (Seleção múltipla)",
  "vitrine.admin.gallery.tabPublicGallery.vousPouvezSelectionnerPlusieursImages": "💡 Você pode selecionar várias imagens de uma vez. Elas serão otimizadas automaticamente para carregamento rápido no celular.",
  "vitrine.admin.gallery.tabPublicGallery.ouAjouterDirectementUneImage": "🔗 Ou adicionar diretamente uma imagem pelo link URL:",
  "vitrine.admin.gallery.tabPublicGallery.ajouter": "+ Adicionar",
  "vitrine.admin.gallery.tabPublicGallery.photosActuellementEnregistrees": "🖼️ Fotos atualmente cadastradas (",
  "vitrine.admin.gallery.tabPublicGallery.reorganisezLOrdreParGlisser": "💡 Reorganize a ordem arrastando e soltando ou usando as setas ⬅️ ➡️",
  "vitrine.admin.gallery.tabPublicGallery.aucunePhotoDansLaGalerie": "Nenhuma foto na galeria no momento. Envie imagens acima para alimentar o carrossel!",
  "vitrine.admin.gallery.tabPublicGallery.galerieParam": "Galeria {param}",
  "vitrine.admin.gallery.tabPublicGallery.supprimerCettePhoto": "Excluir esta foto",
  "vitrine.admin.gallery.tabPublicGallery.rang": "Posição",

  // --- SOCIAL NEWSLETTER : socialLinksBlock ---
  "vitrine.admin.socialNewsletter.socialLinksBlock.facebook": "📘 Facebook",
  "vitrine.admin.socialNewsletter.socialLinksBlock.instagram": "📸 Instagram",
  "vitrine.admin.socialNewsletter.socialLinksBlock.youtube": "🎬 YouTube",
  "vitrine.admin.socialNewsletter.socialLinksBlock.tiktok": "🎵 TikTok",
  "vitrine.admin.socialNewsletter.socialLinksBlock.snapchat": "👻 Snapchat",
  "vitrine.admin.socialNewsletter.socialLinksBlock.whatsapp": "💬 WhatsApp",
  "vitrine.admin.socialNewsletter.socialLinksBlock.linkedin": "💼 LinkedIn",
  "vitrine.admin.socialNewsletter.socialLinksBlock.spotifyMusique": "🎧 Spotify / Música",
  "vitrine.admin.socialNewsletter.socialLinksBlock.liensDesReseauxSociaux": "🌐 Links das Redes Sociais",
  "vitrine.admin.socialNewsletter.socialLinksBlock.affichageSurLaVitrine": "Exibição na vitrine"
};

// 1. Charger les clés uniques issues de l'audit
const uniqueKeys = JSON.parse(fs.readFileSync('scripts/scratch_unique_keys.json', 'utf8'));

// 2. Construire l'arborescence imbriquée pour FR et PT
const frTree = {};
const ptTree = {};

for (const item of uniqueKeys) {
  const parts = item.key.replace(/^vitrine\.admin\./, '').split('.');
  const [category, component, ...subKeys] = parts;
  const leafKey = subKeys.join('.');

  if (!frTree[category]) frTree[category] = {};
  if (!frTree[category][component]) frTree[category][component] = {};

  if (!ptTree[category]) ptTree[category] = {};
  if (!ptTree[category][component]) ptTree[category][component] = {};

  frTree[category][component][leafKey] = item.text;
  const ptVal = ptTranslationsMap[item.key];
  if (!ptVal) {
    console.error('MISSING PT TRANSLATION FOR:', item.key);
  }
  ptTree[category][component][leafKey] = ptVal || item.text;
}

// 3. Vérifier les clés manquantes
const missingInPt = uniqueKeys.filter(it => !ptTranslationsMap[it.key]);
if (missingInPt.length > 0) {
  console.error(`❌ Il y a ${missingInPt.length} clés sans traduction PT-BR !`);
  process.exit(1);
}

console.log(`✅ Les 255 clés uniques sont parfaitement traduites en FR et PT-BR.`);

// Sauvegarder dans scripts/data_vitrine_admin_locales.mjs
const content = `/**
 * Dictionnaire bilingue exhaustif (FR / PT-BR) du Back-Office du Pôle Vitrine
 * Namespace racine : vitrine.admin.*
 * 
 * Contient exactement les 255 clés uniques couvrant les 264 chaînes brutes de l'audit.
 */

export const vitrineAdminFr = ${JSON.stringify(frTree, null, 2)};

export const vitrineAdminPt = ${JSON.stringify(ptTree, null, 2)};
`;

fs.writeFileSync('scripts/data_vitrine_admin_locales.mjs', content, 'utf8');
console.log('✅ Fichier scripts/data_vitrine_admin_locales.mjs généré avec succès !');
