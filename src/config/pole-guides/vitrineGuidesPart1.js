import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Vitrine Publique (Mostrador) — Partie 1 :
 * `vitrine`, `vitrine-general`, `vitrine-presentation`, `vitrine-organisateur`.
 */
export const vitrineGuidesPart1 = {
  vitrine: makeGuide({
    fr: {
      title: '🌐 Pôle Vitrine Publique (Mostrador)',
      description: 'Administration complète du portail public Mostrador : référencement, présentation culturelle, espace pro, galerie, recrutement et thème.',
      steps: [
        'Renseignez l’identité publique, la biographie et le référencement moteur de Mostrador.',
        'Mettez à jour l’espace organisateur (dossier artistique, fiche technique) et la galerie.',
        'Personnalisez les formules de recrutement, les réseaux sociaux et la palette graphique.'
      ]
    },
    pt: {
      title: '🌐 Polo Vitrine Pública (Mostrador)',
      description: 'Administração completa do portal público Mostrador: SEO, apresentação cultural, área do contratante, galeria, recrutamento e tema.',
      steps: [
        'Preencha a identidade pública, a biografia e a otimização de busca do Mostrador.',
        'Atualize o espaço do contratante (portfólio, mapa técnico) e a galeria de fotos.',
        'Personalize informações de novas turmas, redes sociais e paleta visual.'
      ]
    }
  }),

  'vitrine-general': makeGuide({
    fr: {
      title: '🌐 Général & Référencement SEO',
      description: 'Configuration du titre public sur Mostrador, de la description pour les moteurs de recherche et du visuel de partage.',
      steps: [
        'Renseignez le nom public officiel de la troupe et sa phrase d’accroche.',
        'Soignez la description SEO et la ville d’ancrage pour le référencement local.',
        'Vérifiez l’image d’aperçu affichée lors du partage du lien sur les messageries.'
      ]
    },
    pt: {
      title: '🌐 Geral & Otimização SEO',
      description: 'Configuração do título público no Mostrador, descrição para buscadores e imagem de pré-visualização em compartilhamentos.',
      steps: [
        'Informe o nome público oficial do grupo e sua frase de destaque.',
        'Ajuste a descrição de busca e a cidade-sede para o alcance local.',
        'Confira a imagem de capa exibida ao compartilhar o link nas redes e aplicativos.'
      ]
    }
  }),

  'vitrine-presentation': makeGuide({
    fr: {
      title: '📖 Présentation, Histoire & Esprit du Groupe',
      description: 'Rédaction des sections narratives de Mostrador : origines du projet, filiation culturelle, Mestria et pupitres.',
      steps: [
        'Racontez l’histoire de l’association et la tradition culturelle portée par la troupe.',
        'Présentez la direction artistique, le Batuque et la section chorégraphique.',
        'Structurez vos paragraphes et visuels pour offrir une lecture claire sur mobile.'
      ]
    },
    pt: {
      title: '📖 Apresentação, História & Espírito da Trupe',
      description: 'Redação das seções institucionais do Mostrador: origens do grupo, linhagem cultural, Mestria e naipes.',
      steps: [
        'Conte a trajetória da associação e a tradição cultural celebrada pelo grupo.',
        'Apresente a direção artística, o Batuque e a ala coreográfica aos visitantes.',
        'Organize textos e imagens para garantir leitura agradável no celular e no computador.'
      ]
    }
  }),

  'vitrine-organisateur': makeGuide({
    fr: {
      title: '📄 Espace Organisateur & Fiche Technique',
      description: 'Ressources professionnelles téléchargeables sur Mostrador pour les festivals, mairies et programmateurs culturels.',
      steps: [
        'Déposez à jour votre dossier de présentation artistique et votre fiche technique PDF.',
        'Précisez vos formats de jeu (déambulation, scène fixe, initiation) et jauges d’effectif.',
        'Vérifiez les coordonnées de contact diffusion pour recevoir directement les demandes de devis.'
      ]
    },
    pt: {
      title: '📄 Espaço do Contratante & Ficha Técnica',
      description: 'Materiais profissionais disponíveis no Mostrador para festivais, prefeituras e produtores culturais.',
      steps: [
        'Mantenha atualizados o portfólio artístico e a ficha técnica em PDF.',
        'Detalhe os formatos de apresentação (cortejo, palco, oficina aberta) e tamanhos de formação.',
        'Confira o canal de contato de produção para receber pedidos de orçamento.'
      ]
    }
  })
};
