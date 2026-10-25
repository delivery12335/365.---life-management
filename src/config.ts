/// <reference types="vite/client" />

// GitHub Pages serves the presentation UI; account operations require the Node API.
export const staticPreview = import.meta.env.MODE === 'pages';
