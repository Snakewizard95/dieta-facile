// ==========================================================================
// emoji.js — trova l'emoji adatta a un alimento o a un piatto (da dati/emoji.json)
// ==========================================================================

let tabella = [];

export function impostaTabellaEmoji(dati) {
  tabella = (dati && dati.voci) || [];
}

/** Restituisce l'emoji per un nome, oppure una stringa vuota se non ne trova. */
export function emojiPer(nome) {
  const testo = String(nome || '').toLowerCase();
  for (const voce of tabella) {
    if (voce.parole.some(p => testo.includes(p))) return voce.emoji;
  }
  return '';
}

/** "🍝 Pasta integrale" — nome con l'emoji davanti, se esiste. */
export function conEmoji(nome) {
  const e = emojiPer(nome);
  return e ? `${e} ${nome}` : nome;
}
