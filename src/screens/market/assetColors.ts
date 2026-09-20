/**
 * La couleur d'un actif, pour sa pastille et son filet lateral.
 *
 * Les marques connues gardent leur couleur — un utilisateur reconnait l'orange
 * du Bitcoin avant de lire « BTC ». Le reste tombe sur une palette derivee du
 * ticker : deterministe, donc un actif garde sa couleur d'un ecran a l'autre,
 * et aucune couleur n'est a saisir au moment de lister.
 */

export interface AssetColor {
  /** Le filet lateral et l'accent. */
  accent: string;
  /** Le fond de la pastille, clair. */
  tint: string;
  /** Le texte sur la pastille, assez sombre pour rester lisible. */
  ink: string;
}

const KNOWN: Record<string, AssetColor> = {
  BTC: { accent: '#F7931A', tint: '#FDF0DC', ink: '#8A5200' },
  ETH: { accent: '#627EEA', tint: '#E6EBFB', ink: '#1E3A8A' },
  SOL: { accent: '#14B8A6', tint: '#DDF5F1', ink: '#0F5F57' },
  BNB: { accent: '#F0B90B', tint: '#FDF4D7', ink: '#7A5C00' },
  QQQ: { accent: '#0EA5E9', tint: '#E0F2FE', ink: '#0C4A6E' },
  NDAQ: { accent: '#0891B2', tint: '#DCF2F7', ink: '#0B4A57' },
  AAPL: { accent: '#6B7280', tint: '#EEF0F3', ink: '#30343B' },
  TSLA: { accent: '#DC2626', tint: '#FDE7E7', ink: '#7F1D1D' },
  NVDA: { accent: '#76B900', tint: '#EBF6D9', ink: '#3E5F00' },
  MSFT: { accent: '#2563EB', tint: '#E3EBFD', ink: '#1E3A8A' },
};

// Palette de repli. Assez de teintes pour qu'une liste ordinaire n'en repete
// aucune, et toutes assez soutenues pour tenir sur un filet de 4 pixels.
const FALLBACK: AssetColor[] = [
  { accent: '#8039DD', tint: '#F1E9FC', ink: '#41008F' },
  { accent: '#DB2777', tint: '#FCE7F1', ink: '#831843' },
  { accent: '#EA580C', tint: '#FDEDE2', ink: '#7C2D12' },
  { accent: '#059669', tint: '#DEF3EC', ink: '#064E3B' },
  { accent: '#4F46E5', tint: '#E8E7FC', ink: '#312E81' },
  { accent: '#0D9488', tint: '#DCF1EF', ink: '#134E4A' },
];

export const colorOf = (shortName: string): AssetColor => {
  const key = (shortName || '').toUpperCase();
  if (KNOWN[key]) return KNOWN[key];
  // Somme des codes plutot qu'un aleatoire : le meme ticker doit donner la
  // meme couleur a chaque rendu, sinon la liste scintille au rafraichissement.
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return FALLBACK[sum % FALLBACK.length];
};
