/// <reference types="vite/client" />

// GitHub Pages serves the presentation UI; account operations require the Node API.
export const cloudUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
export const cloudKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
export const cloudEnabled = !!cloudUrl && !!cloudKey;
export const staticPreview = import.meta.env.MODE === 'pages' && !cloudEnabled;
