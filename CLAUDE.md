# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gold Geek is a precious metals and jewelry buying platform, converted from WordPress/Elementor to Next.js. The site retains Elementor CSS classes and data attributes for styling compatibility.

## Commands

```bash
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Tech Stack
- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Swiper for carousels

### Path Alias
`@/*` maps to `./src/*`

### Component Organization

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── layout/             # Header, Footer, MobileMenu
│   ├── ui/                 # Motion/animation components
│   ├── sections/           # Page sections (TestimonialsCarousel)
│   └── widgets/            # External embeds (TradingViewWidget)
└── styles/
    └── elementor/          # Exported Elementor theme CSS
```

### Client vs Server Components
Interactive components use `"use client"`:
- All layout components (Header, Footer, MobileMenu)
- All motion/animation components (MotionFxContainer, MotionFxImage, ScrollRotatingImage)
- Swiper carousels and external widget embeds

Page layouts are server components.

### Motion System
Custom scroll-based animations in `src/components/ui/`:
- **MotionFxContainer**: Parallax translateY on scroll
- **MotionFxImage**: Combined translateY + rotateZ animations
- **ScrollRotatingImage**: Rotation tied to scroll position

All motion components support `disableOnMobile` (768px breakpoint).

### Styling
- Elementor CSS framework imported globally
- Inline styles for dynamic values
- Mobile breakpoint: 768px
- Color palette: gold accents (#AD7B2A, #FBEF9C), dark brown backgrounds (#57370D)
- Fonts: Poppins (primary), Alegreya Sans (secondary)

### Elementor Markup
Pages preserve Elementor structure with `data-elementor-type`, `data-elementor-id`, and container classes (`e-con`, `e-con-inner`). This is intentional for CSS compatibility.
