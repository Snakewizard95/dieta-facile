// ==========================================================================
// dati.js — caricamento dei file JSON: dieta, ricettario, stagionalità
// ==========================================================================

let cache = null;

// Versione dei dati: deve coincidere con ?v= in index.html e con VERSIONE in sw.js.
// Serve a scavalcare le cache (GitHub Pages, browser) quando si pubblica un aggiornamento.
export const VERSIONE_DATI = '8';

/** Carica i tre JSON (una sola volta). In caso di errore lancia un messaggio in italiano. */
export async function caricaDati() {
  if (cache) return cache;
  const [dieta, ricette, stagioni, emoji, calorie] = await Promise.all([
    caricaJson('dati/dieta.json'),
    caricaJson('dati/ricette.json'),
    caricaJson('dati/stagioni.json'),
    caricaJson('dati/emoji.json'),
    caricaJson('dati/calorie.json')
  ]);
  cache = { dieta, ricette, stagioni, emoji, calorie };
  return cache;
}

async function caricaJson(percorso) {
  const risposta = await fetch(`${percorso}?v=${VERSIONE_DATI}`);
  if (!risposta.ok) throw new Error(`Impossibile caricare ${percorso} (errore ${risposta.status})`);
  try {
    return await risposta.json();
  } catch (e) {
    throw new Error(`Il file ${percorso} non è un JSON valido: ${e.message}`);
  }
}

/** Opzione di uno slot semplice (colazione, spuntino, merenda, dopocena). */
export function trovaOpzione(dieta, slotId, id) {
  if (!id) return null;
  const lista = dieta[slotId] && dieta[slotId].opzioni;
  return lista ? lista.find(o => o.id === id) || null : null;
}

export function trovaCarbo(dieta, slotId, id) {
  if (!id) return null;
  const lista = dieta[slotId] && dieta[slotId].carboidrati;
  return lista ? lista.find(o => o.id === id) || null : null;
}

export function trovaSecondo(dieta, slotId, id) {
  if (!id) return null;
  const lista = dieta[slotId] && dieta[slotId].secondi;
  return lista ? lista.find(o => o.id === id) || null : null;
}
