// ==========================================================================
// calorie.js — stima INDICATIVA delle calorie di pasti e giornate
// ==========================================================================
//
// I valori vengono da dati/calorie.json (tabelle pubbliche, arrotondati).
// La stima ignora la verdura "a volontà" e il pasto libero, e non conosce le
// sostituzioni fatte a tavola: va letta come curiosità, con un errore tipico
// del 15% per porzione. Il piano è già bilanciato dalla nutrizionista.

import { SLOT_PRINCIPALI, leggiExtra, GIORNI } from './stato.js';
import { trovaOpzione, trovaCarbo, trovaSecondo } from './dati.js';
import { quantitaCarbo, varianteScelta, ingredientiEffettivi } from './vincoli.js';

let tabella = [];

export function impostaTabellaCalorie(dati) {
  tabella = (dati && dati.voci) || [];
}

/** Vero se la tabella dei valori è stata caricata. */
export function calorieDisponibili() {
  return tabella.length > 0;
}

function vocePer(nome) {
  const testo = String(nome || '').toLowerCase();
  return tabella.find(v => v.parole.some(p => testo.includes(p))) || null;
}

/** Calorie di una quantità di ingrediente, oppure null se l'alimento non è in tabella. */
export function kcalIngrediente(nome, q, u) {
  const v = vocePer(nome);
  if (!v) return null;
  if (u === 'pz') return v.kcalPz != null ? q * v.kcalPz : null;
  return v.kcal100 != null ? (q / 100) * v.kcal100 : null;
}

/** Calorie di un pasto: { kcal, incompleto, libero, vuoto } */
export function kcalPasto(dieta, piano, giorno, slot) {
  const scelta = piano.scelte[giorno][slot];
  const extra = leggiExtra(piano, giorno, slot);
  let kcal = 0;
  let incompleto = false;
  const somma = (nome, q, u) => {
    const k = kcalIngrediente(nome, q, u);
    if (k == null) incompleto = true;
    else kcal += k;
  };

  if (SLOT_PRINCIPALI.includes(slot)) {
    const carbo = trovaCarbo(dieta, slot, scelta.carbo);
    const secondo = trovaSecondo(dieta, slot, scelta.secondo);
    if (!carbo && !secondo) return { kcal: 0, incompleto: false, libero: false, vuoto: true };
    if (secondo && secondo.categoria === 'libero') return { kcal: 0, incompleto: false, libero: true, vuoto: false };
    if (carbo) {
      const qc = quantitaCarbo(carbo, secondo);
      const vc = varianteScelta(carbo, extra, 'carbo');
      somma(vc ? vc.nome : carbo.nome, qc.q, qc.u);
    }
    if (secondo) {
      const vs = varianteScelta(secondo, extra, 'secondo');
      for (const ing of ingredientiEffettivi(secondo, vs)) somma(ing.nome, ing.q, ing.u);
    }
    somma(dieta[slot].olio.nome, dieta[slot].olio.q, dieta[slot].olio.u);
  } else {
    const opz = trovaOpzione(dieta, slot, scelta);
    if (!opz) return { kcal: 0, incompleto: false, libero: false, vuoto: true };
    const vo = varianteScelta(opz, extra, null);
    for (const ing of ingredientiEffettivi(opz, vo)) {
      const nome = ing.tipo === 'frutta' && extra.frutta ? extra.frutta : ing.nome;
      somma(nome, ing.q, ing.u);
    }
  }
  return { kcal, incompleto, libero: false, vuoto: false };
}

/** Calorie di una giornata: { kcal, incompleto, libero, pasti } */
export function kcalGiorno(dieta, piano, giorno) {
  let kcal = 0, incompleto = false, libero = false, pasti = 0;
  for (const s of dieta.slot) {
    const k = kcalPasto(dieta, piano, giorno, s.id);
    if (k.vuoto) continue;
    pasti++;
    if (k.libero) { libero = true; continue; }
    kcal += k.kcal;
    if (k.incompleto) incompleto = true;
  }
  return { kcal, incompleto, libero, pasti };
}

/** Media giornaliera sui giorni con almeno 4 pasti pianificati (esclusi i pasti liberi). */
export function kcalMediaSettimana(dieta, piano) {
  let tot = 0, giorni = 0;
  for (const g of GIORNI) {
    const k = kcalGiorno(dieta, piano, g);
    if (k.pasti >= 4) { tot += k.kcal; giorni++; }
  }
  return giorni ? { media: tot / giorni, giorni } : null;
}

/** "1 650" — arrotondato alle decine, con separatore delle migliaia. */
export function formattaKcal(n) {
  return (Math.round(n / 10) * 10).toLocaleString('it-IT');
}
