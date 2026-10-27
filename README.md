<div align="center">

# Prumo Arquitetura

Site de um escritório de arquitetura residencial em São Paulo, construído como uma sequência espacial: filme que avança com a rolagem, maquete 3D e projetos que se abrem como páginas.

[![CI](https://github.com/NicolasPortie/prumo-arquitetura/actions/workflows/ci.yml/badge.svg)](https://github.com/NicolasPortie/prumo-arquitetura/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88ce02)
![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?logo=threedotjs&logoColor=white)

**[prumo.nicolasportie.com](https://prumo.nicolasportie.com)**

<img src="docs/media/hero.gif" alt="Abertura desenhada e filme que avança com a rolagem" width="860">

</div>

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Telas](#telas)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Primeiros passos](#primeiros-passos)
- [Pipeline de mídia](#pipeline-de-mídia)
- [Deploy](#deploy)
- [Convenções](#convenções)
- [Licença](#licença)

## Visão geral

A abertura desenha a elevação da casa em traço e abre dois planos como portas de correr. Em seguida o filme avança com a rolagem, em cinco capítulos legendados. Os projetos correm na horizontal e cada um abre em uma página própria, com galeria e navegação para o próximo.

## Funcionalidades

| Área | O que entrega |
| --- | --- |
| **Filme com scrub** | Vídeo controlado pela rolagem, em duas resoluções (1080p e 720p para telas até 900 px) |
| **Projetos** | Lista horizontal, transição de cartão para capa e galeria em brises dentro de um dialog |
| **Método** | Maquete 3D que se monta em três passos: Conversa, Projeto e Obra |
| **Contato** | Validação por campo, mensagem montada no app de e-mail e alternativa de copiar o texto |
| **Acessibilidade** | Lighthouse 100 em desktop e celular, foco visível, dialogs com foco gerenciado e menu por teclado |
| **Movimento** | Com `prefers-reduced-motion`, sem pin, sem rolagem suave, sem filme em scrub e sem WebGL animado |
| **Conexão lenta** | Com economia de dados, o filme não é baixado e o poster permanece |
| **Desempenho** | Imagens em AVIF e WebP em três larguras e Three.js carregado sob demanda |

## Telas

Todas as imagens do site são ilustrativas.

| Escritório | Projetos |
| --- | --- |
| ![Escritório](docs/screenshots/escritorio.png) | ![Projetos](docs/screenshots/projetos.png) |

| Método | Contato |
| --- | --- |
| ![Método](docs/screenshots/metodo.png) | ![Contato](docs/screenshots/contato.png) |

<details>
<summary>Animações e versão para celular</summary>

<br>

**Projetos**

![Rolagem horizontal dos projetos e página de um projeto](docs/media/projetos.gif)

**Método**

![Maquete 3D montando conforme a rolagem](docs/media/metodo.gif)

**Celular**

| Em uso | Início | Projetos |
| :---: | :---: | :---: |
| <img src="docs/media/celular.gif" alt="Navegação no celular" width="220"> | <img src="docs/screenshots/hero-celular.png" alt="Início no celular" width="220"> | <img src="docs/screenshots/projetos-celular.png" alt="Projetos no celular" width="220"> |

</details>

## Stack

- **Base:** React 19, TypeScript e Vite
- **Movimento:** GSAP (ScrollTrigger, SplitText, Flip e DrawSVG) com `@gsap/react`, e Lenis para rolagem suave ligado ao ticker do GSAP
- **3D:** Three.js, importando apenas as classes usadas
- **Interface:** Radix Dialog, CSS com tokens em OKLCH e Inter Tight
- **Mídia:** sharp e ffmpeg
- **Hospedagem:** Cloudflare Pages

## Estrutura do projeto

```text
src/
  sections/    seções da página: filme, escritório, projetos, método, contato e rodapé
  components/  navegação, imagem responsiva, cursor, WebGL e maquete
  hooks/       scrub de vídeo, movimento reduzido e revelações
  lib/         GSAP, Lenis, Three.js e configuração
  data/        textos, capítulos do filme e manifest de mídia
  styles/      tokens e estilos por seção
static/        servido pelo Vite: mídia otimizada, _headers, robots e sitemap
media-src/     originais de imagem e filme
scripts/       geração de mídia
docs/          GIFs e telas deste README
```

## Primeiros passos

**Requisitos:** Node.js 22 ou superior e npm.

```bash
git clone https://github.com/NicolasPortie/prumo-arquitetura.git
cd prumo-arquitetura
npm install
npm run dev
```

O servidor sobe em `http://localhost:5173`. Em desenvolvimento, `?slowmo=0.2` na URL desacelera as animações do GSAP para revisão quadro a quadro.

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Verificação de tipos |
| `npm run build` | Typecheck e build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run media` | Gera as imagens otimizadas e o manifest |

Nome, cidade e contato do escritório ficam em `src/data/studio.ts` e nos metadados do `index.html`.

## Pipeline de mídia

Os originais ficam em `media-src/` e não são servidos. `npm run media` gera as variantes responsivas (AVIF e WebP em 640, 1100 e 1600 px), o manifest com dimensões e cor média e a imagem de compartilhamento `og-image.jpg`.

Para trocar uma imagem, substitua o PNG em `media-src/` mantendo o nome e execute o comando. O filme é recodificado com `ffmpeg`, com keyframe a cada 6 quadros para o scrub responder rápido:

```bash
ffmpeg -i media-src/entre-planos-film.mp4 -an -c:v libx264 -preset slow -crf 28 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart static/media/entre-planos-film.mp4
```

## Deploy

O site é estático e publica no Cloudflare Pages a cada push na `main`.

| Campo | Valor |
| --- | --- |
| Framework preset | React (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

Os cabeçalhos de cache e segurança ficam em `static/_headers`.

## Convenções

- **Commits** seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat`, `fix`, `docs`, `chore`, `ci` e `refactor`, com escopo quando ajuda, como em `feat(hero): ...`.
- **`main`** é a branch de produção e só recebe código que passa no CI (typecheck e build).
- **Dependências** são atualizadas semanalmente pelo Dependabot.

## Licença

Todos os direitos reservados. Veja [LICENSE](LICENSE).
