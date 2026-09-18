// ==========================================================================
// app.js — avvio dell'applicazione, navigazione, sincronizzazione
// ==========================================================================

import { caricaDati } from './dati.js';
import * as Stato from './stato.js';
import { montaSettimana } from './settimana.js';
import { montaSpesa } from './spesa.js';
import { montaRicette } from './ricette.js';
import { impostaTabellaEmoji } from './emoji.js';
import { impostaTabellaCalorie } from './calorie.js';
import { Sincronizzatore } from './sync.js';
import { apriImpostazioni } from './impostazioni.js';
import { foglioAperto } from './foglio.js';

const SCHEDE = ['settimana', 'spesa', 'ricette'];

async function avvia() {
  const erroreBox = document.getElementById('errore');

  let dati;
  try {
    dati = await caricaDati();
  } catch (e) {
    erroreBox.hidden = false;
    erroreBox.textContent = `Non riesco a caricare la dieta: ${e.message}. ` +
      'Se stai aprendo il file direttamente, avvia il server locale come spiegato nel README.';
    return;
  }

  impostaTabellaEmoji(dati.emoji);
  impostaTabellaCalorie(dati.calorie);
  const stato = Stato.carica();
  let schedaAttiva = 'settimana';
  const viste = {};

  const ctx = {
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
    },
    aggiornaIntestazione() {
      document.getElementById('settimana-corrente').textContent = Stato.descriviSettimana(stato.settimanaDel);
    },
    ridisegna() {
      ctx.aggiornaIntestazione();
      if (viste[schedaAttiva] && viste[schedaAttiva].disegna) viste[schedaAttiva].disegna();
    }
  };

  // Sincronizzazione con GitHub (se configurata)
  const sync = new Sincronizzatore({
    stato,
    salvaLocale: () => Stato.salva(stato),
    applicaStato: nuovo => {
      ctx.applicaStato(nuovo);
      // Non ridisegnare sotto le dita dell'utente mentre sta scegliendo
      if (!foglioAperto()) ctx.ridisegna();
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
