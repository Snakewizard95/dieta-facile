// ==========================================================================
// ricette.js — scheda "Ricette": suggerimenti per la settimana e ricettario completo
// ==========================================================================

import { GIORNI, SLOT_PRINCIPALI, caricaUi, salvaUi, pianoDi } from './stato.js';
import { trovaOpzione, trovaCarbo, trovaSecondo } from './dati.js';
import { haTag } from './vincoli.js';
import { apriFoglio } from './foglio.js';
import { emojiPer, conEmoji } from './emoji.js';

const MAX_SUGGERITE = 4;

/**
 * Ricette adatte a un pasto principale: stesso slot e stessa categoria di secondo.
 * Vengono prima quelle che usano anche il carboidrato scelto, poi le più facili,
 * poi le ricette con procedimento prima delle semplici idee.
 */
export function ricettePerPasto(ricette, slot, secondo, carbo) {
  if (!secondo || secondo.categoria === 'libero') return [];
  const tagCarbo = carbo ? (carbo.tag || []) : [];
  return ricette.ricette
    .filter(r => r.slot.includes(slot) && r.tag.includes(secondo.categoria))
    .map(r => ({
      ricetta: r,
      punteggio: (tagCarbo.some(t => r.tag.includes(t)) ? 10 : 0) + (r.categoria !== 'idea' ? 2 : 0) + (3 - (r.difficolta || 1))
    }))
    .sort((a, b) => b.punteggio - a.punteggio || a.ricetta.nome.localeCompare(b.ricetta.nome, 'it'))
    .map(x => x.ricetta);
}

export function trovaRicetta(ricette, id) {
  return ricette.ricette.find(r => r.id === id) || null;
}

/** ctx = { dieta, ricette, stato } */
export function montaRicette(contenitore, ctx) {
  let ricerca = '';
  let categoriaFiltro = 'tutte';

  function persona() {
    const ui = caricaUi();
    const lista = ctx.stato.persone;
    return lista.find(p => p.id === ui.persona) || lista[0];
  }

  function disegna() {
    const { dieta, ricette, stato } = ctx;
    contenitore.innerHTML = '';
    const p = persona();
    const piano = pianoDi(stato, p.id);

    // --- Selettore persona -------------------------------------------------
    if (stato.persone.length > 1) {
      const box = el('div', 'persone');
      for (const pers of stato.persone) {
        const b = el('button', 'persona-btn' + (pers.id === p.id ? ' attivo' : ''), pers.nome);
        b.type = 'button';
        b.addEventListener('click', () => { salvaUi({ ...caricaUi(), persona: pers.id }); disegna(); });
        box.appendChild(b);
      }
      contenitore.appendChild(box);
    }

    // --- Suggerimenti per la settimana ---------------------------------------
    contenitore.appendChild(el('h3', 'reparto-titolo', `Suggerite per la settimana di ${p.nome}`));
    let trovate = 0;

    for (const g of dieta.giorni) {
      for (const s of dieta.slot) {
        const scelta = piano.scelte[g.id][s.id];
        let lista = [];
        let intestazione = '';

        if (SLOT_PRINCIPALI.includes(s.id)) {
          const secondo = trovaSecondo(dieta, s.id, scelta.secondo);
          const carbo = trovaCarbo(dieta, s.id, scelta.carbo);
          if (!secondo || secondo.categoria === 'libero') continue;
          lista = ricettePerPasto(ricette, s.id, secondo, carbo).slice(0, MAX_SUGGERITE);
          intestazione = `${g.nome} · ${s.nome} — ${secondo.nome}${carbo ? ' + ' + carbo.nome.replace(/ \(.*\)$/, '') : ''}`;
        } else {
          const opz = trovaOpzione(dieta, s.id, scelta);
          if (!opz || !opz.ricetta) continue;
          const r = trovaRicetta(ricette, opz.ricetta);
          if (!r) continue;
          lista = [r];
          intestazione = `${g.nome} · ${s.nome} — ${opz.nome}`;
        }
        if (!lista.length) continue;
        trovate++;

        const blocco = el('div', 'blocco-pasto');
        blocco.appendChild(el('div', 'blocco-titolo', intestazione));
        for (const r of lista) blocco.appendChild(cartaRicetta(r));
        contenitore.appendChild(blocco);
      }
    }
    if (!trovate) {
      contenitore.appendChild(el('p', 'nota', 'Compila qualche pranzo o cena nella scheda Settimana: qui compariranno le ricette adatte ai secondi scelti.'));
    }

    // --- Ricettario completo ---------------------------------------------------
    contenitore.appendChild(el('h3', 'reparto-titolo', 'Tutto il ricettario'));

    const cerca = document.createElement('input');
    cerca.type = 'search';
    cerca.className = 'cerca';
    cerca.placeholder = 'Cerca per nome o ingrediente…';
    cerca.value = ricerca;
    cerca.addEventListener('input', () => { ricerca = cerca.value; disegnaElenco(); });
    contenitore.appendChild(cerca);

    const chips = el('div', 'chips');
    const categorie = [{ id: 'tutte', nome: 'Tutte' }, ...ricette.categorie];
    for (const c of categorie) {
      const b = el('button', 'chip chip-btn' + (c.id === categoriaFiltro ? ' attiva' : ''), c.nome);
      b.type = 'button';
      b.addEventListener('click', () => {
        categoriaFiltro = c.id;
        for (const altro of chips.children) altro.classList.toggle('attiva', altro === b);
        disegnaElenco();
      });
      chips.appendChild(b);
    }
    contenitore.appendChild(chips);

    const elenco = el('div', 'elenco-ricette');
    contenitore.appendChild(elenco);

    function disegnaElenco() {
      elenco.innerHTML = '';
      const q = ricerca.trim().toLowerCase();
      const lista = ricette.ricette.filter(r => {
        if (categoriaFiltro !== 'tutte' && r.categoria !== categoriaFiltro) return false;
        if (!q) return true;
        const testo = [r.nome, ...(r.ingredienti || []), ...(r.tag || [])].join(' ').toLowerCase();
        return testo.includes(q);
      });
      if (!lista.length) {
        elenco.appendChild(el('p', 'nota', 'Nessuna ricetta trovata.'));
        return;
      }
      for (const r of lista) elenco.appendChild(cartaRicetta(r));
    }
    disegnaElenco();
  }

  function cartaRicetta(r) {
    const b = el('button', 'carta-ricetta');
    b.type = 'button';
    const riga = el('div', 'carta-ricetta-riga');
    riga.appendChild(el('span', 'carta-ricetta-emoji', emojiPer(r.nome) || emojiPer((r.tag || []).join(' ')) || '🍽️'));
    const testo = el('div', 'carta-ricetta-testo');
    testo.appendChild(el('div', 'carta-ricetta-nome', r.nome));
    const dettagli = [];
    dettagli.push(r.categoria === 'idea' ? 'idea' : (r.difficolta >= 2 ? 'media' : 'facile'));
    if (r.porzioni) dettagli.push(`${r.porzioni} porzioni`);
    testo.appendChild(el('div', 'carta-ricetta-dettaglio', dettagli.join(' · ')));
    riga.appendChild(testo);
    b.appendChild(riga);
    b.addEventListener('click', () => apriRicetta(r));
    return b;
  }

  function apriRicetta(r) {
    const corpo = document.createElement('div');
    const nomeCat = (ctx.ricette.categorie.find(c => c.id === r.categoria) || {}).nome || '';
    const info = [nomeCat];
    if (r.categoria !== 'idea') info.push(r.difficolta >= 2 ? 'difficoltà media' : 'facile');
    if (r.porzioni) info.push(`per ${r.porzioni} porzioni`);
    if (r.slot && r.slot.length) info.push(`adatta a: ${r.slot.map(s => (ctx.dieta.slot.find(x => x.id === s) || { nome: s }).nome.toLowerCase()).join(', ')}`);
    corpo.appendChild(el('p', 'nota', info.join(' · ')));

    if (r.categoria === 'idea') {
      corpo.appendChild(el('p', null, 'È un\'idea di pasto del piano, senza procedimento: usa le grammature della tua settimana.'));
    } else {
      corpo.appendChild(el('div', 'foglio-sezione', 'Ingredienti'));
      const ul = el('ul', 'lista-ingredienti');
      for (const ing of r.ingredienti) ul.appendChild(el('li', null, conEmoji(ing)));
      corpo.appendChild(ul);
      corpo.appendChild(el('div', 'foglio-sezione', 'Procedimento'));
      corpo.appendChild(el('p', 'procedimento', r.procedimento));
    }
    corpo.appendChild(el('p', 'nota', 'Le quantità "da dieta" sono quelle della tua settimana: usa le grammature mostrate nella scheda Settimana.'));
    apriFoglio(`${emojiPer(r.nome) || '🍽️'} ${r.nome}`, corpo);
  }

  function el(tag, classe, testo) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (testo != null) e.textContent = testo;
    return e;
  }

  disegna();
  return { disegna };
}
