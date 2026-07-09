# Transfergit ⚽

**Tu GitHub, tasado como jugador de fútbol.**

Convertí cualquier perfil de GitHub en una ficha de jugador estilo Transfermarkt — con estética de transmisión deportiva nocturna: la seriedad editorial de Transfermarkt con producción de Champions League. Valor de mercado calculado en base a tu actividad real (commits, stars, pull requests, followers), historial de fichajes, lesiones (rachas sin commitear), estadísticas por temporada y scouting metrics.

Probalo con [`/torvalds`](https://transfergit.com/torvalds), [`/gaearon`](https://transfergit.com/gaearon) o tu propio usuario.

## Cómo funciona

1. Ingresás un usuario de GitHub.
2. `lib/github.ts` trae tu perfil público completo vía la API GraphQL de GitHub (contribuciones por año, repos, orgs, calendario de actividad).
3. `lib/player.ts` y el resto de `lib/` traducen esos datos a términos futboleros:
   - **Valor de mercado** (`lib/valuation.ts`): fórmula basada en commits, stars, followers, pull requests y repos con tracción, con multiplicadores por antigüedad de cuenta y forma reciente.
   - **Posición** (`lib/positions.ts`): según el lenguaje/categoría dominante en tus repos (frontend → Extremo derecho, backend → Mediocentro, devops → Arquero, etc.).
   - **Lesiones** (`lib/injuries.ts`): rachas sin actividad en el último año.
   - **Fichajes**: cambios de lenguaje dominante temporada a temporada + altas a organizaciones.
   - **Scouting metrics**: commits, stars, PRs, code reviews y racha de actividad, normalizados a una escala 0-99.
4. Todo se muestra en una ficha estilo Transfermarkt, exportable como imagen para README o redes.

No hay inputs manuales ni ediciones: todo se lee en vivo de tu perfil público.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (tokens de diseño vía `@theme inline` en `app/globals.css`, sin `tailwind.config`)
- **GSAP** para las animaciones de entrada (reveal del perfil y de la landing)
- **Recharts** para el gráfico de evolución de valor de mercado
- **next/og** (`ImageResponse`, Satori) para los endpoints de exportación de imagen — corren en Edge Runtime
- Fuentes: **Archivo Black** / **Archivo** / **Barlow Condensed**, cargadas con `next/font/google` en la web y como buffers `.ttf` propios (`assets/fonts/`) para Satori

## Sistema de diseño

Fondo con profundidad (nunca plano): gradiente radial + textura de ruido SVG (`feTurbulence`) + patrón de campo de juego sutil en los bordes de la landing.

| Token | Uso |
|---|---|
| `--pitch` `#0a0e1a` → `--pitch-elevated` `#141b2e` | Fondo base |
| `--tm-blue-deep` `#1a3151` (navy Transfermarkt) | Headers de secciones y tablas |
| `--value-green` `#00c853` | **Exclusivo** para el valor de mercado, flechas de tendencia y CTAs primarios |
| `--gold` `#ffc400` | Marcador de récord y highlights especiales |

Cards con borde blanco al 6%, sombra doble (ambiente + contacto) — clase utilitaria `.tm-card` en `globals.css`. Tilt 3D sutil en hover sobre la ficha principal (`components/TiltCard.tsx`).

## Animaciones (GSAP)

- **`components/ProfileReveal.tsx`**: orquesta la entrada del perfil — ficha principal → sidebar en stagger → gráfico → barras de scouting creciendo desde 0 → tabla de temporadas. Además migra el count-up del valor de mercado de `requestAnimationFrame` a GSAP.
- **`components/LandingReveal.tsx`**: titular con reveal por `clip-path` línea por línea, subtítulo/input con fade+rise, abanico de cards entrando con stagger y rotación, contador de fichas generadas.
- Todo respeta `prefers-reduced-motion`: si está activado, el estado final se aplica de forma instantánea, sin animar.

## Exportar tu ficha

Desde `/[username]` hay un panel de export (`components/ExportPanel.tsx`) con:

- **Preview en vivo** de dos variantes — *Full card* (1200×630, para OG/README) y *Compact* (900×1200, ficha coleccionable vertical).
- **Copy Markdown**: copia una imagen embebida que linkea a tu ficha — pegala en tu README de GitHub.
- **Download PNG** de la variante seleccionada.
- **Share on X / LinkedIn**.

Los endpoints (`app/api/og/[username]/route.tsx` y `.../card/route.tsx`) generan las imágenes en Edge Runtime con `next/og`, comparten los mismos tokens de color/tipografía que la web, y cachean con `s-maxage=86400, stale-while-revalidate`.

## Empezar

```bash
npm install
cp .env.example .env.local   # completá GITHUB_TOKEN con un Personal Access Token (sin permisos especiales, solo lectura pública)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GITHUB_TOKEN` | Sí | Personal Access Token de GitHub, solo para leer perfiles públicos vía GraphQL |
| `NEXT_PUBLIC_SITE_URL` | No | URL pública del sitio, usada en OG tags y en los links del panel de export. Sin configurar, cae a `VERCEL_URL` o `http://localhost:3000` |

## Estructura del proyecto

```
app/
  page.tsx                 # Landing
  [username]/page.tsx      # Ficha de jugador
  api/og/[username]/       # Endpoints de exportación de imagen (next/og)
components/                # UI de la ficha, landing y panel de export
lib/                       # Data fetching (GitHub GraphQL) y lógica de traducción a términos futboleros
assets/fonts/              # .ttf usados por Satori (no pueden cargarse por CSS)
public/fan-cards/          # Fichas de devs conocidos, pre-renderizadas para el abanico de la landing
```

## Build

```bash
npm run build
npm run start
```

---

Hecho por [@tobiager](https://github.com/tobiager).
