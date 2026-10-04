/**
 * Fichier de Configuration Centralisé : poleGuides.js
 * 
 * Contient l'ensemble des guides d'aide contextuelle pour les pôles et onglets d'administration.
 * Guide les membres du bureau (Trésorier, Secrétaire, Mestre, Logistique, Lutherie, Costumerie, Studio)
 * dans leurs tâches quotidiennes et alimente la bannière InfoPoleBanner ainsi que le futur parcours guidé.
 * 
 * ⚠️ VUES MEMBRES SIMPLES SANS GUIDE EXCLUES :
 * Les espaces réservés aux adhérents simples (Accueil, Profil, Matériel membre,
 * Vestiaire membre, Trombinoscope, Varal membre) ne comportent PAS de bannière.
 */

// Liste explicite des onglets et pôles membres à exclure de toute bannière d'aide
const EXCLUDED_MEMBER_KEYS = new Set([
  'accueil',
  'mon-espace',
  'profil',
  'materiel',
  'vestiaire',
  'trombinoscope',
  'varal',
  'dashboard'
]);

/**
 * Guide complet bilingue (FR / PT-BR) : Agenda & Événements
 * Couvre à la fois la vue membre (RSVP, feuille de route, covoiturage, révision)
 * et la vue gestionnaire (création, horaires, ciblage, logistique, publication).
 */
export const agendaGuide = {
  id: "agenda",
  poleName: {
    fr: "Agenda & Événements",
    pt: "Programação & Eventos"
  },
  titre: "Agenda & Événements",
  title: "Agenda & Événements",
  description: "Consulte le calendrier de la troupe, déclare tes présences et organise tes trajets.",

  // ==========================================
  // 1. VUE MEMBRE (Orientation, consultation, RSVP)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Comment utiliser l'Agenda ?",
      pt: "Como utilizar a Programação?"
    },
    summary: {
      fr: "Consulte le calendrier de la troupe, déclare tes présences et organise tes trajets.",
      pt: "Consulte o calendário da trupe, confirme sua presença e organize suas viagens."
    },
    sections: [
      {
        heading: {
          fr: "1. Répondre aux convocations (RSVP)",
          pt: "1. Confirmar presença (RSVP)"
        },
        text: {
          fr: "Dès qu'une date apparaît, clique dessus pour indiquer « Présent », « Absent » ou « Incertain ». Cela permet d'équilibrer les pupitres et de calibrer la logistique.",
          pt: "Assim que uma data for postada, clique para indicar « Presente », « Ausente » ou « A confirmar ». Isso ajuda a equilibrar os naipes e planejar a logística."
        }
      },
      {
        heading: {
          fr: "2. Consulter la feuille de route",
          pt: "2. Consultar o roteiro (Roadbook)"
        },
        text: {
          fr: "Retrouve dans chaque événement l'heure de rendez-vous, le lieu précis (lien GPS), la tenue requise et les consignes de jeu.",
          pt: "Encontre em cada evento o horário de encontro, local exato (link GPS), figurino exigido e instruções de apresentação."
        }
      },
      {
        heading: {
          fr: "3. Organiser le covoiturage",
          pt: "3. Organizar a carona solidária"
        },
        text: {
          fr: "Propose des places ou rejoins un véhicule. 💡 Astuce : renseigne ton véhicule dans ton profil (« Mon profil » > « Véhicule ») pour que ton nombre de places et ton coffre à alfaias se pré-remplissent automatiquement.",
          pt: "Ofereça vagas ou pegue carona. 💡 Dica: cadastre seu veículo no seu perfil (« Meu Perfil » > « Veículo ») para preencher automaticamente suas vagas e espaço de alfaias."
        }
      },
      {
        heading: {
          fr: "4. Réviser le programme",
          pt: "4. Praticar o repertório"
        },
        text: {
          fr: "Si une setlist est associée, clique sur les morceaux pour ouvrir directement les paroles, les repères culturels ou lancer le Séquenceur.",
          pt: "Se houver uma lista de músicas, clique nelas para acessar diretamente letras, contexto cultural ou abrir o Sequenciador."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Secrétariat, Mestre, Logistique)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Piloter et animer un événement",
      pt: "Gerenciar e coordenar um evento"
    },
    roleBadge: {
      fr: "Secrétariat • Mestre • Logistique",
      pt: "Secretaria • Mestre • Logística"
    },
    summary: {
      fr: "Enchaînement chronologique pour planifier une sortie, mobiliser la troupe et gérer la logistique.",
      pt: "Passo a passo cronológico para agendar uma apresentação, mobilizar a trupe e gerenciar a logística."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Création et statut de la date",
          pt: "Criação e status da data"
        },
        desc: {
          fr: "Clique sur « + Nouvel événement ». Définis la typologie (Répétition, Prestation, Atelier). Laisse en « Option » tant que le contrat n'est pas signé.",
          pt: "Clique em « + Novo evento ». Escolha a categoria (Ensaio, Apresentação, Oficina). Mantenha em « Opção » enquanto o contrato não estiver fechado."
        }
      },
      {
        step: 2,
        title: {
          fr: "Localisation et horaires",
          pt: "Localização e horários"
        },
        desc: {
          fr: "Associe un lieu habituel ou une adresse GPS. Fixe l'heure de rassemblement au local, l'arrivée sur place et les créneaux de jeu.",
          pt: "Vincule um local cadastrado ou endereço GPS. Defina o horário de saída da sede, chegada no local e passagens de som."
        }
      },
      {
        step: 3,
        title: {
          fr: "Ciblage et programme artistique",
          pt: "Público-alvo e repertório"
        },
        desc: {
          fr: "Choisis les disciplines requises (percussion, danse) et le niveau. Rattache les toadas et convenções du Répertoire à réviser.",
          pt: "Selecione as modalidades (percussão, dança) e o nível. Vincule as toadas e convenções do Repertório a serem ensaiadas."
        }
      },
      {
        step: 4,
        title: {
          fr: "Logistique, commissions et transport",
          pt: "Logística, comissões e transporte"
        },
        desc: {
          fr: "Active le covoiturage matériel/passagers, prévois les malles régie et nomme les référents de commissions (repas, accueil).",
          pt: "Ative a carona coletiva (integrantes e alfaias), selecione os kits de instrumentos e defina os responsáveis pelas comissões."
        }
      },
      {
        step: 5,
        title: {
          fr: "Publication et feuille de route",
          pt: "Publicação e roteiro final"
        },
        desc: {
          fr: "Bascule la visibilité sur « Publié ». Contrôle les présences par pupitre en temps réel et génère la feuille de route PDF pour le jour J.",
          pt: "Altere a visibilidade para « Publicado ». Monitore as presenças por naipe em tempo real e gere o roteiro PDF para o dia da apresentação."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_creer_evenement", label: { fr: "Créer une date et sa setlist", pt: "Criar uma data e sua lista de músicas" } },
      { id: "tuto_regie_covoiturage", label: { fr: "Régie de convoi et feuille de route", pt: "Gestão de caronas e roteiro" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Pédagogie & Répertoire
 * Couvre à la fois la vue membre (apprentissage, écoute, aisance, défis)
 * et la vue gestionnaire (Mestria, direction artistique, bloc-notes, calibrage).
 */
export const pedagogyGuide = {
  id: "pedagogy",
  poleName: {
    fr: "Pédagogie & Répertoire",
    pt: "Pedagogia & Repertório"
  },
  titre: "Pédagogie & Répertoire",
  title: "Pédagogie & Répertoire",
  description: "Retrouve les toadas, écoute les arrangements, entraîne-toi au tempo et évalue ton confort de jeu.",

  // ==========================================
  // 1. VUE MEMBRE (Apprentissage, écoute, aisance)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Comment travailler les morceaux et progresser ?",
      pt: "Como praticar o repertório e evoluir?"
    },
    summary: {
      fr: "Retrouve les toadas, écoute les arrangements, entraîne-toi au tempo et évalue ton confort de jeu.",
      pt: "Acesse as toadas, escute os arranjos, treine no andamento e avalie seu conforto musical."
    },
    sections: [
      {
        heading: {
          fr: "1. Explorer les fiches de morceaux",
          pt: "1. Explorar as fichas das músicas"
        },
        text: {
          fr: "Dans l'onglet Morceaux, clique sur une toada pour déplier ses paroles complètes, son contexte historique et ses repères culturels.",
          pt: "Na aba Músicas, clique em uma toada para ver a letra completa, seu contexto histórico e referências culturais."
        }
      },
      {
        heading: {
          fr: "2. Pratiquer avec le Séquenceur & Entraînements",
          pt: "2. Praticar com o Sequenciador & Treinos"
        },
        text: {
          fr: "Lance le Séquenceur pour isoler ton pupitre ou t'entraîner au métronome. Monte progressivement le tempo par paliers pour consolider ton aisance.",
          pt: "Abra o Sequenciador para isolar seu naipe ou treinar com metrônomo. Aumente o andamento aos poucos para consolidar seu conforto rítmico."
        }
      },
      {
        heading: {
          fr: "3. Auto-évaluation & Carnet d'aisance",
          pt: "3. Autoavaliação & Caderno de conforto"
        },
        text: {
          fr: "Indique régulièrement ton niveau ressenti sur chaque morceau (Découverte, En pratique, À l'aise, Référent). Cela permet d'adapter le programme des prochaines répétitions.",
          pt: "Atualize regularmente seu nível em cada música (Descoberta, Em prática, Confortável, Referência). Isso ajuda a planejar os próximos ensaios."
        }
      },
      {
        heading: {
          fr: "4. Défis interactifs & Signaux du Mestre",
          pt: "4. Desafios interativos & Sinais do Mestre"
        },
        text: {
          fr: "Teste tes réflexes sur le Défi « Temps 1 », identifie les gestes de commandement et révise le vocabulaire traditionnel dans les quiz d'entraînement.",
          pt: "Teste seus reflexos no Desafio do « Tempo 1 », reconheça os gestos de comando e pratique os termos tradicionais nos quizzes."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Mestria, Direction Pédagogique)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Piloter la progression artistique et les répétitions",
      pt: "Coordenar a progressão artística e os ensaios"
    },
    roleBadge: {
      fr: "Mestre • Direction Artistique • Formateurs",
      pt: "Mestre • Direção Artística • Instrutores"
    },
    summary: {
      fr: "Flux de travail pour enrichir le répertoire, analyser les points faibles de la troupe et calibrer les répétitions.",
      pt: "Fluxo de trabalho para enriquecer o repertório, analisar pontos frágeis da trupe e preparar os ensaios."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Administration du répertoire & visibilité",
          pt: "Gestão do repertório e visibilidade"
        },
        desc: {
          fr: "Crée ou édite les fiches morceaux dans l'onglet Répertoire. Définis si la pièce fait partie de la Saison officielle ou des Archives, et associe la tablature, l'audio et la vidéo YouTube.",
          pt: "Crie ou edite as músicas na aba Repertório. Defina se a toada pertence à Temporada oficial ou aos Arquivos, vinculando tablatura, áudio e vídeo de referência."
        }
      },
      {
        step: 2,
        title: {
          fr: "Liaison culturelle & Varal",
          pt: "Conexão cultural & Varal"
        },
        desc: {
          fr: "Utilise le bouton « 📜 Fiche Culture » pour relier la toada à une notice historique ou spirituelle (Orixás, origines de la nation, traditions).",
          pt: "Utilize o botão « 📜 Ficha Cultural » para vincular a toada a uma contextualização histórica ou espiritual (Orixás, história da nação, tradições)."
        }
      },
      {
        step: 3,
        title: {
          fr: "Analyse du tableau de bord & points chauds",
          pt: "Análise do painel e pontos críticos"
        },
        desc: {
          fr: "Consulte le Dashboard Pédagogique. Repère les morceaux et pupitres sous le seuil d'aisance (< 60 %) pour identifier les fragilités collectives.",
          pt: "Consulte o Painel Pedagógico. Observe as músicas e naipes com nível de conforto abaixo de 60% para identificar as dificuldades do grupo."
        }
      },
      {
        step: 4,
        title: {
          fr: "Programmation de la répétition",
          pt: "Pauta do próximo ensaio"
        },
        desc: {
          fr: "Épingle les morceaux prioritaires issus de l'analyse dans le Bloc-notes de répétition. Le programme est directement consultable pour préparer la séance.",
          pt: "Fixe as músicas prioritárias apontadas pela análise diretamente na Pauta de Ensaio para estruturar o cronograma do próximo treino."
        }
      },
      {
        step: 5,
        title: {
          fr: "Configuration des quiz & leurres",
          pt: "Configuração de quizzes e pegadinhas"
        },
        desc: {
          fr: "Dans l'onglet QCM & Quiz, ajuste les questions d'auto-évaluation, configure les signaux de commandement et calibre les distracteurs dynamiques pour les élèves.",
          pt: "Na aba QCM & Quiz, ajuste as perguntas de autoavaliação, configure os sinais de condução e calibre os distratores dinâmicos para os alunos."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_creer_toada_repertoire", label: { fr: "Créer un morceau et relier sa fiche culturelle", pt: "Criar uma música e vincular sua ficha cultural" } },
      { id: "tuto_dashboard_pedagogique_pauta", label: { fr: "Analyser l'aisance et programmer la répétition", pt: "Analisar o conforto e estruturar a pauta de ensaio" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Logistique, Matériel & Vestiaire
 * Couvre à la fois la vue membre (Matériel prêté, mensurations, tutoriels)
 * et la vue gestionnaire (Régie Matériel, Lutherie, Costumerie).
 */
export const logisticsGuide = {
  id: "logistics",
  poleName: {
    fr: "Logistique, Matériel & Vestiaire",
    pt: "Logística, Instrumentos & Figurino"
  },
  titre: "Logistique, Matériel & Vestiaire",
  title: "Logistique, Matériel & Vestiaire",
  description: "Consulte tes instruments attribués, renseigne tes mensurations pour les costumes et accède aux tutoriels d'atelier.",

  // ==========================================
  // 1. VUE MEMBRE (Matériel prêté, mensurations, tutoriels)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Gérer son équipement, ses tenues et ses réparations",
      pt: "Gerenciar seu equipamento, figurino e manutenção"
    },
    summary: {
      fr: "Consulte tes instruments attribués, renseigne tes mensurations pour les costumes et accède aux tutoriels d'atelier.",
      pt: "Consulte seus instrumentos vinculados, informe suas medidas de figurino e acerte a manutenção com as oficinas."
    },
    sections: [
      {
        heading: {
          fr: "1. Mon instrument assigné",
          pt: "1. Meu instrumento vinculado"
        },
        text: {
          fr: "Vérifie l'instrument qui t'est confié pour la saison, son numéro d'inventaire et son état. Signale immédiatement à la régie si une peau ou un cordage nécessite une intervention.",
          pt: "Confira o instrumento atribuído a você na temporada, seu número de tombamento e estado. Avise a equipe técnica se houver necessidade de troca de pele ou corda."
        }
      },
      {
        heading: {
          fr: "2. Mesures & Tenues de scène",
          pt: "2. Medidas & Figurinos"
        },
        text: {
          fr: "Renseigne tes mensurations (tour de taille, stature) dans l'onglet Costumes pour que la commission couture ajuste tes tenues aux couleurs de la troupe.",
          pt: "Preencha suas medidas corporais na aba Figurino para que a comissão de costura possa confeccionar ou ajustar suas roupas oficiais."
        }
      },
      {
        heading: {
          fr: "3. Tutoriels d'atelier (Lutherie & Couture)",
          pt: "3. Tutoriais de oficina (Luthieria & Costura)"
        },
        text: {
          fr: "Consulte les fiches pratiques pour apprendre à monter une peau de chèvre, tresser un filet d'agbê ou confectionner ta jupe ou ton pantalon de cortège.",
          pt: "Acesse os passos a passo práticos para aprender a afinar uma alfaia, tecer o xequerê ou montar suas peças de cortejo."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Régie Matériel, Lutherie, Costumerie)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Administrer le parc d'instruments et le vestiaire",
      pt: "Administrar o acervo de instrumentos e o figurino"
    },
    roleBadge: {
      fr: "Logistique • Lutherie • Costumerie",
      pt: "Logística • Luthieria • Figurino"
    },
    summary: {
      fr: "Cycle de gestion du matériel : inventaire, suivi des prêts, fiches de mensurations et conception de tutoriels.",
      pt: "Ciclo de gestão de materiais: inventário, controle de empréstimos, tabela de medidas e criação de oficinas."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Inventaire et identification du parc",
          pt: "Inventário e tombamento do acervo"
        },
        desc: {
          fr: "Enregistre chaque pièce (alfaias, caixas, gonguês, agbês) avec son numéro d'inventaire, son diamètre/taille et son état d'usure.",
          pt: "Cadastre cada peça (alfaias, caixas, gonguês, agbês) com seu código identificador, diâmetro/tamanho e nível de conservação."
        }
      },
      {
        step: 2,
        title: {
          fr: "Affectations, prêts et malles régie",
          pt: "Alocações, empréstimos e malas de transporte"
        },
        desc: {
          fr: "Assigne les instruments aux musiciens pour la saison ou prépare les malles de transport collectives pour les déplacements de concerts.",
          pt: "Vincule os tambores aos integrantes para a temporada ou organize as malas coletivas de transporte para as viagens de shows."
        }
      },
      {
        step: 3,
        title: {
          fr: "Gestion des costumes et tableau des tailles",
          pt: "Controle de figurinos e tabela de tamanhos"
        },
        desc: {
          fr: "Suis l'état des tenues de parade, contrôle la grille des mensurations des adhérents et gère les attributions par pupitre (danse vs percussion).",
          pt: "Acompanhe o estoque de trajes, monitore a tabela de medidas dos membros e organize as entregas por ala (dança e percussão)."
        }
      },
      {
        step: 4,
        title: {
          fr: "Création de fiches atelier et tutoriels",
          pt: "Criação de tutoriais e fichas técnicas"
        },
        desc: {
          fr: "Rédige les tutoriels de fabrication avec étapes détaillées, fournitures requises, outils et patrons téléchargeables en PDF.",
          pt: "Elabore os tutoriais de confecção detalhando etapas, lista de insumos, ferramentas necessárias e moldes em PDF."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_inventaire_instruments", label: { fr: "Gérer l'inventaire et les prêts", pt: "Gerenciar o inventário e empréstimos" } },
      { id: "tuto_gestion_costumes", label: { fr: "Suivre les mensurations et costumes", pt: "Controlar medidas e figurinos" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Porte-Voix & Vie du groupe
 * Couvre à la fois la vue membre (Échanges, MP, entraide)
 * et la vue gestionnaire (Modération, Salons, Bureau).
 */
export const forumGuide = {
  id: "forum",
  poleName: {
    fr: "Porte-Voix & Vie du groupe",
    pt: "Porta-Voz & Vida da Trupe"
  },
  titre: "Porte-Voix & Vie du groupe",
  title: "Porte-Voix & Vie du groupe",
  description: "Participe aux discussions collectives, envoie des messages privés ou rejoins des boucles de travail.",

  // ==========================================
  // 1. VUE MEMBRE (Échanges, MP, entraide)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Comment échanger sur le Porte-Voix ?",
      pt: "Como participar das conversas no Porta-Voz?"
    },
    summary: {
      fr: "Participe aux discussions collectives, envoie des messages privés ou rejoins des boucles de travail.",
      pt: "Participe das conversas coletivas, envie mensagens diretas ou crie grupos temáticos."
    },
    sections: [
      {
        heading: {
          fr: "1. Les Salons thématiques (Discussions)",
          pt: "1. Salas temáticas (Discussões)"
        },
        text: {
          fr: "Retrouve les canaux ouverts à tous ou réservés à ton pupitre. L'atterrissage se fait directement sur les nouveaux messages non lus pour ne rien manquer.",
          pt: "Acesse os canais abertos a todos ou exclusivos do seu naipe. O aplicativo foca direto nas mensagens não lidas para você não perder nada."
        }
      },
      {
        heading: {
          fr: "2. Messages privés (1-à-1)",
          pt: "2. Mensagens diretas (1 a 1)"
        },
        text: {
          fr: "Échange en tête-à-tête avec n'importe quel adhérent via l'onglet « Messages privés ». Une coche confirme l'envoi, deux coches illuminées confirment la lecture.",
          pt: "Converse em particular com qualquer integrante pela aba « Mensagens privadas ». Uma marca confirma o envio, duas marcas destacadas confirmam a leitura."
        }
      },
      {
        heading: {
          fr: "3. Groupes de travail & projets",
          pt: "3. Grupos de trabalho & projetos"
        },
        text: {
          fr: "Crée ou rejoins des boucles multi-membres pour monter un atelier, organiser un trajet ou préparer une commande sans polluer le canal général.",
          pt: "Crie ou participe de grupos fechados para oficinas, projetos pontuais ou caronas sem sobrecarregar o canal geral."
        }
      },
      {
        heading: {
          fr: "4. Médias, mentions et sondages",
          pt: "4. Mídias, menções e enquetes"
        },
        text: {
          fr: "Partage des photos ou des liens vidéo, mentionne un pupitre avec « @ » et vote d'un clic aux sondages lancés par le groupe.",
          pt: "Compartilhe fotos ou links de vídeos, mencione um naipe com « @ » e vote com um clique nas enquetes abertas."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Modération, Salons, Bureau)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Animer et modérer les espaces de discussion",
      pt: "Moderar e estruturar os canais de conversa"
    },
    roleBadge: {
      fr: "Modération • Bureau • Conseil d'Administration",
      pt: "Moderação • Diretoria • Conselho"
    },
    summary: {
      fr: "Administration des canaux, gestion fine des droits d'accès par badge, épinglage et consultations démocratiques.",
      pt: "Gestão dos canais, controle de acesso por crachá, fixação de avisos e enquetes participativas."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Création et hiérarchie des salons",
          pt: "Criação e hierarquia de salas"
        },
        desc: {
          fr: "Clique sur « ⚙️ Gérer les salons » dans l'en-tête du Porte-Voix pour ouvrir la modale d'administration sans quitter la discussion.",
          pt: "Clique em « ⚙️ Gerenciar salas » no topo do Porta-Voz para abrir a modale de administração sem sair da conversa."
        }
      },
      {
        step: 2,
        title: {
          fr: "Matrice de permissions (Lecture & Écriture)",
          pt: "Matriz de permissões (Leitura & Escrita)"
        },
        desc: {
          fr: "Définis qui peut lire et qui peut poster dans chaque canal selon les étiquettes (ex. salon réservé au Bureau, canal en lecture seule pour les annonces).",
          pt: "Defina quem pode ler e quem pode postar em cada canal usando os crachás (ex: canal fechado da Diretoria ou canal em somente leitura para avisos)."
        }
      },
      {
        step: 3,
        title: {
          fr: "Épinglage et priorisation des sujets",
          pt: "Fixação e destaque de tópicos"
        },
        desc: {
          fr: "Épingle les discussions majeures en haut de liste pour qu'elles restent immédiatement visibles lors des consultations ou répétitions.",
          pt: "Fixe tópicos essenciais no topo da lista para manter avisos ou debates importantes sempre em evidência."
        }
      },
      {
        step: 4,
        title: {
          fr: "Lancement de sondages et consultations",
          pt: "Criação de enquetes e decisões coletivas"
        },
        desc: {
          fr: "Intègre un module de vote sécurisé (sans votes multiples) lors de la création d'un sujet pour trancher un choix logistique ou artistique.",
          pt: "Insira uma enquete com opções de voto único para decisões rápidas de logística, figurino ou repertório."
        }
      },
      {
        step: 5,
        title: {
          fr: "Modération et courtoisie",
          pt: "Moderação e convivência"
        },
        desc: {
          fr: "Veille au respect de la charte de vie associative, archive les discussions obsolètes et oriente les détails logistiques vers les fiches événements.",
          pt: "Acompanhe o respeito às regras da trupe, arquive discussões antigas e direcione dúvidas pontuais para as fiches dos eventos."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_gestion_salons_droits", label: { fr: "Créer un salon et régler les accès", pt: "Criar canal e ajustar permissões" } },
      { id: "tuto_sondages_et_epingles", label: { fr: "Lancer un sondage et épingler un sujet", pt: "Criar enquetes e fixar mensagens" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Trésorerie & Finances
 * Couvre à la fois la vue membre (Cotisations, cautions, notes de frais)
 * et la vue gestionnaire (Trésorerie, Comptabilité, Bureau).
 */
export const treasuryGuide = {
  id: "treasury",
  poleName: {
    fr: "Trésorerie & Finances",
    pt: "Tesouraria & Finanças"
  },
  titre: "💰 Pôle Trésorerie & Finances",
  title: "💰 Pôle Trésorerie & Finances",
  description: "Pilotez la santé financière de l'association, contrôlez la rentabilité des événements et enregistrez les opérations comptables.",
  etapes: [
    "Vérifiez l'état des cotisations et relancez les adhérents en retard.",
    "Saisissez les recettes et dépenses courantes dans le journal des opérations.",
    "Examinez et remboursez les notes de frais kilométriques soumises.",
    "Générez les bilans et exports comptables pour l'assemblée générale."
  ],
  steps: [
    "Vérifiez l'état des cotisations et relancez les adhérents en retard.",
    "Saisissez les recettes et dépenses courantes dans le journal des opérations.",
    "Examinez et remboursez les notes de frais kilométriques soumises.",
    "Générez les bilans et exports comptables pour l'assemblée générale."
  ],

  // ==========================================
  // 1. VUE MEMBRE (Cotisations, cautions, notes de frais)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Suivre mes cotisations et mes remboursements",
      pt: "Acompanhar mensalidades e reembolsos"
    },
    summary: {
      fr: "Consulte le statut de ton adhésion, vérifie tes cautions d'instruments et dépose tes demandes de remboursement.",
      pt: "Consulte a situação da sua anuidade, verifique seus cheques de caução e envie comprovantes de despesas."
    },
    sections: [
      {
        heading: {
          fr: "1. Mon adhésion & mes formules",
          pt: "1. Minha anuidade e opções"
        },
        text: {
          fr: "Vérifie le récapitulatif de tes options (adhésion de base, ateliers percussion ou danse). Si ton règlement est en attente, clique sur le lien pour régulariser via la passerelle en ligne.",
          pt: "Confira o resumo das suas opções (adesão básica, oficinas de percussão ou dança). Se o pagamento estiver pendente, utilize o link de pagamento para regularizar sua situação."
        }
      },
      {
        heading: {
          fr: "2. Suivi de ma caution d'instrument",
          pt: "2. Caução de instrumentos"
        },
        text: {
          fr: "Si un instrument du parc te t'est confié pour la saison, contrôle si ton chèque de caution a bien été réceptionné par le trésorier (statut « Reçue »).",
          pt: "Caso utilize um instrumento da associação nesta temporada, verifique se o seu cheque ou comprovante de caução já foi validado pela tesouraria (status « Recebida »)."
        }
      },
      {
        heading: {
          fr: "3. Déclarer un achat ou une note de frais",
          pt: "3. Solicitar reembolso de despesas"
        },
        text: {
          fr: "Tu as avancé un achat pour la troupe (peaux, quincaillerie, tissu, courses régie) ? Renseigne le montant, sélectionne ta facture ou ton ticket en photo/PDF et choisis entre virement direct ou report en avoir sur ta future cotisation.",
          pt: "Fez compras para a trupe (peles, ferragens, tecidos, lanches de ensaio)? Informe o valor, anexe a foto ou PDF do comprovante e escolha entre transferência bancária direta ou crédito para sua próxima anuidade."
        }
      },
      {
        heading: {
          fr: "4. Défraiements kilométriques de covoiturage",
          pt: "4. Ajuda de custo e quilometragem"
        },
        text: {
          fr: "Retrouve le calcul automatique de tes trajets lors des concerts où tu as conduit, et consulte l'état de validation de tes dédommagements.",
          pt: "Acompanhe o cálculo automático de quilometragem dos shows em que você dirigiu e consulte a liberação do seu reembolso."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Trésorerie, Comptabilité, Bureau)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Piloter la comptabilité et la santé financière",
      pt: "Gerenciar a contabilidade e o fluxo financeiro"
    },
    roleBadge: {
      fr: "Trésorerie • Comptabilité • Bureau",
      pt: "Tesouraria • Contabilidade • Diretoria"
    },
    summary: {
      fr: "Supervision des comptes bancaires, pointage des encaissements, liquidation des notes de frais et clôture du Grand Livre.",
      pt: "Controle das contas bancárias, conciliação de pagamentos, liquidação de despesas e fechamento do livro-caixa."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Position de trésorerie & soldes bancaires",
          pt: "Posição de caixa e saldos bancários"
        },
        desc: {
          fr: "Consulte le tableau de bord financier. Ajuste périodiquement les soldes réels des comptes (Compte courant, Livret, Caisse liquide) et surveille la projection d'impact du bilan d'exploitation.",
          pt: "Acesse o painel financeiro. Atualize periodicamente os saldos reais das contas (Conta corrente, Poupança, Caixa físico) e acompanhe a projeção do resultado operacional."
        }
      },
      {
        step: 2,
        title: {
          fr: "Pointage des cotisations et des cautions",
          pt: "Controle de mensalidades e cauções"
        },
        desc: {
          fr: "Dans l'onglet Cotisations, vérifie qui est à jour, gère les exonérations (Mestre, intervenants) et pointe la réception des chèques de caution rattachés aux instruments du parc.",
          pt: "Na aba Mensalidades, acompanhe os pagamentos, registre as isenções (Mestre, oficineiros) e confirme o recebimento dos cheques de caução vinculados aos instrumentos emprestados."
        }
      },
      {
        step: 3,
        title: {
          fr: "Budgets des prestations et sorties",
          pt: "Finanças de apresentações e eventos"
        },
        desc: {
          fr: "Dans l'onglet Événements, saisis les cachets nets perçus, les frais de déplacement et la restauration engagée pour mesurer la rentabilité réelle de chaque date.",
          pt: "Na aba Eventos, lance os cachês recebidos, custos de transporte e alimentação para calcular o resultado líquido de cada apresentação."
        }
      },
      {
        step: 4,
        title: {
          fr: "Opérations diverses & écritures courantes",
          pt: "Operações diversas e despesas correntes"
        },
        desc: {
          fr: "Enregistre au fil de l'eau les recettes et dépenses de fonctionnement (loyer, assurances, fournitures) avec leurs pièces justificatives et catégories personnalisées.",
          pt: "Registre as receitas e despesas cotidianas da associação (aluguel, seguros, materiais) com anexos comprobatórios e categorias personalizadas."
        }
      },
      {
        step: 5,
        title: {
          fr: "Liquidation des notes de frais & remboursements",
          pt: "Validação de reembolsos e notas de despesas"
        },
        desc: {
          fr: "Dans l'onglet Frais, audite les tickets soumis par les adhérents. Valide la dépense, copie l'IBAN d'un clic pour émettre le virement, puis marque comme « Remboursé » pour générer automatiquement l'écriture comptable.",
          pt: "Na aba Despesas, analise os comprovantes enviados pelos integrantes. Aprove a despesa, copie o código bancário/PIX para realizar a transferência e marque como « Reembolsado » para lançar o débito automaticamente."
        }
      },
      {
        step: 6,
        title: {
          fr: "Clôture d'exercice & exports comptables",
          pt: "Fechamento de exercício e relatórios"
        },
        desc: {
          fr: "Dans l'onglet Exports, filtre par saison associative et génère en un clic le Grand Livre et le Bilan au format CSV/Excel pour l'Assemblée Générale ou l'expert-comptable.",
          pt: "Na aba Relatórios, selecione a temporada e gere com um clique o balanço consolidado em CSV/Excel para a Assembleia Geral e prestação de contas."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_pointage_cotisations_cautions", label: { fr: "Pointer cotisations et cautions", pt: "Controlar mensalidades e cauções" } },
      { id: "tuto_gestion_notes_de_frais", label: { fr: "Valider et rembourser une note de frais", pt: "Aprovar e liquidar notas de despesas" } },
      { id: "tuto_cloture_export_comptable", label: { fr: "Générer les exports pour l'AG", pt: "Gerar relatórios contábeis para a AG" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Secrétariat & Vie Statutaire
 * Couvre à la fois la vue membre (Documents légaux, coordonnées, attestations)
 * et la vue gestionnaire (Secrétariat, Bureau, CA).
 */
export const secretariatGuide = {
  id: "secretariat",
  poleName: {
    fr: "Secrétariat & Vie Statutaire",
    pt: "Secretaria & Vida Institucional"
  },
  titre: "🏛️ Pôle Secrétariat & Administration",
  title: "🏛️ Pôle Secrétariat & Administration",
  description: "Centre névralgique de la vie associative, de la gestion des membres, du registre des dates et des obligations légales.",
  etapes: [
    "Gérer l'annuaire des membres et les pièces justificatives.",
    "Tenir le registre des dates et convoquer la troupe.",
    "Organiser les assemblées générales et éditer les bilans d'activité."
  ],
  steps: [
    "Gérer l'annuaire des membres et les pièces justificatives.",
    "Tenir le registre des dates et convoquer la troupe.",
    "Organiser les assemblées générales et éditer les bilans d'activité."
  ],

  // ==========================================
  // 1. VUE MEMBRE (Documents légaux, coordonnées, attestations)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Consulter ses documents administratifs et son statut",
      pt: "Consultar documentos administrativos e cadastro"
    },
    summary: {
      fr: "Accède aux statuts officiels du groupe, télécharge tes attestations et contrôle tes paramètres de confidentialité.",
      pt: "Acesse o estatuto da associação, baixe declarações de filiação e configure sua privacidade."
    },
    sections: [
      {
        heading: {
          fr: "1. Documents officiels & Statuts",
          pt: "1. Documentos oficiais & Estatuto"
        },
        text: {
          fr: "Retrouve sur le Varal Administratif les statuts à jour de l'association, le règlement intérieur et les chartes d'engagement votées en Assemblée Générale.",
          pt: "Acesse no Varal Administrativo o estatuto social atualizado, o regimento interno e os termos de compromisso aprovados em assembleia."
        }
      },
      {
        heading: {
          fr: "2. Attestation d'adhésion & Justificatifs",
          pt: "2. Declaração de filiação & Comprovantes"
        },
        text: {
          fr: "Télécharge directement ton attestation annuelle d'adhésion pour ton comité d'entreprise (CSE), ta mutuelle ou tes dossiers d'aides aux activités culturelles.",
          pt: "Baixe diretamente sua declaração oficial de membro para comprovação em empresas, convênios ou benefícios culturais."
        }
      },
      {
        heading: {
          fr: "3. Confidentialité & Droit à l'image",
          pt: "3. Privacidade & Direito de imagem"
        },
        text: {
          fr: "Vérifie tes choix de visibilité dans l'annuaire de la troupe (masquage du téléphone ou de la date de naissance) et tes consentements légaux (droit à l'image, santé).",
          pt: "Verifique suas preferências de visibilidade na lista da trupe (ocultar telefone ou data de nascimento) e suas autorizações legais (direito de imagem e atestado)."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Secrétariat, Bureau, CA)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Tenir le registre, les actes officiels et les bilans d'AG",
      pt: "Administrar o livro de registros, atas e relatórios da AG"
    },
    roleBadge: {
      fr: "Secrétariat • Bureau • Conseil d'Administration",
      pt: "Secretaria • Diretoria • Conselho"
    },
    summary: {
      fr: "Gestion des inscriptions, tenue du registre légal des adhérents, archivage des actes officiels et consolidation des bilans annuels.",
      pt: "Gestão de adesões, controle do livro de membros, arquivamento de documentos legais e consolidação de relatórios anuais."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Validation des inscriptions & attribution des rôles",
          pt: "Validação de cadastros e atribuição de funções"
        },
        desc: {
          fr: "Dans l'Annuaire, audite les nouveaux profils inscrits. Valide leur dossier, affecte leur pupitre d'instrument ou section danse, et attribue les badges statutaires.",
          pt: "Na lista de integrantes, confira os novos inscritos. Valide o cadastro, defina o naipe de instrumento ou ala de dança e atribua os crachás oficiais."
        }
      },
      {
        step: 2,
        title: {
          fr: "Tenue du registre légal & exports préfectoraux",
          pt: "Livro de registro legal e exportação de dados"
        },
        desc: {
          fr: "Consulte le listing des adhérents en accordéon pliable. Exporte à tout moment l'annuaire au format CSV/Excel pour les déclarations en préfecture, assurances ou mairies.",
          pt: "Acompanhe a lista oficial em acordeão retrátil. Exporte os dados em CSV/Excel para declarações em órgãos públicos, seguros ou prefeituras."
        }
      },
      {
        step: 3,
        title: {
          fr: "Classeur juridique & Varal administratif",
          pt: "Arquivo jurídico e Varal administrativo"
        },
        desc: {
          fr: "Dépose et classe les statuts constitutifs, récépissés de préfecture, polices d'assurance et procès-verbaux de réunions avec filtrage des accès par badge.",
          pt: "Publique e organize estatutos, certidões públicas, apólices de seguro e atas de reuniões, controlando a visibilidade de cada documento por crachá."
        }
      },
      {
        step: 4,
        title: {
          fr: "Registre des dates & programmation",
          pt: "Registro de datas e programação rápida"
        },
        desc: {
          fr: "Supervise la grille globale des dates (répétitions, prestations, réunions). Ajuste rapidement les formats et active les modules requis (covoiturage, validation).",
          pt: "Monitore o cronograma geral de datas (ensaios, apresentações, reuniões). Ajuste os formatos e ative os módulos necessários (caronas, confirmações)."
        }
      },
      {
        step: 5,
        title: {
          fr: "Rapports d'activité, Bilan Cerfa & Diaporama AG",
          pt: "Relatórios de atividade, Balanço oficial & Projeção da AG"
        },
        desc: {
          fr: "Dans « Rapports & Bilan AG », consulte l'ancrage communal, le cumul des heures de bénévolat (norme Cerfa) et lance la présentation plein écran prête pour l'AG.",
          pt: "Em « Relatórios & Balanço », monitore o impacto territorial, o total de horas de voluntariado e inicie os slides em tela cheia para a Assembleia Geral."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_gestion_annuaire_exports", label: { fr: "Valider les membres et exporter l'annuaire", pt: "Validar membros e exportar listagens" } },
      { id: "tuto_bilans_cerfa_presentation_ag", label: { fr: "Générer le Cerfa et projeter l'AG", pt: "Gerar balanço oficial e apresentar a AG" } }
    ]
  }
};

/**
 * Guide complet bilingue (FR / PT-BR) : Studio & Communication
 * Couvre à la fois la vue membre (Photos, souvenirs, gazette)
 * et la vue gestionnaire (Com', Presse, Webmaster).
 */
export const studioGuide = {
  id: "studio",
  poleName: {
    fr: "Studio & Communication",
    pt: "Studio & Comunicação"
  },
  titre: "📱 Pôle Studio & Communication",
  title: "📱 Pôle Studio & Communication",
  description: "Animation de la vitrine médiatique, sélection des albums publics, diffusion sur les réseaux et campagnes d'information.",
  etapes: [
    "Sélectionne les meilleurs clichés déposés par la troupe ou le photographe officiel, ordonne la grille et active la publication vers la Vitrine publique.",
    "Configure les liens vers les pages officielles (Instagram, Facebook, YouTube) et prépare les textes d'annonces de concerts ou d'ateliers.",
    "Gère les listes de diffusion des abonnés à la newsletter, rédige les communications officielles et synchronise les contacts avec l'outil d'envoi.",
    "Maintiens à jour les visuels haute définition, le communiqué de presse standard et les logos vectoriels téléchargeables pour les journalistes."
  ],
  steps: [
    "Sélectionne les meilleurs clichés déposés par la troupe ou le photographe officiel, ordonne la grille et active la publication vers la Vitrine publique.",
    "Configure les liens vers les pages officielles (Instagram, Facebook, YouTube) et prépare les textes d'annonces de concerts ou d'ateliers.",
    "Gère les listes de diffusion des abonnés à la newsletter, rédige les communications officielles et synchronise les contacts avec l'outil d'envoi.",
    "Maintiens à jour les visuels haute définition, le communiqué de presse standard et les logos vectoriels téléchargeables pour les journalistes."
  ],

  // ==========================================
  // 1. VUE MEMBRE (Photos, souvenirs, gazette)
  // ==========================================
  memberGuide: {
    title: {
      fr: "Retrouver les souvenirs et suivre les actus de la troupe",
      pt: "Acessar as lembranças e acompanhar as novidades da trupe"
    },
    summary: {
      fr: "Consulte les albums photo des concerts, télécharge les gazettes associatives et partage tes propres clichés.",
      pt: "Acesse as fotos das apresentações, baixe os boletins da associação e envie suas próprias fotos."
    },
    sections: [
      {
        heading: {
          fr: "1. La Galerie photo & les souvenirs",
          pt: "1. Galeria de fotos & lembranças"
        },
        text: {
          fr: "Parcours les albums des dernières prestations sur le Varal Photo. Tu peux visualiser et télécharger les clichés officiels en haute résolution.",
          pt: "Navegue pelos álbuns das últimas apresentações no Varal de Fotos. Você pode visualizar e baixar as fotos oficiais em alta resolução."
        }
      },
      {
        heading: {
          fr: "2. La Gazette et les infolettres",
          pt: "2. O Boletim e as notícias"
        },
        text: {
          fr: "Retrouve les archives des lettres d'information envoyées au public et aux adhérents pour rester informé des grands projets du groupe.",
          pt: "Acesse os boletins e informativos enviados ao público e aos integrantes para acompanhar os projetos da trupe."
        }
      },
      {
        heading: {
          fr: "3. Dépôt express de photos et vidéos",
          pt: "3. Envio rápido de fotos e vídeos"
        },
        text: {
          fr: "Après une sortie, utilise le module ou le QR code dédié de l'événement pour déposer facilement tes vidéos et clichés de scène à destination de la commission communication.",
          pt: "Após uma apresentação, utilize o leitor ou QR code do evento para enviar facilmente suas fotos e vídeos direto para a equipe de comunicação."
        }
      }
    ]
  },

  // ==========================================
  // 2. VUE GESTIONNAIRE (Com', Presse, Webmaster)
  // ==========================================
  managerGuide: {
    title: {
      fr: "Piloter la communication externe, les médias et les newsletters",
      pt: "Gerenciar a comunicação externa, mídias e boletins"
    },
    roleBadge: {
      fr: "Communication • Relations Presse • Webmaster",
      pt: "Comunicação • Assessoria de Imprensa • Webmaster"
    },
    summary: {
      fr: "Animation de la vitrine médiatique, sélection des albums publics, diffusion sur les réseaux et campagnes d'information.",
      pt: "Gestão dos canais públicos, curadoria de fotos, publicações em redes sociais e campanhas de e-mail."
    },
    workflowSteps: [
      {
        step: 1,
        title: {
          fr: "Curatelle et publication des albums photo",
          pt: "Curadoria e publicação de álbuns de fotos"
        },
        desc: {
          fr: "Sélectionne les meilleurs clichés déposés par la troupe ou le photographe officiel, ordonne la grille et active la publication vers la Vitrine publique.",
          pt: "Selecione as melhores fotos enviadas pelo grupo ou fotógrafo oficial, organize a ordem de exibição e publique no site público."
        }
      },
      {
        step: 2,
        title: {
          fr: "Animation des réseaux sociaux & passerelles",
          pt: "Gestão de redes sociais e canais oficiais"
        },
        desc: {
          fr: "Configure les liens vers les pages officielles (Instagram, Facebook, YouTube) et prépare les textes d'annonces de concerts ou d'ateliers.",
          pt: "Atualize os links oficiais (Instagram, Facebook, YouTube) e estruture as chamadas de divulgação para shows e oficinas."
        }
      },
      {
        step: 3,
        title: {
          fr: "Campagnes emailing & synchronisation Brevo",
          pt: "Campanhas de e-mail e integração Brevo"
        },
        desc: {
          fr: "Gère les listes de diffusion des abonnés à la newsletter, rédige les communications officielles et synchronise les contacts avec l'outil d'envoi.",
          pt: "Gerencie a lista de contatos da newsletter, elabore os communicados oficiais e sincronize as inscrições com a ferramenta de disparo."
        }
      },
      {
        step: 4,
        title: {
          fr: "Espace Presse & kit média",
          pt: "Espaço de Imprensa e kit de mídia"
        },
        desc: {
          fr: "Maintiens à jour les visuels haute définition, le communiqué de presse standard et les logos vectoriels téléchargeables pour les journalistes.",
          pt: "Mantenha atualizadas as imagens em alta resolução, o release oficial e os logotipos para os veículos de imprensa."
        }
      }
    ],
    videoTutorials: [
      { id: "tuto_gestion_galerie_vitrine", label: { fr: "Gérer la galerie et les photos publiques", pt: "Gerenciar a galeria e fotos públicas" } },
      { id: "tuto_campagne_newsletter_brevo", label: { fr: "Préparer une newsletter et synchroniser Brevo", pt: "Preparar boletim e sincronizar com o Brevo" } }
    ]
  }
};

export const POLE_GUIDES = {
  agenda: agendaGuide,
  pedagogy: pedagogyGuide,
  pedagogie: pedagogyGuide,
  repertoire: pedagogyGuide,
  logistics: logisticsGuide,
  logistique: logisticsGuide,
  forum: forumGuide,
  'porte-voix': forumGuide,
  treasury: treasuryGuide,
  tresorerie: treasuryGuide,
  secretariat: secretariatGuide,
  studio: studioGuide,
  communication: studioGuide,
  // ==========================================
  // PÔLE GOUVERNANCE & CONSEIL D'ADMINISTRATION
  // ==========================================
  gouvernance: {
    titre: "🏛️ Pôle Gouvernance & Conseil d'Administration",
    title: "🏛️ Pôle Gouvernance & Conseil d'Administration",
    description: "Espace délibératif et de pilotage stratégique dédié aux élus du Conseil d'Administration et aux membres du Bureau.",
    etapes: [
      "Convoquez les réunions de CA et d'AG, préparez les ordres du jour et rédigez les procès-verbaux.",
      "Consolidez les bilans moraux, financiers et artistiques en vue de l'Assemblée Générale.",
      "Consultez les statuts, règlements intérieurs et documents officiels de l'association.",
      "Supervisez la santé financière globale et le solde des comptes sans encombrement opérationnel.",
      "Suivez les contrats et engagements de prestations négociés pour la troupe."
    ],
    steps: [
      "Convoquez les réunions de CA et d'AG, préparez les ordres du jour et rédigez les procès-verbaux.",
      "Consolidez les bilans moraux, financiers et artistiques en vue de l'Assemblée Générale.",
      "Consultez les statuts, règlements intérieurs et documents officiels de l'association.",
      "Supervisez la santé financière globale et le solde des comptes sans encombrement opérationnel.",
      "Suivez les contrats et engagements de prestations négociés pour la troupe."
    ]
  },
  'ca-reunions': {
    titre: "📝 Réunions, Ordres du Jour & Procès-Verbaux",
    title: "📝 Réunions, Ordres du Jour & Procès-Verbaux",
    description: "Planifiez les séances du CA, préparez les ordres du jour, enregistrez les émargements et archivez les délibérations votées.",
    etapes: [
      "Créez une nouvelle séance (CA, Bureau restreint, AG Ordinaire ou Extraordinaire).",
      "Ajoutez les points à l'ordre du jour et invitez les administrateurs concernés.",
      "Saisissez les débats, décisions prises et résultats des votes en séance.",
      "Exportez et signez le procès-verbal officiel pour archivage statutaire."
    ],
    steps: [
      "Créez une nouvelle séance (CA, Bureau restreint, AG Ordinaire ou Extraordinaire).",
      "Ajoutez les points à l'ordre du jour et invitez les administrateurs concernés.",
      "Saisissez les débats, décisions prises et résultats des votes en séance.",
      "Exportez et signez le procès-verbal officiel pour archivage statutaire."
    ]
  },
  'ca-reports': {
    titre: "📊 Bilans Consolidés & Rapports pour l'AG",
    title: "📊 Bilans Consolidés & Rapports pour l'AG",
    description: "Consolidez les indicateurs clés de la saison (moraux, artistiques, financiers, logistiques) pour présenter une synthèse limpide à l'Assemblée Générale.",
    etapes: [
      "Passez en revue les indicateurs consolidés d'adhésions, de répétitions et de concerts.",
      "Rédigez le rapport moral du Président et le rapport d'activité annuel.",
      "Vérifiez l'alignement des chiffres financiers avec le rapport du Trésorier.",
      "Exportez le document de synthèse destiné à être voté par les adhérents en AG."
    ],
    steps: [
      "Passez en revue les indicateurs consolidés d'adhésions, de répétitions et de concerts.",
      "Rédigez le rapport moral du Président et le rapport d'activité annuel.",
      "Vérifiez l'alignement des chiffres financiers avec le rapport du Trésorier.",
      "Exportez le document de synthèse destiné à être voté par les adhérents en AG."
    ]
  },
  'ca-documents': {
    titre: "📂 Registre Statutaire, Statuts & Documents Officiels",
    title: "📂 Registre Statutaire, Statuts & Documents Officiels",
    description: "Consultez et déposez les documents juridiques fondamentaux de l'association : statuts déposés, règlement intérieur, attestations d'assurance et récépissés de préfecture.",
    etapes: [
      "Consultez les versions en vigueur des statuts et du règlement intérieur.",
      "Vérifiez la validité des polices d'assurance Responsabilité Civile et des licences.",
      "Déposez les comptes-rendus officiels et avenants adoptés en assemblée générale."
    ],
    steps: [
      "Consultez les versions en vigueur des statuts et du règlement intérieur.",
      "Vérifiez la validité des polices d'assurance Responsabilité Civile et des licences.",
      "Déposez les comptes-rendus officiels et avenants adoptés en assemblée générale."
    ]
  },
  'ca-finances': {
    titre: "🪙 Synthèse Financière & Santé Budgétaire",
    title: "🪙 Synthèse Financière & Santé Budgétaire",
    description: "Vue synthétique de haut niveau sur la trésorerie de l'association, la répartition des charges, les soldes bancaires et le budget prévisionnel.",
    etapes: [
      "Consultez les soldes bancaires consolidés et l'état de la trésorerie disponible.",
      "Analysez la ventilation des dépenses et recettes de la saison en cours.",
      "Vérifiez le respect des grandes orientations budgétaires décidées par le Conseil."
    ],
    steps: [
      "Consultez les soldes bancaires consolidés et l'état de la trésorerie disponible.",
      "Analysez la ventilation des dépenses et recettes de la saison en cours.",
      "Vérifiez le respect des grandes orientations budgétaires décidées par le Conseil."
    ]
  },
  'ca-prestations': {
    titre: "🎷 Dates & Engagements Stratégiques de la Troupe",
    title: "🎷 Dates & Engagements Stratégiques de la Troupe",
    description: "Supervisez le carnet de dates, les devis émis, les options retenues et les engagements contractuels pris au nom de l'association.",
    etapes: [
      "Consultez le calendrier des prestations confirmées et en cours de négociation.",
      "Examinez les devis et propositions financières engagées avec les organisateurs.",
      "Assurez-vous de la faisabilité logistique et humaine des engagements de la troupe."
    ],
    steps: [
      "Consultez le calendrier des prestations confirmées et en cours de négociation.",
      "Examinez les devis et propositions financières engagées avec les organisateurs.",
      "Assurez-vous de la faisabilité logistique et humaine des engagements de la troupe."
    ]
  },

  // ==========================================
  // 1. PÔLE TRÉSORERIE & FINANCES
  // ==========================================
  // Pôle Trésorerie & Finances (résolu via treasuryGuide Double Vue)
  'dashboard-finance': {
    titre: "📊 Synthèse & Bilan Financier",
    title: "📊 Synthèse & Bilan Financier",
    description: "Aperçu global de la trésorerie, suivi des coordonnées bancaires officielles et répartition des flux budgétaires.",
    etapes: [
      "Consultez les soldes totaux et les coordonnées bancaires (IBAN/BIC) de l'association.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'exercice."
    ],
    steps: [
      "Consultez les soldes totaux et les coordonnées bancaires (IBAN/BIC) de l'association.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'exercice."
    ]
  },
  cotisations: {
    titre: "💳 Gestion des Cotisations Adhérents",
    title: "💳 Gestion des Cotisations Adhérents",
    description: "Suivez les règlements d'adhésion annuelle, configurez les formules tarifaires et organisez les relances.",
    etapes: [
      "Configurez les formules d'adhésion et tarifs annuels applicables aux membres.",
      "Filtrez la liste des adhérents pour repérer les règlements en attente ou partiels.",
      "Enregistrez les paiements perçus et émettez les reçus de cotisation."
    ],
    steps: [
      "Configurez les formules d'adhésion et tarifs annuels applicables aux membres.",
      "Filtrez la liste des adhérents pour repérer les règlements en attente ou partiels.",
      "Enregistrez les paiements perçus et émettez les reçus de cotisation."
    ]
  },
  'events-finances': {
    titre: "🎟️ Comptabilité Analytique des Prestations",
    title: "🎟️ Comptabilité Analytique des Prestations",
    description: "Suivi budgétaire dédié aux concerts, stages et événements pour calculer leur rentabilité nette.",
    etapes: [
      "Sélectionnez la prestation ou l'événement concerné dans la liste.",
      "Associez les contrats, devis signés, factures d'engagement et billetterie.",
      "Validez le bilan financier de la prestation une fois clôturée."
    ],
    steps: [
      "Sélectionnez la prestation ou l'événement concerné dans la liste.",
      "Associez les contrats, devis signés, factures d'engagement et billetterie.",
      "Validez le bilan financier de la prestation une fois clôturée."
    ]
  },
  'operations-diverses': {
    titre: "📝 Journal des Opérations Courantes",
    title: "📝 Journal des Opérations Courantes",
    description: "Saisie au fil de l'eau des entrées et sorties d'argent liées au fonctionnement de la troupe.",
    etapes: [
      "Cliquez sur « Nouvelle Opération » pour saisir une recette ou une dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse, reçu)."
    ],
    steps: [
      "Cliquez sur « Nouvelle Opération » pour saisir une recette ou une dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse, reçu)."
    ]
  },
  'frais-km': {
    titre: "🚗 Notes de Frais & Kilométrage",
    title: "🚗 Notes de Frais & Kilométrage",
    description: "Validation des déclarations de frais de déplacement et abandons de frais au titre du bénévolat.",
    etapes: [
      "Examinez les déclarations de trajet soumises par les adhérents.",
      "Vérifiez le barème kilométrique officiel et les justificatifs de péage.",
      "Approuvez pour virement bancaire ou comptabilisez en don bénévole."
    ],
    steps: [
      "Examinez les déclarations de trajet soumises par les adhérents.",
      "Vérifiez le barème kilométrique officiel et les justificatifs de péage.",
      "Approuvez pour virement bancaire ou comptabilisez en don bénévole."
    ]
  },
  'reports-exports': {
    titre: "📈 Rapports Comptables & Exports AG",
    title: "📈 Rapports Comptables & Exports AG",
    description: "Génération des états comptables synthétiques requis pour l'Assemblée Générale et les partenaires.",
    etapes: [
      "Sélectionnez l'exercice comptable à clôturer ou analyser.",
      "Générez le compte de résultat et le bilan financier officiel.",
      "Exportez les données au format PDF ou CSV pour le bureau et la banque."
    ],
    steps: [
      "Sélectionnez l'exercice comptable à clôturer ou analyser.",
      "Générez le compte de résultat et le bilan financier officiel.",
      "Exportez les données au format PDF ou CSV pour le bureau et la banque."
    ]
  },

  // ==========================================
  // 2. PÔLE SECRÉTARIAT & ADMINISTRATION
  // ==========================================
  // Pôle Secrétariat & Administration (résolu via secretariatGuide Double Vue)
  'export-annu': {
    titre: "📄 Annuaire Adhérents & Exports Administratifs",
    title: "📄 Annuaire Adhérents & Exports Administratifs",
    description: "Fichier central des fiches membres avec outils d'exportation pour l'administration et la préfecture.",
    etapes: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et statuts d'adhésion.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités administratives."
    ],
    steps: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et statuts d'adhésion.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités administratives."
    ]
  },
  'studio-events': {
    titre: "📅 Registre des Dates & Convocations",
    title: "📅 Registre des Dates & Convocations",
    description: "Planification globale des répétitions, concerts, stages et suivi des convocations.",
    etapes: [
      "Programmez un nouvel événement avec lieu, horaires et consignes d'organisation.",
      "Supervisez le pointage des présences et inscriptions des membres.",
      "Envoyez les rappels de convocation et notifications à la troupe."
    ],
    steps: [
      "Programmez un nouvel événement avec lieu, horaires et consignes d'organisation.",
      "Supervisez le pointage des présences et inscriptions des membres.",
      "Envoyez les rappels de convocation et notifications à la troupe."
    ]
  },
  'reunion-manager': {
    titre: "📋 Gestion des Réunions & Compte-Rendus",
    title: "📋 Gestion des Réunions & Compte-Rendus",
    description: "Ordres du jour, prise de notes en séance et archivage des procès-verbaux de Conseil et d'AG.",
    etapes: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes en direct.",
      "Publiez le procès-verbal officiel validé à destination des administrateurs."
    ],
    steps: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes en direct.",
      "Publiez le procès-verbal officiel validé à destination des administrateurs."
    ]
  },
  'varal-secretariat': {
    titre: "🗂️ Documents Officiels & Procès-Verbaux",
    title: "🗂️ Documents Officiels & Procès-Verbaux",
    description: "Classement étanche des actes administratifs permanents et des comptes-rendus de réunions.",
    etapes: [
      "Consulter et mettre à jour les statuts et assurances",
      "Archiver les procès-verbaux d'assemblée générale",
      "Télécharger les pièces justificatives officielles"
    ],
    targets: [
      "sec-docs-permanent-table",
      "sec-docs-reunions-table"
    ],
    steps: [
      "Consulter et mettre à jour les statuts et assurances",
      "Archiver les procès-verbaux d'assemblée générale",
      "Télécharger les pièces justificatives officielles"
    ]
  },
  'activity-reports': {
    titre: "📊 Journal d'Activité (CSV)",
    title: "📊 Journal d'Activité (CSV)",
    description: "Extraction CSV des dates, sorties, répétitions et registres de présence sur une période personnalisée.",
    etapes: [
      "Définissez l'intervalle de dates pour votre analyse.",
      "Cochez les types d'événements à inclure (prestations, répétitions, stages, réunions).",
      "Générez et téléchargez le fichier CSV tableur formaté pour Excel."
    ],
    steps: [
      "Définissez l'intervalle de dates pour votre analyse.",
      "Cochez les types d'événements à inclure (prestations, répétitions, stages, réunions).",
      "Générez et téléchargez le fichier CSV tableur formaté pour Excel."
    ]
  },
  'secretariat-reports': {
    titre: "📊 Rapports & Bilan d'Assemblée Générale",
    title: "📊 Rapports & Bilan d'Assemblée Générale",
    description: "Consolidation des indicateurs de la saison (adhérents, pupitres, sorties, ateliers, finances) pour l'AG et les dossiers de subvention.",
    etapes: [
      "Sélectionnez la saison de référence ou définissez les dates libres d'analyse.",
      "Consultez les 4 blocs consolidés (Vie associative, Scène, Ateliers, Finances).",
      "Exportez la synthèse au format CSV tableur ou imprimez le rapport officiel."
    ],
    targets: [
      "reports-period-selector",
      "reports-blocks-grid",
      "reports-export-actions"
    ],
    steps: [
      "Sélectionnez la saison de référence ou définissez les dates libres d'analyse.",
      "Consultez les 4 blocs consolidés (Vie associative, Scène, Ateliers, Finances).",
      "Exportez la synthèse au format CSV tableur ou imprimez le rapport officiel."
    ]
  },

  // ==========================================
  // 3. PÔLE LOGISTIQUE & MATÉRIEL
  // ==========================================
  // Pôle Logistique & Matériel (résolu via logisticsGuide Double Vue)
  inventory: {
    titre: "🛠️ Inventaire Général du Parc Matériel",
    title: "🛠️ Inventaire Général du Parc Matériel",
    description: "Registre exhaustif des instruments, housses, pieds et accessoires appartenant à l'association.",
    etapes: [
      "Consultez l'état matériel de chaque équipement (En service, Maintenance, HS).",
      "Affectez un instrument à un adhérent ou à un lieu de stockage.",
      "Renseignez les numéros de série et photographies d'identification."
    ],
    targets: [
      "inventory-filter-bar",
      "inventory-table-view",
      "inventory-add-btn"
    ],
    steps: [
      "Consultez l'état matériel de chaque équipement (En service, Maintenance, HS).",
      "Affectez un instrument à un adhérent ou à un lieu de stockage.",
      "Renseignez les numéros de série et photographies d'identification."
    ]
  },
  'logistics-kits': {
    titre: "🧰 Malles Régie, Trousses & Consommables",
    title: "🧰 Malles Régie, Trousses & Consommables",
    description: "Composition des trousses de secours, malles de maquillage et caisses d'outillage live à charger dans les convois.",
    etapes: [
      "Vérifier la complétion de chaque malle régie",
      "Pointer les consommables en rupture à racheter",
      "Connecter l'état des trousses à la feuille de route"
    ],
    targets: [
      "kits-grid",
      "kits-status-badge",
      "kits-add-btn"
    ],
    steps: [
      "Vérifier la complétion de chaque malle régie",
      "Pointer les consommables en rupture à racheter",
      "Connecter l'état des trousses à la feuille de route"
    ]
  },
  'logistics-carpool': {
    titre: "🚗 Covoiturage, Convois & Véhicules",
    title: "🚗 Covoiturage, Convois & Véhicules",
    description: "Organisation des déplacements, gestion des véhicules transporteurs, capacités de coffre et frais de route.",
    etapes: [
      "Déclarez les véhicules disponibles et leur capacité d'emport d'instruments.",
      "Organisez les convois pour acheminer le matériel lors des concerts.",
      "Contrôlez les demandes de remboursement et l'application du barème kilométrique."
    ],
    steps: [
      "Déclarez les véhicules disponibles et leur capacité d'emport d'instruments.",
      "Organisez les convois pour acheminer le matériel lors des concerts.",
      "Contrôlez les demandes de remboursement et l'application du barème kilométrique."
    ]
  },
  orders: {
    titre: "🛒 Commandes & Achats Matériel",
    title: "🛒 Commandes & Achats Matériel",
    description: "Centralisation des demandes d'achat et suivi des livraisons de consommables auprès des fournisseurs.",
    etapes: [
      "Créez une nouvelle demande d'approvisionnement matériel.",
      "Suivez les devis et la validation budgétaire par le bureau.",
      "Validez la réception à la livraison pour incrémenter le stock."
    ],
    steps: [
      "Créez une nouvelle demande d'approvisionnement matériel.",
      "Suivez les devis et la validation budgétaire par le bureau.",
      "Validez la réception à la livraison pour incrémenter le stock."
    ]
  },

  // ==========================================
  // 4. PÔLE LUTHERIE & ARTISANAT INSTRUMENTAL
  // ==========================================
  lutherie: {
    titre: "🎻 Pôle Lutherie & Artisanat Instrumental",
    title: "🎻 Pôle Lutherie & Artisanat Instrumental",
    description: "Atelier de fabrication, de maintenance et de traçabilité du parc d'instruments de l'association.",
    etapes: [
      "Consulter les modèles et plans de fabrication.",
      "Usiner les pièces détachées et renseigner les fiches suiveuses.",
      "Assembler les instruments sur l'établi et procéder au baptême."
    ],
    steps: [
      "Consulter les modèles et plans de fabrication.",
      "Usiner les pièces détachées et renseigner les fiches suiveuses.",
      "Assembler les instruments sur l'établi et procéder au baptême."
    ]
  },
  'inventory-projects': {
    titre: "🔨 Établi d'assemblage & Chantiers",
    title: "🔨 Établi d'assemblage & Chantiers",
    description: "Suivi en direct du montage des instruments à partir des pièces usinées.",
    etapes: [
      "Ouvrir un nouveau conteneur d'assemblage selon un modèle.",
      "Assigner les pièces détachées requises disponibles en stock.",
      "Contrôler la complétion et baptiser l'instrument pour l'intégrer au parc actif."
    ],
    targets: [
      "lutherie-new-project-btn",
      "lutherie-project-slots",
      "lutherie-finalize-btn"
    ],
    steps: [
      "Ouvrir un nouveau conteneur d'assemblage selon un modèle.",
      "Assigner les pièces détachées requises disponibles en stock.",
      "Contrôler la complétion et baptiser l'instrument pour l'intégrer au parc actif."
    ]
  },
  'instrument-models': {
    titre: "📐 Modèles & Plans de fabrication",
    title: "📐 Modèles & Plans de fabrication",
    description: "Référentiel technique définissant la nomenclature des pièces, les étapes d'usinage et les tutoriels associés.",
    etapes: [
      "Consulter les plans d'assemblage des pupitres.",
      "Configurer les nomenclatures de pièces nécessaires.",
      "Exporter ou importer des bundles complets d'instruments."
    ],
    targets: [
      "lutherie-models-grid",
      "lutherie-model-blueprint",
      "lutherie-models-grid"
    ],
    steps: [
      "Consulter les plans d'assemblage des pupitres.",
      "Configurer les nomenclatures de pièces nécessaires.",
      "Exporter ou importer des bundles complets d'instruments."
    ]
  },
  'inventory-parts': {
    titre: "⚙️ Stock des Pièces détachées",
    title: "⚙️ Stock des Pièces détachées",
    description: "Traçabilité unitaire des éléments constitutifs (fûts, cerclages, peaux) en cours d'usinage ou disponibles.",
    etapes: [
      "Enregistrer une nouvelle pièce brute en stock.",
      "Suivre les étapes d'usinage et solliciter la validation d'atelier.",
      "Affecter les pièces terminées aux chantiers d'assemblage."
    ],
    targets: [
      "lutherie-new-part-btn",
      "lutherie-parts-table",
      "lutherie-parts-filters"
    ],
    steps: [
      "Enregistrer une nouvelle pièce brute en stock.",
      "Suivre les étapes d'usinage et solliciter la validation d'atelier.",
      "Affecter les pièces terminées aux chantiers d'assemblage."
    ]
  },
  'inventory-supplies': {
    titre: "🪵 Matières premières & Consommables",
    title: "🪵 Matières premières & Consommables",
    description: "Gestion au métrage, au poids ou au volume des fournitures brutes d'atelier.",
    etapes: [
      "Surveiller les niveaux de stock par seuil critique.",
      "Ajuster les quantités disponibles après chaque séance d'atelier.",
      "Déclencher une demande d'achat groupé en cas de besoin."
    ],
    steps: [
      "Surveiller les niveaux de stock par seuil critique.",
      "Ajuster les quantités disponibles après chaque séance d'atelier.",
      "Déclencher une demande d'achat groupé en cas de besoin."
    ]
  },
  'workshop-tools': {
    titre: "🧰 Parc d'Outillage d'Atelier",
    title: "🧰 Parc d'Outillage d'Atelier",
    description: "Inventaire des machines et outils, avec distinction entre outillage résident et équipement mobile.",
    etapes: [
      "Inventorier les machines et outils manuels.",
      "Indiquer si l'outil réside au local ou peut voyager en mallette.",
      "Suivre l'état d'usure et planifier l'entretien de l'outillage."
    ],
    steps: [
      "Inventorier les machines et outils manuels.",
      "Indiquer si l'outil réside au local ou peut voyager en mallette.",
      "Suivre l'état d'usure et planifier l'entretien de l'outillage."
    ]
  },
  'varal-lutherie': {
    titre: "📜 Varal Lutherie & Fiches Techniques",
    title: "📜 Varal Lutherie & Fiches Techniques",
    description: "Bibliothèque des tutoriels de fabrication, guides pas-à-pas et consignes d'atelier.",
    etapes: [
      "Consulter les guides illustrés par composant.",
      "Vérifier la liste des outils et matières requis par étape.",
      "Réviser les techniques via les QCM d'atelier."
    ],
    steps: [
      "Consulter les guides illustrés par composant.",
      "Vérifier la liste des outils et matières requis par étape.",
      "Réviser les techniques via les QCM d'atelier."
    ]
  },

  // ==========================================
  // 5. PÔLE COSTUMERIE & ARTISANAT TEXTILE
  // ==========================================
  costumerie: {
    titre: "🥻 Pôle Costumerie & Artisanat Textile",
    title: "🥻 Pôle Costumerie & Artisanat Textile",
    description: "Atelier de confection vestimentaire, gestion des tenues officielles, métrages de tissus et mensurations.",
    etapes: [
      "Définir les modèles officiels et les fiches de patronage.",
      "Suivre les chantiers de confection en cours sur l'établi.",
      "Gérer l'inventaire physique des costumes et les affectations aux danseurs/musiciens."
    ],
    steps: [
      "Définir les modèles officiels et les fiches de patronage.",
      "Suivre les chantiers de confection en cours sur l'établi.",
      "Gérer l'inventaire physique des costumes et les affectations aux danseurs/musiciens."
    ]
  },
  'wardrobe-projects': {
    titre: "🪡 Établi de Confection & Chantiers",
    title: "🪡 Établi de Confection & Chantiers",
    description: "Organisation de la confection sur mesure et du suivi d'avancement des pièces textiles.",
    etapes: [
      "Lister les projets de confection en cours (patrons, métrages de tissus).",
      "Affecter les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivre l'avancement des pièces jusqu'à l'intégration au vestiaire physique."
    ],
    targets: [
      "costumerie-new-project-btn",
      "costumerie-projects-grid",
      "costumerie-project-steps"
    ],
    steps: [
      "Lister les projets de confection en cours (patrons, métrages de tissus).",
      "Affecter les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivre l'avancement des pièces jusqu'à l'intégration au vestiaire physique."
    ]
  },
  'wardrobe-models': {
    titre: "🎨 Modèles de Costumes & Patrons",
    title: "🎨 Modèles de Costumes & Patrons",
    description: "Bibliothèque des tenues de scène avec découpage en pièces obligatoires et accessoires optionnels.",
    etapes: [
      "Définir les tenues officielles par pupitre et événement.",
      "Associer les fiches de patronage et métrages de tissu nécessaires.",
      "Consulter les fiches techniques de coupe et d'assemblage."
    ],
    targets: [
      "costumerie-models-cards",
      "costumerie-models-cards",
      "costumerie-models-cards"
    ],
    steps: [
      "Définir les tenues officielles par pupitre et événement.",
      "Associer les fiches de patronage et métrages de tissu nécessaires.",
      "Consulter les fiches techniques de coupe et d'assemblage."
    ]
  },
  'wardrobe-pieces': {
    titre: "👗 Vestiaire Physique & Tenues",
    title: "👗 Vestiaire Physique & Tenues",
    description: "Catalogue des tenues confectionnées, suivi des attributions et de l'état des vêtements de la troupe.",
    etapes: [
      "Vérifier la disponibilité des tenues par taille et type de costume.",
      "Assigner les éléments de costumes aux membres pour les prestations.",
      "Signaler les besoins de nettoyage ou de réparation."
    ],
    targets: [
      "costumerie-pieces-table",
      "costumerie-pieces-assign",
      "costumerie-pieces-table"
    ],
    steps: [
      "Vérifier la disponibilité des tenues par taille et type de costume.",
      "Assigner les éléments de costumes aux membres pour les prestations.",
      "Signaler les besoins de nettoyage ou de réparation."
    ]
  },
  'wardrobe-supplies': {
    titre: "🧵 Tissus & Mercerie",
    title: "🧵 Tissus & Mercerie",
    description: "Suivi des rouleaux de tissus, laizes, boutons, fils et élastiques de l'atelier couture.",
    etapes: [
      "Gérer les métrages de tissu en stock selon la laize.",
      "Contrôler les réserves de mercerie avant le lancement d'une série.",
      "Générer les demandes de réassort en commande groupée."
    ],
    steps: [
      "Gérer les métrages de tissu en stock selon la laize.",
      "Contrôler les réserves de mercerie avant le lancement d'une série.",
      "Générer les demandes de réassort en commande groupée."
    ]
  },
  'wardrobe-tools': {
    titre: "✂️ Machines & Matériel de Couture",
    title: "✂️ Machines & Matériel de Couture",
    description: "Parc des machines à coudre, surjeteuses, ciseaux tailleur et tables de repassage.",
    etapes: [
      "Répertorier les machines attribuées ou résidentes au local.",
      "Vérifier la disponibilité du matériel mobile pour les ateliers couture.",
      "Noter les révisions mécaniques et besoins d'aiguilles/fils."
    ],
    steps: [
      "Répertorier les machines attribuées ou résidentes au local.",
      "Vérifier la disponibilité du matériel mobile pour les ateliers couture.",
      "Noter les révisions mécaniques et besoins d'aiguilles/fils."
    ]
  },
  'wardrobe-sizes': {
    titre: "📏 Registre des Mensurations Adhérents",
    title: "📏 Registre des Mensurations Adhérents",
    description: "Fiches individuelles des gabarits et tailles pour l'ajustement optimal des tenues de concert.",
    etapes: [
      "Saisissez les mensurations transmises par les membres.",
      "Comparez les gabarits disponibles avec le stock de costumes.",
      "Anticipez la fabrication de tenues dans les tailles manquantes."
    ],
    steps: [
      "Saisissez les mensurations transmises par les membres.",
      "Comparez les gabarits disponibles avec le stock de costumes.",
      "Anticipez la fabrication de tenues dans les tailles manquantes."
    ]
  },
  'varal-costumerie': {
    titre: "🪡 Varal Costumerie & Tutoriels",
    title: "🪡 Varal Costumerie & Tutoriels",
    description: "Espace documentaire regroupant les patrons PDF, planches de découpe et consignes d'entretien des tenues.",
    etapes: [
      "Consulter les planches de patronage au format PDF.",
      "Suivre les instructions d'assemblage et d'ourlet pas-à-pas.",
      "Télécharger les consignes d'entretien et de lavage."
    ],
    steps: [
      "Consulter les planches de patronage au format PDF.",
      "Suivre les instructions d'assemblage et d'ourlet pas-à-pas.",
      "Télécharger les consignes d'entretien et de lavage."
    ]
  },

  // ==========================================
  // 6. PÔLE DIFFUSION & SPECTACLES
  // ==========================================
  diffusion: {
    titre: "🎷 Pôle Diffusion & Prestations Extérieures",
    title: "🎷 Pôle Diffusion & Prestations Extérieures",
    description: "Prospection des dates de concert, suivi des propositions commerciales et gestion du carnet d'organisateurs.",
    etapes: [
      "Suivez les opportunités de dates sur le tableau Kanban.",
      "Gérez les coordonnées des programmations culturelles et mairies.",
      "Établissez les fiches techniques et conventions de spectacle."
    ],
    steps: [
      "Suivez les opportunités de dates sur le tableau Kanban.",
      "Gérez les coordonnées des programmations culturelles et mairies.",
      "Établissez les fiches techniques et conventions de spectacle."
    ]
  },
  'gigs-pipeline': {
    titre: "📊 Pipeline des Prestations (Kanban)",
    title: "📊 Pipeline des Prestations (Kanban)",
    description: "Suivi visuel et chronologique des dates, du contact initial au concert réalisé.",
    etapes: [
      "Ajoutez les demandes entrantes dans la colonne « Premier contact ».",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocié et l'effectif requis."
    ],
    targets: [
      "gigs-add-button",
      "gigs-kanban-board",
      "gigs-kanban-board"
    ],
    steps: [
      "Ajoutez les demandes entrantes dans la colonne « Premier contact ».",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocié et l'effectif requis."
    ]
  },
  'diffusion-contacts': {
    titre: "📇 Carnet de Contacts CRM Programmation",
    title: "📇 Carnet de Contacts CRM Programmation",
    description: "Base de données relationnelle des organisateurs de festival, services culturels et diffuseurs.",
    etapes: [
      "Enregistrez les coordonnées précises des chargés de programmation.",
      "Consignez les comptes-rendus d'échanges téléphoniques et relances.",
      "Qualifiez les diffuseurs selon leurs périodes de programmation."
    ],
    targets: [
      "contacts-add-button",
      "contacts-filter-bar",
      "contacts-table"
    ],
    steps: [
      "Enregistrez les coordonnées précises des chargés de programmation.",
      "Consignez les comptes-rendus d'échanges téléphoniques et relances.",
      "Qualifiez les diffuseurs selon leurs périodes de programmation."
    ]
  },

  // ==========================================
  // 7. PÔLE STUDIO & COMMUNICATION
  // ==========================================
  // Pôle Studio & Communication (résolu via studioGuide Double Vue)
  'studio-social': {
    titre: "📱 Réseaux Sociaux & Publications",
    title: "📱 Réseaux Sociaux & Publications",
    description: "Préparation et création des visuels et publications pour les réseaux sociaux (Instagram, Facebook).",
    etapes: [
      "Préparez les visuels pour les réseaux sociaux.",
      "Sélectionnez les dates importantes à annoncer.",
      "Générez le contenu prêt à publier."
    ],
    steps: [
      "Préparez les visuels pour les réseaux sociaux.",
      "Sélectionnez les dates importantes à annoncer.",
      "Générez le contenu prêt à publier."
    ]
  },
  newsletter: {
    titre: "📰 Générateur de Newsletter",
    title: "📰 Générateur de Newsletter",
    description: "Générateur de newsletter synthétique. Préparez le contenu des campagnes pour export vers Brevo.",
    etapes: [
      "Rédigez le message d'accueil de la campagne.",
      "Sélectionnez les prochaines dates à annoncer.",
      "Ajoutez les souvenirs et photos des événements passés.",
      "Validez et exportez le JSON pour Brevo."
    ],
    steps: [
      "Rédigez le message d'accueil de la campagne.",
      "Sélectionnez les prochaines dates à annoncer.",
      "Ajoutez les souvenirs et photos des événements passés.",
      "Validez et exportez le JSON pour Brevo."
    ]
  },
  'studio-communication': {
    titre: "📢 Campagnes & Stratégie de Communication",
    title: "📢 Campagnes & Stratégie de Communication",
    description: "Coordination des plans de communication, relations presse et diffusion des annonces de la troupe.",
    etapes: [
      "Planifiez le calendrier éditorial des campagnes promotionnelles.",
      "Préparez les communiqués de presse et dossiers médias.",
      "Harmonisez les messages et affiches diffusés sur tous les canaux."
    ],
    steps: [
      "Planifiez le calendrier éditorial des campagnes promotionnelles.",
      "Préparez les communiqués de presse et dossiers médias.",
      "Harmonisez les messages et affiches diffusés sur tous les canaux."
    ]
  },
  'varal-photos': {
    titre: "📸 Passerelle Cloud & Varal Photos",
    title: "📸 Passerelle Cloud & Varal Photos",
    description: "Hub de stockage externe (Framaspace, Drive, Dropbox) : récolte de clichés par QR-Code et publication d'albums sur le Varal.",
    etapes: [
      "Configurez le lien Cloud racine de l'association (Framaspace / Drive) pour un accès direct.",
      "Associez les dossiers de dépôt public aux dates et générez les QR-Codes d'événement.",
      "Liez les albums finalisés pour synchroniser automatiquement les livrets sur le Varal Photos."
    ],
    targets: [
      "studio-cloud-root",
      "studio-events-media-table",
      "studio-varal-photos-rope"
    ],
    steps: [
      "Configurez le lien Cloud racine de l'association (Framaspace / Drive) pour un accès direct.",
      "Associez les dossiers de dépôt public aux dates et générez les QR-Codes d'événement.",
      "Liez les albums finalisés pour synchroniser automatiquement les livrets sur le Varal Photos."
    ]
  },

  // ==========================================
  // 8. PÔLE PÉDAGOGIE & TRANSMISSION
  // ==========================================
  // Pôle Pédagogie & Répertoire (résolu via pedagogyGuide Double Vue)
  'varal-manager': {
    titre: "📌 Varal Pédagogique & Partitions",
    title: "📌 Varal Pédagogique & Partitions",
    description: "Partitions musicales, livrets de Cordel, relevés de baque et supports audio d'apprentissage.",
    etapes: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les audios de travail et grilles rythmiques avec les membres.",
      "Administrez les fiches de chants et ressources téléchargeables."
    ],
    steps: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les audios de travail et grilles rythmiques avec les membres.",
      "Administrez les fiches de chants et ressources téléchargeables."
    ]
  },
  'mestre-pedagogy-qcm': {
    titre: "📝 Configuration des QCM & Quiz",
    title: "📝 Configuration des QCM & Quiz",
    description: "Créez et organisez les questionnaires d'évaluation théorique et culturelle.",
    etapes: [
      "Rédigez les questions et paramétrez les réponses correctes.",
      "Définissez le niveau de difficulté et l'instrument ciblé.",
      "Publiez le QCM pour le rendre accessible dans l'espace membre."
    ],
    steps: [
      "Rédigez les questions et paramétrez les réponses correctes.",
      "Définissez le niveau de difficulté et l'instrument ciblé.",
      "Publiez le QCM pour le rendre accessible dans l'espace membre."
    ]
  },
  'mestre-pedagogy-dashboard': {
    titre: "📊 Suivi et Analyse Pédagogique",
    title: "📊 Suivi et Analyse Pédagogique",
    description: "Supervisez la progression globale de la troupe et identifiez les notions à revoir en répétition.",
    etapes: [
      "Consultez les scores moyens par quiz et par pupitre.",
      "Identifiez les questions les plus fréquemment ratées.",
      "Adaptez vos ateliers et répétitions en fonction des résultats."
    ],
    steps: [
      "Consultez les scores moyens par quiz et par pupitre.",
      "Identifiez les questions les plus fréquemment ratées.",
      "Adaptez vos ateliers et répétitions en fonction des résultats."
    ]
  },

  // ==========================================
  // 9. PÔLE MESTRIA (DIRECTION ARTISTIQUE)
  // ==========================================
  mestre: {
    titre: "🎭 Pôle Mestria & Direction Artistique",
    title: "🎭 Pôle Mestria & Direction Artistique",
    description: "Espace de pilotage musical : castings par morceau, arrangements rythmiques, plans de scène et directives artistiques.",
    etapes: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et communiquez les consignes musicales."
    ],
    steps: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et communiquez les consignes musicales."
    ]
  },
  'mestre-repertoire': {
    titre: "📜 Classeur du Répertoire de la Troupe",
    title: "📜 Classeur du Répertoire de la Troupe",
    description: "Référentiel central des morceaux, rythmes et créations artistiques avec statut de saison et liaisons transversales.",
    etapes: [
      "Ajoutez les morceaux et rythmes de la saison avec leur niveau de maturité.",
      "Liez optionnellement chaque pièce à une toada, un rythme séquenceur ou une chorégraphie.",
      "Injectez directement les morceaux dans le fil conducteur de vos répétitions et concerts."
    ],
    steps: [
      "Ajoutez les morceaux et rythmes de la saison avec leur niveau de maturité.",
      "Liez optionnellement chaque pièce à une toada, un rythme séquenceur ou une chorégraphie.",
      "Injectez directement les morceaux dans le fil conducteur de vos répétitions et concerts."
    ]
  },
  'mestre-sequenceur': {
    titre: "🎼 Séquenceur & Répertoire Musical",
    title: "🎼 Séquenceur & Répertoire Musical",
    description: "Arrangements rythmiques, partitions interactives et liaisons avec l'application Séquenceur.",
    etapes: [
      "Consultez les pièces et grilles rythmiques synchronisées.",
      "Ajustez les métadonnées et découpages en sections.",
      "Lancez l'entraînement interactif sur le Séquenceur."
    ],
    targets: [
      "mestre-sequenceur-list",
      "mestre-sequenceur-metadata",
      "mestre-sequenceur-list"
    ],
    steps: [
      "Consultez les pièces et grilles rythmiques synchronisées.",
      "Ajustez les métadonnées et découpages en sections.",
      "Lancez l'entraînement interactif sur le Séquenceur."
    ]
  },
  'mestre-orientation': {
    titre: "🎯 Orientation & Casting des Pupitres",
    title: "🎯 Orientation & Casting des Pupitres",
    description: "Gestion des équilibres de pupitres, validation des souhaits d'évolution et affectation des instruments.",
    etapes: [
      "Vérifiez l'équilibre et les quotas par pupitre via les jauges d'effectifs.",
      "Consultez la table des vœux et souhaits d'orientation des adhérents.",
      "Validez les affectations et attribuez les instruments pour la saison."
    ],
    targets: [
      "mestre-orientation-gauges",
      "mestre-orientation-table",
      "mestre-orientation-assignment"
    ],
    steps: [
      "Vérifiez l'équilibre et les quotas par pupitre via les jauges d'effectifs.",
      "Consultez la table des vœux et souhaits d'orientation des adhérents.",
      "Validez les affectations et attribuez les instruments pour la saison."
    ]
  },
  'mestre-events': {
    titre: "🎵 Conduite Artistique des Prestations",
    title: "🎵 Conduite Artistique des Prestations",
    description: "Supervision des baques joués, ordres de passage et consignes artistiques de concert.",
    etapes: [
      "Sélectionnez la date de spectacle dans l'agenda de la Mestria.",
      "Fixez la liste des baques joués et la séquence des morceaux.",
      "Renseignez les consignes de costume et d'instrumentation."
    ],
    steps: [
      "Sélectionnez la date de spectacle dans l'agenda de la Mestria.",
      "Fixez la liste des baques joués et la séquence des morceaux.",
      "Renseignez les consignes de costume et d'instrumentation."
    ]
  },
  'mestre-stage-layout': {
    titre: "📐 Plans de Scène & Cortejo",
    title: "📐 Plans de Scène & Cortejo",
    description: "Tableau de bord des dates de concert et conception visuelle de l'implantation des pupitres sur scène.",
    etapes: [
      "Consultez les dates de prestations et le statut de leurs plans de scène dans le tableau.",
      "Ouvrez un concert pour concevoir ou ajuster la grille scénique et l'avant-scène danse.",
      "Mobilisez et placez les musiciens confirmés depuis le roster latéral avec gestion des voix d'alfaia."
    ],
    targets: [
      "mestre-stage-grid",
      "mestre-stage-roster",
      "mestre-stage-grid"
    ],
    steps: [
      "Consultez les dates de prestations et le statut de leurs plans de scène dans le tableau.",
      "Ouvrez un concert pour concevoir ou ajuster la grille scénique et l'avant-scène danse.",
      "Mobilisez et placez les musiciens confirmés depuis le roster latéral avec gestion des voix d'alfaia."
    ]
  },
  'mestre-categories': {
    titre: "🏷️ Catégories & Niveaux de Pratique",
    title: "🏷️ Catégories & Niveaux de Pratique",
    description: "Configuration des sections de pratique, niveaux et sous-groupes de la troupe (danse, percussions, ateliers débutants ou avancés).",
    etapes: [
      "Ajoutez une nouvelle section ou un niveau de pratique avec son code couleur.",
      "Consultez et ajustez la liste des catégories actives pour les convocations.",
      "Synchronisez les profils membres si nécessaire pour aligner les anciens libellés."
    ],
    steps: [
      "Ajoutez une nouvelle section ou un niveau de pratique avec son code couleur.",
      "Consultez et ajustez la liste des catégories actives pour les convocations.",
      "Synchronisez les profils membres si nécessaire pour aligner les anciens libellés."
    ]
  },
  'mestre-mot-mestre': {
    titre: "Directives & Annonces de la Mestria",
    title: "Directives & Annonces de la Mestria",
    description: "Canal direct d'annonces de la direction artistique vers l'ensemble des musiciens.",
    etapes: [
      "Rédigez un mot d'orientation artistique ou un rappel de consigne.",
      "Notifiez la troupe sur les points d'effort rythmiques prioritaires.",
      "Consultez les archives des consignes de la direction artistique."
    ],
    steps: [
      "Rédigez un mot d'orientation artistique ou un rappel de consigne.",
      "Notifiez la troupe sur les points d'effort rythmiques prioritaires.",
      "Consultez les archives des consignes de la direction artistique."
    ]
  },

  // ==========================================
  // 10. PÔLE VITRINE PUBLIQUE
  // ==========================================
  vitrine: {
    titre: "🌐 Pôle Vitrine Publique & Communication",
    title: "🌐 Pôle Vitrine Publique & Communication",
    description: "Administration du site web public, des contenus de présentation, médias et référencement SEO.",
    etapes: [
      "Mettez à jour les textes de présentation et la biographie.",
      "Enrichissez la galerie photo/vidéo des prestations publiques.",
      "Ajustez les éléments de référencement pour Google."
    ],
    steps: [
      "Mettez à jour les textes de présentation et la biographie.",
      "Enrichissez la galerie photo/vidéo des prestations publiques.",
      "Ajustez les éléments de référencement pour Google."
    ]
  },
  'vitrine-general': {
    titre: "🌐 Général & Référencement SEO Vitrine",
    title: "🌐 Général & Référencement SEO Vitrine",
    description: "Configuration du titre du site, métadonnées Google et image de partage réseaux sociaux.",
    etapes: [
      "Renseignez le nom public officiel et le résumé d'accroche.",
      "Optimisez les balises méta et mots-clés de recherche.",
      "Vérifiez le visuel de partage Open Graph pour Facebook et WhatsApp."
    ],
    steps: [
      "Renseignez le nom public officiel et le résumé d'accroche.",
      "Optimisez les balises méta et mots-clés de recherche.",
      "Vérifiez le visuel de partage Open Graph pour Facebook et WhatsApp."
    ]
  },
  'vitrine-presentation': {
    titre: "📖 Contenu de Présentation & Historique",
    title: "📖 Contenu de Présentation & Historique",
    description: "Rédaction des pages d'accueil, historique de la roda et esprit de la troupe.",
    etapes: [
      "Rédigez l'histoire et les valeurs véhiculées par l'association.",
      "Présentez la Mestria et les sections rythmiques aux visiteurs.",
      "Soignez la mise en page des textes d'accueil."
    ],
    steps: [
      "Rédigez l'histoire et les valeurs véhiculées par l'association.",
      "Présentez la Mestria et les sections rythmiques aux visiteurs.",
      "Soignez la mise en page des textes d'accueil."
    ]
  },
  'vitrine-organisateur': {
    titre: "📄 Espace Organisateur & Fiche Technique Publique",
    title: "📄 Espace Organisateur & Fiche Technique Publique",
    description: "Documents téléchargeables et informations pratiques réservés aux diffuseurs culturels.",
    etapes: [
      "Mettez à jour le dossier de presse et la fiche technique en PDF.",
      "Indiquez les jauges modulables et conditions de déplacement.",
      "Insérez les boutons de contact direct pour les demandes de devis."
    ],
    steps: [
      "Mettez à jour le dossier de presse et la fiche technique en PDF.",
      "Indiquez les jauges modulables et conditions de déplacement.",
      "Insérez les boutons de contact direct pour les demandes de devis."
    ]
  },
  'vitrine-galerie': {
    titre: "📸 Galerie Photo & Vidéos de Concert",
    title: "📸 Galerie Photo & Vidéos de Concert",
    description: "Médiathèque des plus belles prises de vue des défilés et spectacles du groupe.",
    etapes: [
      "Téléversez des photos haute définition des concerts récents.",
      "Ajoutez les liens des vidéos intégrées depuis YouTube/Vimeo.",
      "Organisez les clichés par catégories d'événements."
    ],
    steps: [
      "Téléversez des photos haute définition des concerts récents.",
      "Ajoutez les liens des vidéos intégrées depuis YouTube/Vimeo.",
      "Organisez les clichés par catégories d'événements."
    ]
  },
  'vitrine-recrutement': {
    titre: "🤝 Informations Recrutement & Portes Ouvertes",
    title: "🤝 Informations Recrutement & Portes Ouvertes",
    description: "Espace d'accueil des futurs pratiquants avec dates de reprise et inscriptions.",
    etapes: [
      "Rédigez l'annonce de recrutement et les conditions d'accès.",
      "Indiquez les lieux, jours et horaires des répétitions débutants.",
      "Activez le formulaire de demande d'essai en ligne."
    ],
    steps: [
      "Rédigez l'annonce de recrutement et les conditions d'accès.",
      "Indiquez les lieux, jours et horaires des répétitions débutants.",
      "Activez le formulaire de demande d'essai en ligne."
    ]
  },
  'vitrine-reseaux': {
    titre: "📲 Réseaux Sociaux & Newsletter Publique",
    title: "📲 Réseaux Sociaux & Newsletter Publique",
    description: "Liens de redirection vers les profils officiels et module d'abonnement infolettre.",
    etapes: [
      "Saisissez les liens vers Instagram, Facebook et YouTube.",
      "Configurez le widget de collecte d'emails pour la newsletter.",
      "Testez les liens de redirection vers les plateformes sociales."
    ],
    steps: [
      "Saisissez les liens vers Instagram, Facebook et YouTube.",
      "Configurez le widget de collecte d'emails pour la newsletter.",
      "Testez les liens de redirection vers les plateformes sociales."
    ]
  },
  'vitrine-apparence': {
    titre: "🎨 Thème Visuel de la Vitrine Publique",
    title: "🎨 Thème Visuel de la Vitrine Publique",
    description: "Personnalisation des couleurs, polices et habillages graphiques du site vitrine.",
    etapes: [
      "Sélectionnez la palette de couleurs officielle de l'association.",
      "Prévisualisez le rendu visuel sur ordinateur et smartphone.",
      "Enregistrez les modifications d'apparence pour le site public."
    ],
    steps: [
      "Sélectionnez la palette de couleurs officielle de l'association.",
      "Prévisualisez le rendu visuel sur ordinateur et smartphone.",
      "Enregistrez les modifications d'apparence pour le site public."
    ]
  },

  // ==========================================
  // 11. PÔLE CONFIGURATION DU SYSTÈME
  // ==========================================
  config: {
    titre: "⚙️ Pôle Configuration du Système",
    title: "⚙️ Pôle Configuration du Système",
    description: "Paramètres administratifs : identité légale, interrupteurs des modules, sécurité et profils.",
    etapes: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les options de profil."
    ],
    steps: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les options de profil."
    ]
  },
  'config-identity': {
    titre: "🏛️ Identité Légale & Juridique",
    title: "🏛️ Identité Légale & Juridique",
    description: "Siège social, SIRET, signatures numérisées officielles du Bureau et composition de la Direction artistique.",
    etapes: [
      "Renseigner la raison sociale et l'adresse officielle",
      "Vérifier les signatures numérisées du Président et du Trésorier",
      "Mettre à jour la composition du Bureau"
    ],
    targets: [
      "config-identity-legal",
      "config-identity-signatures",
      "config-identity-bureau"
    ],
    steps: [
      "Renseigner la raison sociale et l'adresse officielle",
      "Vérifier les signatures numérisées du Président et du Trésorier",
      "Mettre à jour la composition du Bureau"
    ]
  },
  'config-profile': {
    titre: "👥 Inscription, Profils & Lieux Habitants",
    title: "👥 Inscription, Profils & Lieux Habitants",
    description: "Champs obligatoires d'onboarding, questions personnalisées, carnet des salles de répétition et catégories d'agenda.",
    etapes: [
      "Activer les champs standards d'inscription",
      "Configurer les questions spécifiques pour les adhérents",
      "Déclarer les lieux de pratique et repères GPS"
    ],
    targets: [
      "config-profile-form-accordion",
      "config-profile-custom-fields",
      "config-profile-lieux"
    ],
    steps: [
      "Activer les champs standards d'inscription",
      "Configurer les questions spécifiques pour les adhérents",
      "Déclarer les lieux de pratique et repères GPS"
    ]
  },
  'config-security': {
    titre: "🛡️ Badges, Rôles & Sécurité",
    title: "🛡️ Badges, Rôles & Sécurité",
    description: "Distribution des étiquettes d'accès par pôle, matrice RBAC et code PIN d'urgence Break-Glass.",
    etapes: [
      "Créer les étiquettes de rôles (Secrétaire, Trésorier, etc.)",
      "Ajuster les permissions d'accès aux onglets",
      "Attribuer les badges aux membres de la troupe"
    ],
    targets: [
      "config-security-guide",
      "config-security-pin",
      "config-security-matrix"
    ],
    steps: [
      "Créer les étiquettes de rôles (Secrétaire, Trésorier, etc.)",
      "Ajuster les permissions d'accès aux onglets",
      "Attribuer les badges aux membres de la troupe"
    ]
  },
  'config-comms': {
    titre: "📬 Communication, E-mails & Relances",
    title: "📬 Communication, E-mails & Relances",
    description: "Configuration du service d'envoi d'e-mails (API Brevo, expéditeur, DNS) et paramétrage des délais de notification automatique.",
    etapes: [
      "Vérifier la clé API et l'expéditeur d'e-mails",
      "Contrôler la signature DNS du domaine",
      "Définir les délais de relance automatique (J-1 / J-2)"
    ],
    targets: [
      "config-comms-email",
      "config-comms-dns",
      "config-comms-automations"
    ],
    steps: [
      "Vérifier la clé API et l'expéditeur d'e-mails",
      "Contrôler la signature DNS du domaine",
      "Définir les délais de relance automatique (J-1 / J-2)"
    ]
  },
  'config-modules': {
    titre: "🧩 Modules SaaS, Pupitres & Thème",
    title: "🧩 Modules SaaS, Pupitres & Thème",
    description: "Activation modulaire des pôles, nomenclature des instruments et personnalisation visuelle de l'espace.",
    etapes: [
      "Activer ou masquer les modules selon les besoins de l'association",
      "Harmoniser la liste des pupitres et couleurs de fûts",
      "Définir l'ordonnancement des cartes d'accueil"
    ],
    targets: [
      "config-modules-toggles",
      "config-modules-tambours",
      "config-modules-appearance"
    ],
    steps: [
      "Activer ou masquer les modules selon les besoins de l'association",
      "Harmoniser la liste des pupitres et couleurs de fûts",
      "Définir l'ordonnancement des cartes d'accueil"
    ]
  },
  'config-tambours': {
    titre: "🥁 Les Tambours & Nomenclature des Pupitres",
    title: "🥁 Les Tambours & Nomenclature des Pupitres",
    description: "Personnalisation des dénominations des instruments pour toute l'association (sequenciador, plans de scène, carnets d'aisance).",
    etapes: [
      "Choisissez une présélection rapide (Baque Virado Recife, Ketu / Tambores, Universel).",
      "Ajustez individuellement les dénominations des 13 rôles techniques d'instruments.",
      "Enregistrez pour appliquer la nomenclature modulable à toute votre structure."
    ],
    steps: [
      "Choisissez une présélection rapide (Baque Virado Recife, Ketu / Tambores, Universel).",
      "Ajustez individuellement les dénominations des 13 rôles techniques d'instruments.",
      "Enregistrez pour appliquer la nomenclature modulable à toute votre structure."
    ]
  },
  'config-layout': {
    titre: "🎨 Thèmes Visuels & Apparence Cordel",
    title: "🎨 Thèmes Visuels & Apparence Cordel",
    description: "Sélection des palettes graphiques et personnalisation visuelle de la plateforme.",
    etapes: [
      "Basculez entre le thème crème Cordel et le mode sombre.",
      "Ajustez l'affichage des bordures sémantiques et des motifs.",
      "Appliquez le thème par défaut pour l'ensemble du bureau."
    ],
    steps: [
      "Basculez entre le thème crème Cordel et le mode sombre.",
      "Ajustez l'affichage des bordures sémantiques et des motifs.",
      "Appliquez le thème par défaut pour l'ensemble du bureau."
    ]
  }
};

/**
 * Fonction de recherche du guide approprié pour un onglet ou un pôle donné.
 * Priorité accordée à l'onglet spécifique (tabId), avec repli sur le pôle général (poleId).
 * 
 * ⚠️ EXCLUSION DES VUES MEMBRES SIMPLES :
 * Si la clé correspond à un espace membre simple (profil, agenda, materiel, vestiaire membre,
 * trombinoscope, forum public, varal membre), retourne immédiatement null.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {Object|null} Objet guide ou null si exclu / non configuré
 */
export function getPoleGuide(tabId, poleId) {
  // 1. Priorité absolue à l'onglet dédié s'il est configuré dans POLE_GUIDES
  if (tabId && POLE_GUIDES[tabId]) {
    return POLE_GUIDES[tabId];
  }

  // 2. Exclusion des onglets simples de l'Espace Membre ne disposant pas de guide
  if (tabId && EXCLUDED_MEMBER_KEYS.has(tabId)) {
    return null;
  }

  // 3. Repli sur le pôle parent s'il est configuré et non exclu
  if (poleId && POLE_GUIDES[poleId] && !EXCLUDED_MEMBER_KEYS.has(poleId)) {
    return POLE_GUIDES[poleId];
  }

  return null;
}
