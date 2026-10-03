/**
 * Script de génération du dictionnaire bilingue FR / PT-BR pour le Pôle Studio (Lot 1)
 * Périmètre : Gazette & Newsletter (102 chaînes) + Galerie Photos & Médiathèque (188 chaînes)
 * Total : 290 chaînes brutes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rawData = JSON.parse(fs.readFileSync(path.join(rootDir, 'scripts/studio_lot1_raw_items.json'), 'utf8'));

// Dictionnaire sémantique des traductions PT-BR pour le Lot 1
const ptTranslations = {
  // === Newsletter & Gazette ===
  "Chargement du module Newsletter...": "Carregando o módulo de Boletim...",
  "Studio": "Studio",
  "Export Newsletter": "Exportar Boletim",
  "Module Newsletter": "Módulo de Boletim",
  "Préférez et exportez vos newsletters associatives directement vers votre plateforme emailing.": "Prepare e exporte seus boletins associativos diretamente para a sua plataforma de e-mail.",
  "⬅ Retour au Studio": "⬅ Voltar ao Studio",
  "Service d'envoi & Expéditeur": "Serviço de Envio & Remetente",
  "✓ Service d'envoi configuré": "✓ Serviço de envio configurado",
  "⚠️ Clé API non renseignée": "⚠️ Chave de API não informada",
  "Expéditeur officiel :": "Remetente oficial:",
  "La configuration technique (clé Brevo & domaine expéditeur) est centralisée dans": "A configuração técnica (chave Brevo & domínio remetente) está centralizada em",
  "Configuration › Communication": "Configuração › Comunicação",
  "Progression de la newsletter": "Progresso do boletim informativo",
  "Étape 1 - Message d'accueil": "Etapa 1 - Mensagem de Boas-Vindas",
  "Rédigez le sujet principal de votre campagne ainsi que le mot de bienvenue adressé aux abonnés.": "Escreva o assunto principal da sua campanha e a mensagem de boas-vindas aos assinantes.",
  "Titre de la campagne": "Título da campanha",
  "Ex : Newsletter Roda de Maracatu - Printemps 2026": "Ex: Boletim Roda de Maracatu - Primavera 2026",
  "Mot de bienvenue / Édito": "Mensagem de boas-vindas / Editorial",
  "Chers adhérents et ami(e)s de la Roda, voici nos dernières nouvelles et les prochains rendez-vous à ne pas manquer...": "Queridos integrantes e amigos da Roda, aqui estão nossas últimas novidades e os próximos encontros imperdíveis...",
  "Suivant : Prochaines dates ➔": "Próximo: Próximas datas ➔",
  "Étape 2 - Prochaines dates": "Etapa 2 - Próximas Datas",
  "Cochez les événements futurs à intégrer dans la newsletter. Le titre, la date, le lieu et la description seront extraits automatiquement.": "Marque os eventos futuros a incluir no boletim. O título, a data, o local e a descrição serão extraídos automaticamente.",
  "Aucun événement à venir trouvé dans le calendrier. Vous pouvez poursuivre sans événement futur.": "Nenhum evento futuro encontrado no calendário. Você pode continuar sem eventos futuros.",
  "événement(s) sélectionné(s) pour les prochaines dates.": "evento(s) selecionado(s) para as próximas datas.",
  "⬅ Précédent": "⬅ Anterior",
  "Suivant : Retour en images ➔": "Próximo: Registro em Imagens ➔",
  "Étape 3 - Retour en images": "Etapa 3 - Registro em Imagens",
  "Sélectionnez les événements passés récents, complétez le bilan/remerciements et choisissez entre 2 et 4 photos pour illustrer la newsletter.": "Selecione os eventos passados recentes, preencha o balanço/agradecimentos e escolha entre 2 e 4 fotos para ilustrar o boletim.",
  "Événements passés récents & Bilans": "Eventos Passados Recentes & Balanços",
  "Aucun événement passé récent à afficher.": "Nenhum evento recente para exibir.",
  "Bilan / Remerciements pour cet événement :": "Balanço / Agradecimentos para este evento:",
  "Ex : Superbe ambiance malgré la pluie ! Merci à toutes l'équipe...": "Ex: Clima maravilhoso apesar da chuva! Obrigado a toda a equipe...",
  "Grille de sélection des photos": "Grade de seleção de fotos",
  "Aucune photo enregistrée dans le système pour le moment.": "Nenhuma foto registrada no sistema no momento.",
  "Veuillez sélectionner entre 2 et 4 photos pour finaliser la mise en page de la newsletter.": "Selecione entre 2 e 4 fotos para finalizar o layout do boletim.",
  "Suivant : Récapitulatif ➔": "Próximo: Resumo ➔",
  "Étape 4 - Récapitulatif & Validation": "Etapa 4 - Resumo & Validação",
  "Vérifiez la structure du contenu assemblé avant de générer le brouillon dans le service d'emailing.": "Verifique a estrutura do conteúdo montado antes de gerar o rascunho no serviço de e-mail.",
  "Brouillon généré avec succès !": "Rascunho gerado com sucesso!",
  "Le brouillon de votre newsletter a été transmis à votre service d'emailing.": "O rascunho do seu boletim foi enviado para o seu serviço de e-mail.",
  "ID Brouillon :": "ID do Rascunho:",
  "Échec de génération du brouillon": "Falha ao gerar o rascunho",
  "Une erreur est survenue lors de l'exportation.": "Ocorreu um erro durante a exportação.",
  "Campagne": "Campanha",
  "Sans titre": "Sem título",
  "Aucun mot de bienvenue.": "Nenhuma mensagem de boas-vindas.",
  "Événements futurs (": "Eventos futuros (",
  "Aucune date sélectionnée": "Nenhuma data selecionada",
  "Événements passés (": "Eventos passados (",
  "Aucun passé sélectionné": "Nenhum evento passado selecionado",
  "Photos associées :": "Fotos vinculadas:",
  "Aperçu photo": "Prévia da foto",
  "Payload JSON standardisé": "Payload JSON padronizado",
  "✓ Copié !": "✓ Copiado!",
  "📋 Copier le JSON": "📋 Copiar o JSON",
  "Génération en cours...": "Gerando...",
  "Générer le brouillon": "Gerar o rascunho",
  "⚠️ Aucun abonné pour le moment.": "⚠️ Nenhum assinante no momento.",
  "❌ Erreur lors de l'exportation.": "❌ Erro ao exportar.",
  "📬 Formulaire Newsletter": "📬 Formulário de Boletim",
  "Afficher sur la vitrine": "Exibir na vitrine",
  "Titre Newsletter": "Título do Boletim",
  "Restez Informé !": "Fique por dentro!",
  "Badge / Sur-titre": "Selo / Sobretítulo",
  "Infolettre & Actus": "Boletim & Notícias",
  "Phrase d'accroche Newsletter": "Frase de chamada do Boletim",
  "Inscrivez-vous pour recevoir nos dates de concerts !": "Inscreva-se para receber as datas das nossas apresentações!",
  "Abonnés :": "Assinantes:",
  "📥 Exporter CSV": "📥 Exportar CSV",
  "⚡ Synchronisation Brevo (API)": "⚡ Sincronização Brevo (API)",
  "✓ Connecté": "✓ Conectado",
  "⚪ Optionnel": "⚪ Opcional",
  "Clé API Brevo v3": "Chave de API Brevo v3",
  "Masquer": "Ocultar",
  "Afficher": "Mostrar",
  "xkeysib-...": "xkeysib-...",
  "ID Liste Brevo": "ID da Lista Brevo",
  "Ex: 2 ou 5": "Ex: 2 ou 5",
  "Réseaux Sociaux & Newsletter": "Redes Sociais & Boletim",
  "Titre Contact & Réseaux": "Título de Contato & Redes",
  "Contact & Réseaux Sociaux": "Contato & Redes Sociais",
  "Bouton de Contact E-mail": "Botão de Contato por E-mail",
  "Contactez-nous pour programmer": "Entre em contato para agendar",
  "Phrase d'accroche Contact": "Frase de chamada de Contato",
  "Une question, un événement ou une prestation ? Contactez-nous ou suivez nos réseaux !": "Uma dúvida, evento ou apresentação? Fale conosco ou siga nossas redes!",
  "Veuillez saisir une adresse e-mail valide.": "Por favor, insira um endereço de e-mail válido.",
  "Une erreur s'est produite lors de votre inscription. Veuillez réessayer.": "Ocorreu um erro ao realizar sua inscrição. Por favor, tente novamente.",
  "Merci pour votre inscription ! En mode démo, aucun e-mail réel n'est envoyé.": "Obrigado pela sua inscrição! Em modo de demonstração, nenhum e-mail real é enviado.",
  "Merci ! Vous êtes bien inscrit(e) à notre newsletter.": "Obrigado! Você foi inscrito(a) com sucesso em nosso boletim.",
  "Inscrire une autre adresse": "Inscrever outro endereço",
  "⏳ Inscription...": "⏳ Inscrevendo...",
  "S'inscrire à l'infolettre": "Inscrever-se no boletim",
  "🔒 Pas de spam. Désinscription à tout moment.": "🔒 Sem spam. Cancele sua inscrição quando quiser.",
  "Merci pour votre message ! En mode démo, aucun e-mail réel n'est envoyé.": "Obrigado pela sua mensagem! Em modo de demonstração, nenhum e-mail real é enviado.",
  "Inscrire un autre e-mail": "Inscrever outro e-mail",
  "⏳ Validation...": "⏳ Validando...",
  "S'inscrire": "Inscrever-se",
  "🔒 Pas de spam. Vous pourrez vous désinscrire à tout moment.": "🔒 Sem spam. Você poderá cancelar a inscrição a qualquer momento.",
  "Impossible de charger les événements depuis Firestore.": "Não foi possível carregar os eventos do Firestore.",

  // === Galerie Photos & Médiathèque ===
  "Connexion au dossier Framaspace et récupération des clichés...": "Conectando à pasta Framaspace e recuperando registros fotográficos...",
  "Consulter l'album en ligne": "Consultar o álbum online",
  "Cet album est encore vide pour le moment. Les photos et vidéos y apparaîtront dès leur téléversement.": "Este álbum ainda está vazio no momento. As fotos e vídeos aparecerão assim que forem enviados.",
  "Récolte & Albums Prestations": "Arrecadação & Álbuns de Apresentações",
  "Varal Photos (Livrets)": "Varal de Fotos (Livretes)",
  "Associez les dossiers partagés et imprimez les QR-Codes de chaque date.": "Vincule as pastas compartilhadas e imprima os QR Codes de cada data.",
  "Consultez les albums officiels sous forme de livrets Cordel suspendus.": "Consulte os álbuns oficiais em forma de folhetos de Cordel suspensos.",
  "Fiche QR-Code : Récolte Photos & Vidéos": "Ficha QR Code: Arrecadação de Fotos & Vídeos",
  "Fiche QR-Code : Album Photos Officiel": "Ficha QR Code: Álbum de Fotos Oficial",
  "Fermer (Échap)": "Fechar (Esc)",
  "✨ Partagez vos clichés de la Roda ! ✨": "✨ Compartilhe seus registros da Roda! ✨",
  "✨ Album Photos Officiel de la Roda ✨": "✨ Álbum de Fotos Oficial da Roda ✨",
  "Événement O Girador": "Evento O Girador",
  "Scannez ce QR-Code avec l'appareil photo de votre smartphone pour déposer vos photos et vidéos dans notre espace partagé.": "Escaneie este QR Code com a câmera do seu celular para enviar suas fotos e vídeos para o nosso espaço compartilhado.",
  "Scannez ce QR-Code avec votre smartphone pour visionner l'album photo complet de la prestation.": "Escaneie este QR Code com o seu celular para ver o álbum de fotos completo da apresentação.",
  "Télécharger l'image du QR Code en haute définition (PNG)": "Baixar a imagem do QR Code em alta definição (PNG)",
  "Exporter PNG": "Exportar PNG",
  "Lancer l'impression formatée A4 prête pour affichage sur place": "Iniciar impressão formatada A4 pronta para fixação no local",
  "Imprimer Fiche A4": "Imprimir Ficha A4",
  "Lien copié !": "Link copiado!",
  "Copier le lien": "Copiar link",
  "Tester le lien dans un nouvel onglet": "Testar o link em nova aba",
  "Tester le lien ↗": "Testar link ↗",
  "📸 Photos de la publication (": "📸 Fotos da publicação (",
  "+ Affiche événement": "+ Cartaz do evento",
  "📂 Depuis le Varal": "📂 Do Varal",
  "Glissez-déposez vos photos ici ou cliquez pour parcourir": "Arraste e solte suas fotos aqui ou clique para navegar",
  "Sélection multiple autorisée (JPEG, PNG, WebP) - Compression auto": "Seleção múltipla permitida (JPEG, PNG, WebP) - Compressão automática",
  "Upload en cours...": "Enviando fotos...",
  "Échec envoi": "Falha no envio",
  "★ Couverture": "★ Capa",
  "Déplacer vers la gauche": "Mover para a esquerda",
  "Déplacer vers la droite": "Mover para a direita",
  "Définir en photo de couverture": "Definir como foto de capa",
  "Supprimer la photo": "Excluir foto",
  "Sélectionner des photos du Varal": "Selecionar fotos do Varal",
  "Aucune image trouvée dans la bibliothèque du Varal.": "Nenhuma imagem encontrada na biblioteca do Varal.",
  "photo(s) sélectionnée(s)": "foto(s) selecionada(s)",
  "Annuler": "Cancelar",
  "Ajouter (": "Adicionar (",
  "Délai de connexion dépassé (8s). Le dossier distant ne répond pas ou est restreint.": "Tempo de conexão esgotado (8s). A pasta remota não responde ou tem acesso restrito.",
  "Chargement des clichés...": "Carregando registros fotográficos...",
  "Ouvrir l'album complet dans un nouvel onglet sécurisé": "Abrir o álbum completo em uma nova aba segura",
  "↗ Ouvrir sur Framaspace": "↗ Abrir no Framaspace",
  "Ce dossier ne contient aucun fichier photo ou vidéo.": "Esta pasta não contém arquivos de foto ou vídeo.",
  "Fermer la galerie": "Fechar galeria",
  "Fermer": "Fechar",
  "MOV": "MOV",
  "Vidéo": "Vídeo",
  "Télécharger ce fichier en haute qualité": "Baixar este arquivo em alta qualidade",
  "Télécharger": "Baixar",
  "Précédente (Flèche gauche)": "Anterior (Seta para a esquerda)",
  "Lecture vidéo non décodable dans ce navigateur": "Reprodução de vídeo não suportada neste navegador",
  "Le fichier": "O arquivo",
  "utilise un encodage (ex: conteneur Apple QuickTime .mov / HEVC) que votre navigateur ne peut pas lire directement en streaming sur ce système.": "utiliza uma codificação (ex: contêiner Apple QuickTime .mov / HEVC) que seu navegador não consegue reproduzir diretamente em streaming neste sistema.",
  "Ouvrir le flux": "Abrir fluxo",
  "💡 Conseil : Téléchargez le fichier pour le visionner directement avec VLC ou le lecteur vidéo de votre système.": "💡 Dica: Baixe o arquivo para assisti-lo diretamente no VLC ou no reprodutor de vídeo do seu sistema.",
  "Votre navigateur ne supporte pas la lecture directe de ce format vidéo.": "Seu navegador não suporta a reprodução direta deste formato de vídeo.",
  "Suivante (Flèche droite)": "Próxima (Seta para a direita)",
  "Astuce : Utilisez les touches ◀ et ▶ du clavier pour naviguer, et Échap pour quitter.": "Dica: Use as setas ◀ e ▶ do teclado para navegar, e Esc para sair.",
  "Erreur lors de l'enregistrement du lien de dépôt.": "Erro ao salvar o link de arrecadação.",
  "Erreur lors de la synchronisation de l'album avec le Varal.": "Erro ao sincronizar o álbum com o Varal.",
  "Aucun lien de dépôt n'est disponible pour cet événement.": "Nenhum link de depósito está disponível para este evento.",
  "Rechercher un concert, répétition ou lieu...": "Buscar apresentação, ensaio ou local...",
  "📸 Prestations & Récoltes actives": "📸 Apresentações & Arrecadações ativas",
  "🪢 Sur le Varal": "🪢 No Varal",
  "🌱 À venir": "🌱 Próximas",
  "📋 Toutes les dates (": "📋 Todas as datas (",
  "Chargement des événements de l'association...": "Carregando eventos da associação...",
  "Aucun événement trouvé pour ces critères de recherche.": "Nenhum evento encontrado para estes critérios de busca.",
  "🎭 Prestation": "🎭 Apresentação",
  "Événement sans titre": "Evento sem título",
  "📷 Dépôt ouvert": "📷 Arrecadação aberta",
  "📷 Dépôt inactif": "📷 Arrecadação inativa",
  "📁 Drive synchronisé": "📁 Nuvem sincronizada",
  "🪢 Varal relié": "🪢 Varal vinculado",
  "Voir sur le Varal": "Ver no Varal",
  "⏳ Synchronisation...": "⏳ Sincronizando...",
  "⚡ Re-sync Framaspace": "⚡ Re-sincronizar Framaspace",
  "🗑️ Délier / Réinitialiser Cloud": "🗑️ Desvincular / Redefinir Nuvem",
  "📸 Boîte à photos / QR Code activé": "📸 Caixa de fotos / QR Code ativado",
  "🪢 Publié sur le Varal Photos": "🪢 Publicado no Varal de Fotos",
  "📸 Dossier de dépôt public (Framaspace, Drive...)": "📸 Pasta de arrecadação pública (Framaspace, Drive...)",
  "📱 QR-Code": "📱 QR Code",
  "🪢 Album photos finalisé (Sync Varal)": "🪢 Álbum de fotos finalizado (Sync Varal)",
  "Copier l'URL du dépôt pour synchroniser immédiatement l'album Varal": "Copiar URL do depósito para sincronizar imediatamente o álbum no Varal",
  "🔗 Aligner avec le dépôt": "🔗 Alinhar com a arrecadação",
  "Retour": "Voltar",
  "Gestion des événements": "Gestão de eventos",
  "Tableau de bord d'édition rapide et globale des événements pour l'administration.": "Painel de edição rápida e geral dos eventos para a administração.",
  "Perc": "Perc",
  "⚡ Planifier une série de répétitions pour la saison": "⚡ Planejar uma série de ensaios para a temporada",
  "Planifier une série": "Planejar uma série",
  "Afficher :": "Exibir:",
  "À venir (Défaut)": "Próximos (Padrão)",
  "Passés": "Passados",
  "Tous": "Todos",
  "Type :": "Tipo:",
  "Chargement des événements en direct...": "Carregando eventos em tempo real...",
  "Cliquer pour trier par Titre": "Clique para ordenar por Título",
  "1. Titre": "1. Título",
  "Cliquer pour trier par Type": "Clique para ordenar por Tipo",
  "2. Type": "2. Tipo",
  "Cliquer pour trier par Description": "Clique para ordenar por Descrição",
  "3. Description": "3. Descrição",
  "Cliquer pour trier par Date": "Clique para ordenar por Data",
  "4. Date": "4. Data",
  "Cliquer pour trier par Heure début": "Clique para ordenar por Horário de início",
  "5. Heure début": "5. Horário início",
  "Cliquer pour trier par Heure fin": "Clique para ordenar por Horário de término",
  "6. Heure fin": "6. Horário término",
  "Cliquer pour trier par Lieu simple": "Clique para ordenar por Local simples",
  "7. Lieu simple": "7. Local simples",
  "Cliquer pour trier par Date limite": "Clique para ordenar por Data limite",
  "8. Date limite": "8. Data limite",
  "Cliquer pour trier par Niveau perc": "Clique para ordenar por Nível percussão",
  "9. Niveau perc": "9. Nível perc",
  "Cliquer pour trier par Niveau danse": "Clique para ordenar por Nível dança",
  "10. Niveau danse": "10. Nível dança",
  "Cliquer pour trier par Tenue": "Clique para ordenar por Figurino",
  "11. Tenue": "11. Figurino",
  "Cliquer pour trier par Inclut perc": "Clique para ordenar por Inclui percussão",
  "12. Perc 🥁": "12. Perc 🥁",
  "Cliquer pour trier par Inclut danse": "Clique para ordenar por Inclui dança",
  "13. Danse 💃": "13. Dança 💃",
  "Cliquer pour trier par Soumis à validation": "Clique para ordenar por Sujeito a aprovação",
  "14. Validation 🔒": "14. Validação 🔒",
  "Cliquer pour trier par Inscriptions requises": "Clique para ordenar por Inscrições obrigatórias",
  "15. Inscriptions 📝": "15. Inscrições 📝",
  "Cliquer pour trier par Covoiturage actif": "Clique para ordenar por Carona ativa",
  "16. Covoit 🚗": "16. Carona 🚗",
  "Cliquer pour trier par Visibilité Publique": "Clique para ordenar por Visibilidade Pública",
  "17. Public 🌍": "17. Público 🌍",
  "Cliquer pour trier par Nombre de morceaux": "Clique para ordenar por Quantidade de toadas",
  "18. Morceaux 🎵": "18. Toadas 🎵",
  "Cliquer pour trier par Statut Scène": "Clique para ordenar por Disposição de Palco",
  "19. Scène 📐": "19. Palco 📐",
  "Aucun événement disponible.": "Nenhum evento disponível.",
  "Titre...": "Título...",
  "Prestation": "Apresentação",
  "Répétition": "Ensaio",
  "Stage": "Oficina / Vivência",
  "Atelier": "Oficina",
  "Réunion": "Reunião",
  "Autre": "Outro",
  "📍 Choisir un lieu...": "📍 Escolher um local...",
  "📍 Lieux habituels de l'association": "📍 Locais habituais da associação",
  "Lieu...": "Local...",
  "👥 Tous": "👥 Todos",
  "Aucun": "Nenhum",
  "Tenue...": "Figurino...",
  "Percussion": "Percussão",
  "📐 Oui": "📐 Sim",
  "Veuillez sélectionner une date de début et de fin.": "Por favor, selecione uma data de início e de fim.",
  "Erreur lors de la génération de l'export d'activité.": "Erro ao gerar o relatório de atividade.",
  "Journal d'Activité (CSV)": "Registro de Atividades (CSV)",
  "📊 Ce module permet d'extraire le journal des événements et les registres de présence de l'association sur une période choisie. Les exports sont générés sous forme de fichiers tableurs CSV compatibles avec Microsoft Excel, LibreOffice et Google Sheets.": "📊 Este módulo permite exportar o histórico de eventos e os registros de presença da associação em um período selecionado. Os relatórios são gerados em arquivos CSV compatíveis com Excel, LibreOffice e Google Sheets.",
  "📅 Choix de la Période": "📅 Escolha do Período",
  "Sélectionnez la plage de dates à auditer. Par défaut, la saison associative en cours est présélectionnée.": "Selecione o intervalo de datas para auditar. Por padrão, a temporada atual da associação já vem pré-selecionada.",
  "Date de début": "Data de início",
  "Date de fin": "Data de término",
  "Saison associative active :": "Temporada associativa ativa:",
  "En cours": "Em andamento",
  "🎭 Exporter le Bilan d'Activité": "🎭 Exportar o Balanço de Atividades",
  "Génère le registre des événements avec le décompte des présences. Idéal pour votre bilan annuel ou assemblée générale.": "Gera o registro de eventos com a contagem de presenças. Ideal para o seu relatório anual ou assembleia geral.",
  "Types d'événements à inclure :": "Tipos de eventos a incluir:",
  "Prestations": "Apresentações",
  "Génération...": "Gerando...",
  "📄 Exporter l'Activité (CSV)": "📄 Exportar Atividade (CSV)",
  "Impossible d'enregistrer l'URL du Cloud.": "Não foi possível salvar a URL da Nuvem.",
  "Passerelle Stockage Cloud de l'Association": "Central de Armazenamento na Nuvem da Associação",
  "Hébergement actif :": "Hospedagem ativa:",
  "Aucun dossier Cloud racine configuré": "Nenhuma pasta raiz na Nuvem configurada",
  "Ouvrir le dossier Cloud racine dans un nouvel onglet sécurisé": "Abrir a pasta raiz na Nuvem em nova aba segura",
  "Ouvrir notre Cloud ↗": "Acessar nossa Nuvem ↗",
  "Configurer les identifiants API Framaspace pour l'automatisation des dossiers": "Configurar credenciais da API Framaspace para automação das pastas",
  "Masquer API Framaspace": "Ocultar API Framaspace",
  "Automatisation Framaspace": "Automação Framaspace",
  "🔗 URL d'accès racine au Cloud (Framaspace, Nextcloud, Google Drive, Dropbox)": "🔗 URL raiz de acesso à Nuvem (Framaspace, Nextcloud, Google Drive, Dropbox)",
  "ex: https://mon-asso.framaspace.org/s/... ou https://drive.google.com/drive/folders/...": "ex: https://minha-asso.framaspace.org/s/... ou https://drive.google.com/drive/folders/...",
  "⏳ Enregistrement...": "⏳ Salvando...",
  "✓ Enregistré !": "✓ Salvo!",
  "Enregistrer": "Salvar",
  "💡 Ce lien racine permet aux membres du pôle Studio d'accéder d'un clic à l'arborescence générale de stockage sans transiter par des serveurs tiers.": "💡 Este link raiz permite aos integrantes do Studio acessar com um clique a estrutura geral de armazenamento sem passar por servidores de terceiros."
};

// Fonction de génération d'une clé sémantique camelCase
function makeSlug(text) {
  let clean = text
    .replace(/^[0-9]+[\.\-\s]+/g, '') // retirer préfixe de numérotation comme '1. ' ou '10. '
    .replace(/[^\w\sÀ-ÿ]/gi, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const words = clean.split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return 'label';

  // Si le premier mot commence par un chiffre, préfixer avec un mot
  let firstWord = words[0];
  if (/^[0-9]/.test(firstWord)) {
    firstWord = 'num' + firstWord;
  }

  return firstWord + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

// Construction des dictionnaires
const bilingualMap = {
  newsletter: {},
  photos: {}
};

// Traitement de Newsletter
for (const [file, items] of Object.entries(rawData.newsletter)) {
  for (const item of items) {
    const text = item.text;
    const baseSlug = makeSlug(text);
    // Assurer clé unique
    let key = baseSlug;
    if (bilingualMap.newsletter[key] && bilingualMap.newsletter[key].fr !== text) {
      key = baseSlug + 'Alt';
    }
    const pt = ptTranslations[text] || text;
    bilingualMap.newsletter[key] = {
      fr: text,
      pt: pt,
      fullKey: `studio.newsletter.${key}`
    };
    item.assignedKey = `studio.newsletter.${key}`;
  }
}

// Traitement de Photos
for (const [file, items] of Object.entries(rawData.photos)) {
  for (const item of items) {
    const text = item.text;
    const baseSlug = makeSlug(text);
    let key = baseSlug;
    if (bilingualMap.photos[key] && bilingualMap.photos[key].fr !== text) {
      key = baseSlug + 'Alt';
    }
    const pt = ptTranslations[text] || text;
    bilingualMap.photos[key] = {
      fr: text,
      pt: pt,
      fullKey: `studio.photos.${key}`
    };
    item.assignedKey = `studio.photos.${key}`;
  }
}

console.log('Newsletter keys generated:', Object.keys(bilingualMap.newsletter).length);
console.log('Photos keys generated:', Object.keys(bilingualMap.photos).length);

// Sauvegarde
fs.writeFileSync(path.join(rootDir, 'scripts/studio_lot1_bilingual_map.json'), JSON.stringify(bilingualMap, null, 2), 'utf8');
fs.writeFileSync(path.join(rootDir, 'scripts/studio_lot1_items_assigned.json'), JSON.stringify(rawData, null, 2), 'utf8');

console.log('Fichiers enregistrés avec succès !');
