// ==========================================================================
// app.js — avvio dell'applicazione, scelta della dieta, navigazione, sincronizzazione
// ==========================================================================

import { caricaDati, caricaRegistro } from './dati.js';
import * as Stato from './stato.js';
import { montaSettimana } from './settimana.js';
import { montaSpesa } from './spesa.js';
import { montaRicette } from './ricette.js';
import { impostaTabellaEmoji } from './emoji.js';
import { impostaTabellaCalorie } from './calorie.js';
import { Sincronizzatore } from './sync.js';
import { apriImpostazioni } from './impostazioni.js';
import { apriFoglio, chiudiFoglio, foglioAperto } from './foglio.js';

const SCHEDE = ['settimana', 'spesa', 'ricette'];

/**
 * Decide quale dieta caricare, in quest'ordine:
 *  1. ?dieta=<id> nell'indirizzo (link dato a una famiglia): viene salvato come preferenza;
 *  2. la preferenza già salvata sul dispositivo;
 *  3. se il registro ha una sola dieta, quella;
 *  4. altrimenti chiede all'utente.
 */
async function scegliDieta(registro) {
  const daLink = new URLSearchParams(location.search).get('dieta');
  if (daLink && registro.some(d => d.id === daLink)) {
    Stato.salvaUi({ ...Stato.caricaUi(), dieta: daLink });
    // toglie il parametro dall'indirizzo, così l'app installata non lo tiene per sempre
    history.replaceState(null, '', location.pathname);
    return daLink;
  }
  const salvata = Stato.caricaUi().dieta;
  if (salvata && registro.some(d => d.id === salvata)) return salvata;
  if (registro.length === 1) return registro[0].id;

  return new Promise(risolvi => {
    const corpo = document.createElement('div');
    const nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = 'Questa app contiene più diete. Scegli quella che segue la tua famiglia: la scelta resta su questo dispositivo e si può cambiare dalle Impostazioni.';
    corpo.appendChild(nota);
    for (const d of registro) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opzione';
      b.innerHTML = '<span class="nome"></span>';
      b.querySelector('.nome').textContent = d.nome;
      b.addEventListener('click', () => {
        Stato.salvaUi({ ...Stato.caricaUi(), dieta: d.id });
        chiudiFoglio();
        risolvi(d.id);
      });
      corpo.appendChild(b);
    }
    apriFoglio('Quale dieta?', corpo);
  });
}

/** Ricarica l'app impostando un'altra dieta come preferenza del dispositivo. */
export function cambiaDieta(dietaId) {
  Stato.salvaUi({ ...Stato.caricaUi(), dieta: dietaId, persona: null });
  location.replace(location.pathname);
}

async function avvia() {
  const erroreBox = document.getElementById('errore');

  let dati, dietaId;
  try {
    const registro = await caricaRegistro();
    dietaId = await scegliDieta(registro);
    dati = await caricaDati(dietaId);
  } catch (e) {
    erroreBox.hidden = false;
    erroreBox.textContent = `Non riesco a caricare la dieta: ${e.message}. ` +
      'Se stai aprendo il file direttamente, avvia il server locale come spiegato nel README.';
    return;
  }

  impostaTabellaEmoji(dati.emoji);
  impostaTabellaCalorie(dati.calorie);
  const stato = Stato.carica(dietaId);
  stato.dietaId = dietaId;
  let schedaAttiva = 'settimana';
  const viste = {};

  const ctx = {
    dietaId,
    dietaInfo: dati.dietaInfo,
    dieta: dati.dieta,
    ricette: dati.ricette,
    stagioni: dati.stagioni,
    stato,
    /** Salva in locale e programma l'invio a GitHub. */
    salva() {
      Stato.salva(stato);
      sync.programma();
    },
    /** Sostituisce il contenuto dello stato mantenendo lo stesso oggetto. */
    applicaStato(nuovo) {
      for (const k of Object.keys(stato)) delete stato[k];
      Object.assign(stato, nuovo);
      stato.dietaId = dietaId;
    },
    aggiornaIntestazione() {
      document.getElementById('settimana-corrente').textContent = Stato.descriviSettimana(stato.settimanaDel);
      const h1 = document.querySelector('.intestazione h1');
      if (h1) h1.title = dati.dietaInfo.nome;
    },
    ridisegna() {
      ctx.aggiornaIntestazione();
      if (viste[schedaAttiva] && viste[schedaAttiva].disegna) viste[schedaAttiva].disegna();
    },
    cambiaDieta
  };

  // Sincronizzazione con GitHub (se configurata)
  const sync = new Sincronizzatore({
    stato,
    salvaLocale: () => Stato.salva(stato),
    applicaStato: nuovo => {
      ctx.applicaStato(nuovo);
      if (!foglioAperto()) ctx.ridisegna();
    },
    // Il repository privato contiene un'altra dieta: si passa a quella
    suDietaDiversa: altraDieta => {
      alert(`Il repository di sincronizzazione contiene la dieta "${altraDieta}". L'app si ricarica con quella dieta.`);
      cambiaDieta(altraDieta);
    }
  });
  ctx.sync = sync;
  ctx.apriImpostazioni = () => apriImpostazioni(ctx);

  const indicatore = document.getElementById('stato-sync');
  sync.onStato((s, messaggio) => {
    const icone = { off: '', attesa: '⟳', ok: '☁︎', errore: '⚠︎', offline: '⇅' };
    indicatore.textContent = icone[s] || '';
    indicatore.title = messaggio || '';
    indicatore.className = `stato-sync ${s}`;
  });

  ctx.aggiornaIntestazione();

  viste.settimana = montaSettimana(document.getElementById('scheda-settimana'), ctx);
  viste.spesa = montaSpesa(document.getElementById('scheda-spesa'), ctx);
  viste.ricette = montaRicette(document.getElementById('scheda-ricette'), ctx);

  const ui = Stato.caricaUi();
  mostraScheda(SCHEDE.includes(ui.scheda) ? ui.scheda : 'settimana');

  for (const voce of document.querySelectorAll('.nav-voce')) {
    voce.addEventListener('click', () => {
      mostraScheda(voce.dataset.scheda);
      Stato.salvaUi({ ...Stato.caricaUi(), scheda: schedaAttiva });
      ctx.ridisegna();
    });
  }

  document.getElementById('apri-impostazioni').addEventListener('click', ctx.apriImpostazioni);
  indicatore.addEventListener('click', () => sync.sincronizza());

  function mostraScheda(nome) {
    schedaAttiva = nome;
    for (const s of SCHEDE) document.getElementById(`scheda-${s}`).classList.toggle('attiva', s === nome);
    for (const voce of document.querySelectorAll('.nav-voce')) voce.classList.toggle('attiva', voce.dataset.scheda === nome);
    window.scrollTo(0, 0);
  }

  // Prima sincronizzazione all'avvio
  sync.sincronizza();
}

// Service worker: rende l'app utilizzabile offline (solo su https o localhost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Service worker non registrato:', e));
  });
}

avvia();
