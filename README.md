 # Shango Bashi Portfolio

A single-page portfolio experience by Shango Bashi built with React, Vite, and Tailwind CSS. The site showcases engineering disciplines, featured projects, and education & certifications with an animated hero canvas and light/dark-ready design system.

## Tech Stack

- **React** – component-driven UI
- **Vite** – lightning-fast bundler and dev server
- **Tailwind CSS** – utility-first styling and theming
- **Lucide Icons** – iconography for quick visual cues

## Getting Started

```bash
# install dependencies
npm install

# start local dev server
npm run dev

# build for production
npm run build

# preview the production build locally
npm run preview
```

## Project Structure

```
apps/web/
+-- index.html          # Vite entry HTML
+-- package.json        # scripts and dependencies
+-- src/
¦   +-- App.jsx         # main portfolio UI
¦   +-- index.css       # global Tailwind styles and typography
¦   +-- main.jsx        # React/Vite bootstrap
+-- tailwind.config.js  # Tailwind configuration
+-- postcss.config.js   # PostCSS plugins
+-- vercel.json         # Vercel deployment settings
```

## Environment & Deployment

The site is deployed on Vercel as a static build. Running `vercel deploy --prod` (after building) will publish the latest `dist/` output automatically under the configured aliases.

## License

This repository is private and all rights are reserved to Shango Bashi :).
