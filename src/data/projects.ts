import { MEDIA } from "../lib/config";

export type PortfolioProject = {
  id: string;
  number: string;
  title: string;
  city: string;
  program: string;
  description: string;
  images: readonly { name: string; alt: string; caption: string }[];
};

/**
 * Projetos de demonstração, com imagens ilustrativas. Antes de usar o site
 * de verdade, troque as imagens e os dados por fotos e informações das obras.
 */
export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: "alto-de-pinheiros",
    number: "01",
    title: "Casa Alto de Pinheiros",
    city: "São Paulo, SP",
    program: "Casa nova",
    description:
      "Uma casa em volta de um pátio com árvores, que traz luz e privacidade para dentro.",
    images: [
      {
        name: MEDIA.hero,
        alt: "Residência de concreto, pedra e madeira aberta para um pátio arborizado",
        caption: "Pátio central e área social",
      },
      {
        name: MEDIA.altoInterior,
        alt: "Sala de estar conectada ao jardim interno da Residência Alto de Pinheiros",
        caption: "Interior voltado para o jardim",
      },
      {
        name: MEDIA.altoArrival,
        alt: "Chegada da Residência Alto de Pinheiros com pedra, madeira e árvore madura",
        caption: "Chegada e fachada protegida",
      },
      {
        name: MEDIA.altoTerrace,
        alt: "Varanda de jantar da Residência Alto de Pinheiros aberta para o jardim",
        caption: "Varanda de jantar no pátio",
      },
    ],
  },
  {
    id: "mantiqueira",
    number: "02",
    title: "Casa Mantiqueira",
    city: "Campos do Jordão, SP",
    program: "Casa em terreno inclinado",
    description:
      "Uma casa baixa que acompanha a encosta e deixa a vista entrar pela sala e pela varanda.",
    images: [
      {
        name: MEDIA.mantiqueira,
        alt: "Residência contemporânea em pedra e concreto sobre terreno montanhoso",
        caption: "Implantação na encosta",
      },
      {
        name: MEDIA.mantiqueiraInterior,
        alt: "Sala com lareira aberta para uma varanda com vista para montanhas",
        caption: "Sala, varanda e horizonte",
      },
      {
        name: MEDIA.mantiqueiraArrival,
        alt: "Caminho de pedra chegando à Residência Mantiqueira na encosta",
        caption: "Chegada pela encosta",
      },
      {
        name: MEDIA.mantiqueiraSuite,
        alt: "Suíte com vista para a paisagem montanhosa da Residência Mantiqueira",
        caption: "Suíte aberta para a paisagem",
      },
    ],
  },
  {
    id: "jardim-europa",
    number: "03",
    title: "Reforma Jardim Europa",
    city: "São Paulo, SP",
    program: "Reforma e ampliação",
    description:
      "A casa antiga foi mantida e ganhou uma estrutura leve que a aproxima do jardim.",
    images: [
      {
        name: MEDIA.jardimEuropa,
        alt: "Casa de tijolos reformada com pavilhão de vidro junto a um pátio",
        caption: "Encontro entre alvenaria e pavilhão",
      },
      {
        name: MEDIA.jardimEuropaDetail,
        alt: "Pátio noturno de uma casa de tijolos com estrutura metálica e espelho d'água",
        caption: "Pátio como conexão da reforma",
      },
      {
        name: MEDIA.jardimEuropaArrival,
        alt: "Chegada noturna da Reforma Jardim Europa com muro de tijolos e jardim",
        caption: "Chegada e volume original",
      },
      {
        name: MEDIA.jardimEuropaInterior,
        alt: "Interior da Reforma Jardim Europa conectado ao pátio com piscina",
        caption: "Interior entre tijolo e jardim",
      },
    ],
  },
  {
    id: "vila-madalena",
    number: "04",
    title: "Casa Vila Madalena",
    city: "São Paulo, SP",
    program: "Casa urbana",
    description:
      "Uma faixa de plantas separa a casa da calçada e deixa a chegada mais tranquila.",
    images: [
      {
        name: MEDIA.vilaMadalena,
        alt: "Fachada urbana em concreto, pedra e madeira atrás de um jardim",
        caption: "Fachada protegida pela vegetação",
      },
      {
        name: MEDIA.vilaMadalenaInterior,
        alt: "Circulação interna com jardim, painéis de madeira e pedra natural",
        caption: "Percurso entre rua e estar",
      },
      {
        name: MEDIA.vilaMadalenaLiving,
        alt: "Sala da Residência Vila Madalena aberta para um pátio de vegetação densa",
        caption: "Estar voltado para o pátio",
      },
      {
        name: MEDIA.vilaMadalenaStudy,
        alt: "Escritório protegido por brises de madeira na Residência Vila Madalena",
        caption: "Escritório sobre o jardim",
      },
    ],
  },
  {
    id: "casa-do-quadrado",
    number: "05",
    title: "Casa do Quadrado",
    city: "Trancoso, BA",
    program: "Casa de temporada",
    description:
      "Uma casa simples e aberta, com sombra e ventilação natural em todos os ambientes.",
    images: [
      {
        name: MEDIA.trancoso,
        alt: "Casa de temporada em Trancoso com volumes claros, madeira e pátio sombreado",
        caption: "Pátio e volumes baixos",
      },
      {
        name: MEDIA.trancosoInterior,
        alt: "Pavilhão de estar e jantar em madeira aberto para um pátio tropical",
        caption: "Pavilhão aberto para o pátio",
      },
      {
        name: MEDIA.trancosoPool,
        alt: "Pátio com piscina da Casa do Quadrado em Trancoso",
        caption: "Piscina e percurso sombreado",
      },
      {
        name: MEDIA.trancosoSuite,
        alt: "Suíte aberta para o pátio tropical da Casa do Quadrado",
        caption: "Suíte e pátio de areia",
      },
    ],
  },
] as const;
