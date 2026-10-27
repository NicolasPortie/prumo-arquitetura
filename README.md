# PRUMO

[![CI](https://github.com/NicolasPortie/prumo-arquitetura/actions/workflows/ci.yml/badge.svg)](https://github.com/NicolasPortie/prumo-arquitetura/actions/workflows/ci.yml)
![React 19](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Vite 7](https://img.shields.io/badge/Vite-7-646cff)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88ce02)
![Three.js](https://img.shields.io/badge/Three.js-0.185-black)
![Lighthouse](https://img.shields.io/badge/Lighthouse-100%2F100%2F100-0cce6b)

Site de um escritório de arquitetura residencial em São Paulo. A página é uma sequência espacial, não uma lista de obras: um filme que avança com a rolagem, uma maquete 3D que se monta conforme o método e projetos que se abrem como páginas.

[Ver o site](https://prumo.nicolasportie.com)

![Abertura desenhada e filme que avança com a rolagem](docs/media/hero.gif)

A abertura desenha a elevação da casa em traço e abre dois planos como portas de correr. Depois o filme avança com a rolagem, com cinco capítulos legendados.

## Em ação

### Projetos

Os projetos correm na horizontal enquanto a página rola. Ao abrir um, a foto do cartão voa e vira a capa, com galeria em brises e navegação para o próximo.

![Rolagem horizontal dos projetos e página de um projeto](docs/media/projetos.gif)

### Método

Terreno, volumes e estrutura aparecem na maquete conforme os três passos: Conversa, Projeto e Obra.

![Maquete 3D montando conforme a rolagem](docs/media/metodo.gif)

## Telas

Todas as imagens do site são ilustrativas.

| Escritório | Projetos |
| --- | --- |
| ![Escritório](docs/screenshots/escritorio.png) | ![Projetos](docs/screenshots/projetos.png) |

| Método | Contato |
| --- | --- |
| ![Método](docs/screenshots/metodo.png) | ![Contato](docs/screenshots/contato.png) |

### Celular

| Em uso | Início | Projetos |
| :---: | :---: | :---: |
| <img src="docs/media/celular.gif" alt="Navegação no celular: início, projetos, método e contato" width="220"> | <img src="docs/screenshots/hero-celular.png" alt="Início no celular" width="220"> | <img src="docs/screenshots/projetos-celular.png" alt="Projetos no celular" width="220"> |

## Destaques técnicos

- **Movimento com critério:** com `prefers-reduced-motion`, nada fica escondido. Sem pin, sem Lenis, sem filme rolando e sem WebGL animado.
- **Conexão lenta:** com economia de dados, o filme não é baixado e o poster fica no lugar.
- **Acessível:** Lighthouse 100 em acessibilidade no desktop e no celular, foco visível, dialogs com foco gerenciado e menu por teclado.
- **Leve:** imagens em AVIF e WebP em três larguras, Three.js carregado sob demanda e filme em duas resoluções (1080p e 720p para telas até 900 px).
- **Contato sem atrito:** o formulário valida por campo e monta a mensagem no app de e-mail. Se nenhum app responde, oferece copiar a mensagem pronta.
- **Marca em um lugar só:** nome, cidade e contato ficam em `src/data/studio.ts`.

## Stack e organização

- React 19, TypeScript e Vite
- GSAP (ScrollTrigger, SplitText, Flip, DrawSVG) e `@gsap/react`
- Lenis para rolagem suave, ligado ao ticker do GSAP
- Three.js, só com as classes usadas
- Radix Dialog
- CSS com tokens em OKLCH e Inter Tight

```text
src/
  sections/    seções da página (filme, escritório, projetos, método, contato, rodapé)
  components/  navegação, imagem responsiva, cursor, WebGL e maquete
  hooks/       rolagem do vídeo, movimento reduzido, revelações
  lib/         GSAP, Lenis, Three.js e configuração
  data/        textos, capítulos do filme e manifest de mídia
  styles/      tokens e estilos por seção
static/        servido pelo Vite: mídia otimizada, _headers, robots, sitemap
media-src/     originais de imagem e filme
docs/          GIFs e telas deste README
scripts/       geração de mídia
```

## Executar em desenvolvimento

Requisitos: Node.js 22 ou superior e npm.

```bash
npm install
npm run dev
```

O servidor abre em `http://localhost:5173`. Em desenvolvimento, `?slowmo=0.2` na URL desacelera todas as animações do GSAP para revisar quadro a quadro.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Checagem de tipos |
| `npm run build` | Typecheck e build de produção em `dist/` |
| `npm run preview` | Serve o build local |
| `npm run media` | Gera as imagens otimizadas e o manifest |

## Mídia

As imagens originais ficam em `media-src/` e não são servidas. `npm run media` gera as variantes responsivas (AVIF e WebP em 640, 1100 e 1600 px), o manifest com dimensões e cor média e a imagem de compartilhamento (`og-image.jpg`).

Para trocar uma imagem, substitua o PNG em `media-src/` mantendo o nome e rode o comando. O filme foi recodificado com `ffmpeg`, com keyframe a cada 6 quadros para o scrub responder rápido:

```bash
ffmpeg -i media-src/entre-planos-film.mp4 -an -c:v libx264 -preset slow -crf 28 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart static/media/entre-planos-film.mp4
```

## Publicação

O site é estático e publica no Cloudflare Pages a cada push na `main`.

| Campo | Valor |
| --- | --- |
| Framework preset | React (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

Endereço atual: [prumo.nicolasportie.com](https://prumo.nicolasportie.com). Cabeçalhos de cache e segurança ficam em `static/_headers`.

## Convenções

- **Commits** seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat`, `fix`, `docs`, `chore`, `ci` e `refactor`, com escopo quando ajuda (`feat(hero): ...`).
- **`main`** é a branch de produção e só recebe código que passa no `npm run build`.
- **Marca, cidade e contato** vivem em `src/data/studio.ts`. Trocar um deles é mexer ali e nos metadados do `index.html`.

## Licença

Todos os direitos reservados.
