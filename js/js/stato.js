// ==========================================================================
// stato.js — i piani settimanali (una o più persone), salvati in localStorage
// e condivisibili tra dispositivi tramite sync.js
// ==========================================================================
//
// Struttura dello stato (versione 2):
// {
//   versione: 2,
//   settimanaDel: "2026-09-14",                   // lunedì della settimana
//   persone: [ { id: "p1", nome: "Davide" }, { id: "p2", nome: "Anna" } ],
//   piani: {
//     p1: {
//       scelte: { lun: { colazione: "col-...", spuntino: "...", pranzo: { carbo, secondo }, merenda, cena: {...}, dopocena }, ... },
//       extra:  { "lun.colazione": { frutta: "uva" }, "lun.pranzo": { verdura: ["zucchine", "peperoni"] } },
//       aggiornatoIl: "2026-09-18T10:00:00.000Z"
//     },
//     p2: { ... }
//   },
//   spuntate: { "Pane|g": true },                  // voci della spesa già prese (in comune)
//   spuntateIl: "...",
//   aggiornatoIl: "..."                            // ultima modifica a settimana o persone
// }

const CHIAVE = 'dietaFacile.piano.v2';
const CHIAVE_V1 = 'dietaFacile.piano.v1';
const CHIAVE_UI = 'dietaFacile.ui.v1';

export const GIORNI = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
export const SLOT_PRINCIPALI = ['pranzo', 'cena'];

export function adesso() {
  return new Date().toISOString();
}

/** Data (AAAA-MM-GG, ora locale) del lunedì della settimana che contiene `data`. */
export function lunediDi(data = new Date()) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const scarto = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - scarto);
  const aa = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const gg = String(d.getDate()).padStart(2, '0');
  return `${aa}-${mm}-${gg}`;
}

/** Testo tipo "14 settembre – 20 settembre 2026". */
export function descriviSettimana(lunedi) {
  const [aa, mm, gg] = lunedi.split('-').map(Number);
  const inizio = new Date(aa, mm - 1, gg);
  const fine = new Date(aa, mm - 1, gg + 6);
  const fmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' });
  return `${fmt.format(inizio)} – ${fmt.format(fine)} ${fine.getFullYear()}`;
}

/** Numero del mese (1-12) del lunedì della settimana. */
export function meseDellaSettimana(lunedi) {
  return Number(lunedi.split('-')[1]);
}

function giornoVuoto() {
  return {
    colazione: null,
    spuntino: null,
    pranzo: { carbo: null, secondo: null },
    merenda: null,
    cena: { carbo: null, secondo: null },
    dopocena: null
  };
}

export function pianoVuoto() {
  const scelte = {};
  for (const g of GIORNI) scelte[g] = giornoVuoto();
  return { scelte, extra: {}, aggiornatoIl: null };
}

export function statoVuoto(lunedi = lunediDi()) {
  return {
    versione: 2,
    settimanaDel: lunedi,
    persone: [{ id: 'p1', nome: 'Persona 1' }, { id: 'p2', nome: 'Persona 2' }],
    piani: { p1: pianoVuoto(), p2: pianoVuoto() },
    spuntate: {},
    spuntateIl: null,
    aggiornatoIl: null
  };
}

// --- Caricamento e salvataggio locale ---------------------------------------

export function carica() {
  try {
    const testo = localStorage.getItem(CHIAVE);
    if (testo) {
      const s = JSON.parse(testo);
      if (valido(s)) return normalizza(s);
    }
    // Migrazione dalla versione 1 (una sola persona)
    const vecchio = localStorage.getItem(CHIAVE_V1);
    if (vecchio) {
      const s1 = JSON.parse(vecchio);
      if (s1 && s1.scelte) {
        const s = statoVuoto(s1.settimanaDel || lunediDi());
        s.piani.p1 = normalizzaPiano({ scelte: s1.scelte, extra: {}, aggiornatoIl: adesso() });
        s.spuntate = s1.spuntate || {};
        return s;
      }
    }
  } catch (e) {
    console.warn('Stato non leggibile, riparto da zero:', e);
  }
  return statoVuoto();
}

export function salva(stato) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
    return true;
  } catch (e) {
    console.warn('Impossibile salvare:', e);
    return false;
  }
}

export function caricaUi() {
  try {
    return JSON.parse(localStorage.getItem(CHIAVE_UI)) || {};
  } catch (e) {
    return {};
  }
}

export function salvaUi(ui) {
  try {
    localStorage.setItem(CHIAVE_UI, JSON.stringify(ui));
  } catch (e) { /* ignorato */ }
}

// --- Modifiche ---------------------------------------------------------------

/** Restituisce il piano di una persona (lo crea se manca). */
export function pianoDi(stato, personaId) {
  if (!stato.piani[personaId]) stato.piani[personaId] = pianoVuoto();
  return stato.piani[personaId];
}

/** Imposta una scelta nel piano. Per pranzo e cena `ruolo` è "carbo" o "secondo". */
export function impostaScelta(piano, giorno, slot, valore, ruolo = null) {
  if (SLOT_PRINCIPALI.includes(slot)) {
    piano.scelte[giorno][slot][ruolo] = valore;
  } else {
    piano.scelte[giorno][slot] = valore;
  }
  piano.aggiornatoIl = adesso();
  return piano;
}

/** Dettagli extra di un pasto: frutto scelto, verdure scelte. */
export function leggiExtra(piano, giorno, slot) {
  return (piano.extra && piano.extra[`${giorno}.${slot}`]) || {};
}

export function impostaExtra(piano, giorno, slot, chiave, valore) {
  if (!piano.extra) piano.extra = {};
  const k = `${giorno}.${slot}`;
  const attuale = { ...(piano.extra[k] || {}) };
  if (valore === null || valore === undefined || (Array.isArray(valore) && valore.length === 0)) {
    delete attuale[chiave];
  } else {
    attuale[chiave] = valore;
  }
  if (Object.keys(attuale).length === 0) delete piano.extra[k];
  else piano.extra[k] = attuale;
  piano.aggiornatoIl = adesso();
  return piano;
}

/** Svuota il piano di una persona. */
export function svuotaPiano(piano) {
  const vuoto = pianoVuoto();
  piano.scelte = vuoto.scelte;
  piano.extra = {};
  piano.aggiornatoIl = adesso();
  return piano;
}

/** Nuova settimana vuota per tutte le persone. */
export function nuovaSettimana(stato, lunedi) {
  stato.settimanaDel = lunedi;
  for (const p of stato.persone) {
    stato.piani[p.id] = pianoVuoto();
    stato.piani[p.id].aggiornatoIl = adesso();
  }
  stato.spuntate = {};
  stato.spuntateIl = adesso();
  stato.aggiornatoIl = adesso();
  return stato;
}

export function impostaSpuntata(stato, chiave, presa) {
  if (presa) stato.spuntate[chiave] = true;
  else delete stato.spuntate[chiave];
  stato.spuntateIl = adesso();
}

export function azzeraSpuntate(stato) {
  stato.spuntate = {};
  stato.spuntateIl = adesso();
}

/** Rinomina, aggiunge o toglie persone. `persone` = [{id, nome}]. */
export function impostaPersone(stato, persone) {
  stato.persone = persone.map(p => ({ id: p.id, nome: (p.nome || '').trim() || 'Senza nome' }));
  for (const p of stato.persone) pianoDi(stato, p.id);
  for (const id of Object.keys(stato.piani)) {
    if (!stato.persone.some(p => p.id === id)) delete stato.piani[id];
  }
  stato.aggiornatoIl = adesso();
}

export function nuovoIdPersona(stato) {
  let n = 1;
  while (stato.persone.some(p => p.id === `p${n}`) || stato.piani[`p${n}`]) n++;
  return `p${n}`;
}

// --- Backup ------------------------------------------------------------------

export function esporta(stato) {
  return JSON.stringify(stato, null, 2);
}

export function importa(testo) {
  const s = JSON.parse(testo);
  if (s && s.scelte && !s.piani) {
    // backup della versione 1
    const nuovo = statoVuoto(s.settimanaDel || lunediDi());
    nuovo.piani.p1 = normalizzaPiano({ scelte: s.scelte, extra: {}, aggiornatoIl: adesso() });
    nuovo.spuntate = s.spuntate || {};
    return nuovo;
  }
  if (!valido(s)) throw new Error('Il file non contiene un piano settimanale valido.');
  return normalizza(s);
}

// --- Fusione tra dispositivi -----------------------------------------------

/**
 * Unisce lo stato locale con quello remoto: per ogni persona vince il piano
 * modificato più di recente; per le spunte e per settimana/persone vince
 * il più recente. A parità vince il remoto.
 */
export function unisci(locale, remoto) {
  const L = normalizza(locale);
  const R = normalizza(remoto);
  const base = (R.aggiornatoIl || '') >= (L.aggiornatoIl || '') ? R : L;
  const risultato = {
    versione: 2,
    settimanaDel: base.settimanaDel,
    persone: base.persone.map(p => ({ ...p })),
    piani: {},
    spuntate: {},
    spuntateIl: null,
    aggiornatoIl: base.aggiornatoIl
  };
  for (const p of risultato.persone) {
    const pl = L.piani[p.id];
    const pr = R.piani[p.id];
    if (pl && pr) {
      risultato.piani[p.id] = clona((pr.aggiornatoIl || '') >= (pl.aggiornatoIl || '') ? pr : pl);
    } else {
      risultato.piani[p.id] = clona(pr || pl || pianoVuoto());
    }
  }
  const spunteBase = (R.spuntateIl || '') >= (L.spuntateIl || '') ? R : L;
  risultato.spuntate = { ...spunteBase.spuntate };
  risultato.spuntateIl = spunteBase.spuntateIl;
  return risultato;
}

export function uguali(a, b) {
  return JSON.stringify(normalizza(a)) === JSON.stringify(normalizza(b));
}

function clona(x) {
  return JSON.parse(JSON.stringify(x));
}

// --- Validazione -------------------------------------------------------------

function valido(s) {
  return s && typeof s === 'object' && s.piani && typeof s.piani === 'object' && Array.isArray(s.persone);
}

function normalizzaPiano(p) {
  const base = pianoVuoto();
  const scelte = (p && p.scelte) || {};
  for (const g of GIORNI) {
    const vecchio = scelte[g] || {};
    const nuovo = base.scelte[g];
    for (const slot of Object.keys(nuovo)) {
      if (vecchio[slot] === undefined) continue;
      if (SLOT_PRINCIPALI.includes(slot)) {
        nuovo[slot] = {
          carbo: (vecchio[slot] && vecchio[slot].carbo) || null,
          secondo: (vecchio[slot] && vecchio[slot].secondo) || null
        };
      } else {
        nuovo[slot] = vecchio[slot] || null;
      }
    }
  }
  base.extra = p && p.extra && typeof p.extra === 'object' ? clona(p.extra) : {};
  base.aggiornatoIl = (p && p.aggiornatoIl) || null;
  return base;
}

export function normalizza(s) {
  const base = statoVuoto(s.settimanaDel || lunediDi());
  base.persone = Array.isArray(s.persone) && s.persone.length > 0
    ? s.persone.map(p => ({ id: String(p.id), nome: String(p.nome || 'Senza nome') }))
    : base.persone;
  base.piani = {};
  for (const p of base.persone) base.piani[p.id] = normalizzaPiano(s.piani ? s.piani[p.id] : null);
  base.spuntate = s.spuntate && typeof s.spuntate === 'object' ? { ...s.spuntate } : {};
  base.spuntateIl = s.spuntateIl || null;
  base.aggiornatoIl = s.aggiornatoIl || null;
  return base;
}
