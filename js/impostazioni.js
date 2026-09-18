// ==========================================================================
// impostazioni.js — pannello Impostazioni: persone, sincronizzazione GitHub, backup
// ==========================================================================

import { impostaPersone, nuovoIdPersona } from './stato.js';
import { apriFoglio, chiudiFoglio } from './foglio.js';
import { leggiConfig, salvaConfig, configurato, provaConnessione } from './sync.js';
import { scaricaBackup, scegliFileBackup } from './backup.js';

/** ctx = { stato, salva(), applicaStato(nuovo), sync, ridisegna() } */
export function apriImpostazioni(ctx) {
  const corpo = document.createElement('div');

  // --- Persone --------------------------------------------------------------
  corpo.appendChild(titolo('Persone'));
  const spiegaPersone = document.createElement('p');
  spiegaPersone.className = 'nota';
  spiegaPersone.textContent = 'Ogni persona ha il proprio piano settimanale. La lista della spesa somma i piani di tutti.';
  corpo.appendChild(spiegaPersone);

  const listaPersone = document.createElement('div');
  const persone = ctx.stato.persone.map(p => ({ ...p }));

  function disegnaPersone() {
    listaPersone.innerHTML = '';
    persone.forEach((p, i) => {
      const riga = document.createElement('div');
      riga.className = 'riga-campo';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = p.nome;
      input.placeholder = `Nome persona ${i + 1}`;
      input.addEventListener('input', () => { p.nome = input.value; });
      riga.appendChild(input);
      if (persone.length > 1) {
        const rimuovi = document.createElement('button');
        rimuovi.type = 'button';
        rimuovi.className = 'pulsante pericolo';
        rimuovi.textContent = 'Togli';
        rimuovi.addEventListener('click', () => {
          if (!confirm(`Tolgo "${p.nome}"? Il suo piano settimanale verrà cancellato.`)) return;
          persone.splice(i, 1);
          disegnaPersone();
        });
        riga.appendChild(rimuovi);
      }
      listaPersone.appendChild(riga);
    });
  }
  disegnaPersone();
  corpo.appendChild(listaPersone);

  const azioniPersone = document.createElement('div');
  azioniPersone.className = 'azioni';
  azioniPersone.appendChild(pulsante('Aggiungi persona', '', () => {
    persone.push({ id: nuovoIdPersona({ persone, piani: ctx.stato.piani }), nome: '' });
    disegnaPersone();
  }));
  azioniPersone.appendChild(pulsante('Salva persone', 'primario', () => {
    if (persone.some(p => !p.nome.trim())) { alert('Ogni persona deve avere un nome.'); return; }
    impostaPersone(ctx.stato, persone);
    ctx.salva();
    ctx.ridisegna();
    alert('Persone salvate.');
  }));
  corpo.appendChild(azioniPersone);

  // --- Sincronizzazione -----------------------------------------------------
  corpo.appendChild(titolo('Sincronizzazione tra dispositivi (GitHub)'));
  const spiegaSync = document.createElement('p');
  spiegaSync.className = 'nota';
  spiegaSync.textContent = 'Il piano viene salvato in un file dentro un repository GitHub privato, così tutti i dispositivi vedono le stesse scelte. La guida per creare repository e token è nel file docs/SINCRONIZZAZIONE.md.';
  corpo.appendChild(spiegaSync);

  const cfg = leggiConfig();
  const campoUtente = campo('Utente GitHub', cfg.utente || '', 'es. mariorossi');
  const campoRepo = campo('Nome del repository privato', cfg.repo || '', 'es. dieta-facile-dati');
  const campoToken = campo('Token (permesso Contents: read and write)', cfg.token || '', 'github_pat_…', 'password');
  corpo.appendChild(campoUtente.riga);
  corpo.appendChild(campoRepo.riga);
  corpo.appendChild(campoToken.riga);

  const esito = document.createElement('p');
  esito.className = 'nota';
  esito.textContent = configurato(cfg) ? `Stato: ${ctx.sync.messaggio || 'configurato'}` : 'Non configurato: i dati restano solo su questo dispositivo.';
  corpo.appendChild(esito);

  function leggiForm() {
    return {
      utente: campoUtente.input.value.trim(),
      repo: campoRepo.input.value.trim(),
      token: campoToken.input.value.trim()
    };
  }

  const azioniSync = document.createElement('div');
  azioniSync.className = 'azioni';
  azioniSync.appendChild(pulsante('Prova connessione', '', async () => {
    const c = leggiForm();
    if (!configurato(c)) { esito.textContent = 'Compila tutti e tre i campi.'; return; }
    esito.textContent = 'Provo…';
    try {
      esito.textContent = await provaConnessione(c);
    } catch (e) {
      esito.textContent = `Errore: ${e.message}`;
    }
  }));
  azioniSync.appendChild(pulsante('Salva e sincronizza', 'primario', async () => {
    const c = leggiForm();
    if (!configurato(c)) { esito.textContent = 'Compila tutti e tre i campi.'; return; }
    salvaConfig(c);
    esito.textContent = 'Sincronizzo…';
    await ctx.sync.sincronizza();
    esito.textContent = ctx.sync.statoAttuale === 'ok' ? ctx.sync.messaggio : `Errore: ${ctx.sync.messaggio}`;
    ctx.ridisegna();
  }));
  azioniSync.appendChild(pulsante('Scollega', 'pericolo', () => {
    if (!confirm('Tolgo la sincronizzazione da questo dispositivo? I dati restano sia qui sia su GitHub.')) return;
    salvaConfig({});
    campoUtente.input.value = '';
    campoRepo.input.value = '';
    campoToken.input.value = '';
    ctx.sync.notifica('off');
    esito.textContent = 'Non configurato: i dati restano solo su questo dispositivo.';
  }));
  corpo.appendChild(azioniSync);

  // --- Backup ---------------------------------------------------------------
  corpo.appendChild(titolo('Backup su file'));
  const azioniBackup = document.createElement('div');
  azioniBackup.className = 'azioni';
  azioniBackup.appendChild(pulsante('Esporta backup', '', () => scaricaBackup(ctx.stato)));
  azioniBackup.appendChild(pulsante('Importa backup', '', () => {
    scegliFileBackup(nuovo => {
      if (!confirm('Sostituisco il piano attuale con quello del file?')) return;
      ctx.applicaStato(nuovo);
      ctx.salva();
      ctx.ridisegna();
      chiudiFoglio();
      alert('Backup importato.');
    });
  }));
  corpo.appendChild(azioniBackup);

  apriFoglio('Impostazioni', corpo);
}

function titolo(testo) {
  const h = document.createElement('div');
  h.className = 'foglio-sezione';
  h.textContent = testo;
  return h;
}

function campo(etichetta, valore, segnaposto, tipo = 'text') {
  const riga = document.createElement('label');
  riga.className = 'campo';
  const span = document.createElement('span');
  span.textContent = etichetta;
  const input = document.createElement('input');
  input.type = tipo;
  input.value = valore;
  input.placeholder = segnaposto;
  input.autocomplete = 'off';
  input.autocapitalize = 'none';
  input.spellcheck = false;
  riga.appendChild(span);
  riga.appendChild(input);
  return { riga, input };
}

function pulsante(testo, classe, azione) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `pulsante ${classe}`.trim();
  b.textContent = testo;
  b.addEventListener('click', azione);
  return b;
}
