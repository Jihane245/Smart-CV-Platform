// ─────────────────────────────────────────────────────────────────────────
// Liste des polices Google Fonts les plus populaires, triées par catégorie.
// Utilisée par le picker de l'éditeur de templates.
// ─────────────────────────────────────────────────────────────────────────

export interface GoogleFont {
  name: string;          // Nom Google Fonts (ex: "Roboto", "Open Sans")
  category: GoogleFontCategory;
  cssFamily: string;     // Déclaration CSS complète (ex: '"Roboto", sans-serif')
}

export type GoogleFontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export const GOOGLE_FONTS: GoogleFont[] = [
  // ─── Sans-serif ───────────────────────────────────────────────────────
  { name: 'Roboto',           category: 'sans-serif', cssFamily: '"Roboto", sans-serif' },
  { name: 'Open Sans',        category: 'sans-serif', cssFamily: '"Open Sans", sans-serif' },
  { name: 'Lato',             category: 'sans-serif', cssFamily: '"Lato", sans-serif' },
  { name: 'Montserrat',       category: 'sans-serif', cssFamily: '"Montserrat", sans-serif' },
  { name: 'Poppins',          category: 'sans-serif', cssFamily: '"Poppins", sans-serif' },
  { name: 'Inter',            category: 'sans-serif', cssFamily: '"Inter", sans-serif' },
  { name: 'Raleway',          category: 'sans-serif', cssFamily: '"Raleway", sans-serif' },
  { name: 'Nunito',           category: 'sans-serif', cssFamily: '"Nunito", sans-serif' },
  { name: 'Rubik',            category: 'sans-serif', cssFamily: '"Rubik", sans-serif' },
  { name: 'Work Sans',        category: 'sans-serif', cssFamily: '"Work Sans", sans-serif' },
  { name: 'Quicksand',        category: 'sans-serif', cssFamily: '"Quicksand", sans-serif' },
  { name: 'Mulish',           category: 'sans-serif', cssFamily: '"Mulish", sans-serif' },
  { name: 'Fira Sans',        category: 'sans-serif', cssFamily: '"Fira Sans", sans-serif' },
  { name: 'PT Sans',          category: 'sans-serif', cssFamily: '"PT Sans", sans-serif' },
  { name: 'Source Sans 3',    category: 'sans-serif', cssFamily: '"Source Sans 3", sans-serif' },
  { name: 'Ubuntu',           category: 'sans-serif', cssFamily: '"Ubuntu", sans-serif' },
  { name: 'Cabin',            category: 'sans-serif', cssFamily: '"Cabin", sans-serif' },
  { name: 'Karla',            category: 'sans-serif', cssFamily: '"Karla", sans-serif' },
  { name: 'Heebo',            category: 'sans-serif', cssFamily: '"Heebo", sans-serif' },
  { name: 'Cairo',            category: 'sans-serif', cssFamily: '"Cairo", sans-serif' },
  { name: 'Oswald',           category: 'sans-serif', cssFamily: '"Oswald", sans-serif' },
  { name: 'Barlow',           category: 'sans-serif', cssFamily: '"Barlow", sans-serif' },
  { name: 'DM Sans',          category: 'sans-serif', cssFamily: '"DM Sans", sans-serif' },
  { name: 'Manrope',          category: 'sans-serif', cssFamily: '"Manrope", sans-serif' },
  { name: 'IBM Plex Sans',    category: 'sans-serif', cssFamily: '"IBM Plex Sans", sans-serif' },

  // ─── Serif ────────────────────────────────────────────────────────────
  { name: 'Merriweather',     category: 'serif', cssFamily: '"Merriweather", serif' },
  { name: 'Playfair Display', category: 'serif', cssFamily: '"Playfair Display", serif' },
  { name: 'Lora',             category: 'serif', cssFamily: '"Lora", serif' },
  { name: 'PT Serif',         category: 'serif', cssFamily: '"PT Serif", serif' },
  { name: 'Bitter',           category: 'serif', cssFamily: '"Bitter", serif' },
  { name: 'Crimson Text',     category: 'serif', cssFamily: '"Crimson Text", serif' },
  { name: 'Libre Baskerville',category: 'serif', cssFamily: '"Libre Baskerville", serif' },
  { name: 'Roboto Slab',      category: 'serif', cssFamily: '"Roboto Slab", serif' },
  { name: 'EB Garamond',      category: 'serif', cssFamily: '"EB Garamond", serif' },
  { name: 'Cormorant Garamond', category: 'serif', cssFamily: '"Cormorant Garamond", serif' },
  { name: 'Source Serif 4',   category: 'serif', cssFamily: '"Source Serif 4", serif' },

  // ─── Display ──────────────────────────────────────────────────────────
  { name: 'Bebas Neue',       category: 'display', cssFamily: '"Bebas Neue", sans-serif' },
  { name: 'Anton',            category: 'display', cssFamily: '"Anton", sans-serif' },
  { name: 'Abril Fatface',    category: 'display', cssFamily: '"Abril Fatface", serif' },
  { name: 'Fjalla One',       category: 'display', cssFamily: '"Fjalla One", sans-serif' },
  { name: 'Lobster',          category: 'display', cssFamily: '"Lobster", cursive' },
  { name: 'Comfortaa',        category: 'display', cssFamily: '"Comfortaa", sans-serif' },
  { name: 'Righteous',        category: 'display', cssFamily: '"Righteous", sans-serif' },

  // ─── Handwriting ──────────────────────────────────────────────────────
  { name: 'Pacifico',         category: 'handwriting', cssFamily: '"Pacifico", cursive' },
  { name: 'Dancing Script',   category: 'handwriting', cssFamily: '"Dancing Script", cursive' },
  { name: 'Caveat',           category: 'handwriting', cssFamily: '"Caveat", cursive' },
  { name: 'Indie Flower',     category: 'handwriting', cssFamily: '"Indie Flower", cursive' },
  { name: 'Permanent Marker', category: 'handwriting', cssFamily: '"Permanent Marker", cursive' },
  { name: 'Shadows Into Light', category: 'handwriting', cssFamily: '"Shadows Into Light", cursive' },

  // ─── Monospace ────────────────────────────────────────────────────────
  { name: 'Roboto Mono',      category: 'monospace', cssFamily: '"Roboto Mono", monospace' },
  { name: 'Source Code Pro',  category: 'monospace', cssFamily: '"Source Code Pro", monospace' },
  { name: 'Fira Code',        category: 'monospace', cssFamily: '"Fira Code", monospace' },
  { name: 'JetBrains Mono',   category: 'monospace', cssFamily: '"JetBrains Mono", monospace' },
  { name: 'Inconsolata',      category: 'monospace', cssFamily: '"Inconsolata", monospace' },
  { name: 'IBM Plex Mono',    category: 'monospace', cssFamily: '"IBM Plex Mono", monospace' },
];

export const FONT_CATEGORY_LABELS: Record<GoogleFontCategory, string> = {
  'sans-serif':  'Sans-serif',
  'serif':       'Serif',
  'display':     'Display',
  'handwriting': 'Manuscrite',
  'monospace':   'Monospace',
};

// ─────────────────────────────────────────────────────────────────────────
// Injection dynamique d'une police Google Fonts dans le <head> du document.
// Idempotent : si la police est déjà chargée, ne fait rien.
// ─────────────────────────────────────────────────────────────────────────
const LOADED_FONTS = new Set<string>();

export function loadGoogleFont(name: string): void {
  if (LOADED_FONTS.has(name)) return;
  LOADED_FONTS.add(name);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // On encode le nom et on demande quelques poids courants
  const family = name.trim().replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;600;700&display=swap`;
  link.dataset['googleFont'] = name;
  document.head.appendChild(link);
}

export function findGoogleFont(name: string): GoogleFont | undefined {
  return GOOGLE_FONTS.find((f) => f.name === name);
}
