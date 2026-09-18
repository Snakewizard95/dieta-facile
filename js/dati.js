// ==========================================================================
// dati.js — caricamento dei file JSON: dieta, ricettario, stagionalità
// ==========================================================================

let cache = null;

/** Carica i tre JSON (una sola volta). In caso di errore lancia un messaggio in italiano. */
export async function caricaDati() {
  if (cache) return cache;
  const [dieta, ricette, stagioni] = await Promise.all([
    caricaJson('dati/dieta.json'),
    caricaJson('dati/ricette.json'),
    caricaJson('dati/stagioni.json')
  ]);
  cache = { dieta, ricette, stagioni };
  return cache;
}

async function caricaJson(percorso) {
  const risposta = await fetch(percorso);
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
