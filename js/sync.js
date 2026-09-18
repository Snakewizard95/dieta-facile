// ==========================================================================
// sync.js — sincronizzazione del piano tramite un file in un repository GitHub privato
// ==========================================================================
//
// Come funziona:
//  - su ogni dispositivo si inseriscono una volta: utente GitHub, nome del
//    repository privato e un token con permesso "Contents: read and write";
//  - all'apertura dell'app (e ogni volta che si cambia qualcosa) l'app legge il
//    file piano.json dal repository, lo fonde con quello locale e lo riscrive;
//  - GitHub tiene traccia dell'ultima versione con uno "sha": se un altro
//    dispositivo ha scritto nel frattempo, la scrittura fallisce e si riprova
//    rileggendo prima.

import { unisci, normalizza, uguali } from './stato.js';

const CHIAVE_CFG = 'dietaFacile.sync.v1';
const API = 'https://api.github.com';
const FILE = 'piano.json';

export function leggiConfig() {
  try {
    return JSON.parse(localStorage.getItem(CHIAVE_CFG)) || {};
  } catch (e) {
    return {};
  }
}

export function salvaConfig(cfg) {
  try {
    localStorage.setItem(CHIAVE_CFG, JSON.stringify(cfg));
  } catch (e) { /* ignorato */ }
}

export function configurato(cfg) {
  return Boolean(cfg && cfg.utente && cfg.repo && cfg.token);
}

function intestazioni(cfg) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

function urlFile(cfg) {
  return `${API}/repos/${encodeURIComponent(cfg.utente)}/${encodeURIComponent(cfg.repo)}/contents/${FILE}`;
}

function messaggioErrore(risposta) {
  switch (risposta.status) {
    case 401: return 'Token non valido o scaduto.';
    case 403: return 'Il token non ha i permessi necessari (serve "Contents: read and write").';
    case 404: return 'Repository non trovato: controlla utente e nome del repository (e che il token possa vederlo).';
    default: return `Errore GitHub ${risposta.status}.`;
  }
}

// Base64 con testo UTF-8 (le lettere accentate devono sopravvivere)
function codificaBase64(testo) {
  const byte = new TextEncoder().encode(testo);
  let bin = '';
  for (let i = 0; i < byte.length; i++) bin += String.fromCharCode(byte[i]);
  return btoa(bin);
}

function decodificaBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const byte = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) byte[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(byte);
}

/** Legge il file remoto: { stato, sha } oppure { stato: null, sha: null } se non esiste ancora. */
export async function leggiRemoto(cfg) {
  const r = await fetch(urlFile(cfg), { headers: intestazioni(cfg), cache: 'no-store' });
  if (r.status === 404) {
    // Distinguere "file mancante" da "repository mancante"
    const repo = await fetch(`${API}/repos/${encodeURIComponent(cfg.utente)}/${encodeURIComponent(cfg.repo)}`, { headers: intestazioni(cfg), cache: 'no-store' });
    if (!repo.ok) throw new Error(messaggioErrore(repo));
    return { stato: null, sha: null };
  }
  if (!r.ok) throw new Error(messaggioErrore(r));
  const j = await r.json();
  return { stato: JSON.parse(decodificaBase64(j.content)), sha: j.sha };
}

export class Conflitto extends Error {}

/** Scrive il file remoto; restituisce il nuovo sha. Lancia Conflitto se qualcun altro ha scritto prima. */
export async function scriviRemoto(cfg, stato, sha) {
  const corpo = {
    message: `Aggiornamento piano ${new Date().toLocaleString('it-IT')}`,
    content: codificaBase64(JSON.stringify(stato, null, 2))
  };
  if (sha) corpo.sha = sha;
  const r = await fetch(urlFile(cfg), {
    method: 'PUT',
    headers: { ...intestazioni(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  if (r.status === 409 || r.status === 422) throw new Conflitto('Il file è cambiato nel frattempo.');
  if (!r.ok) throw new Error(messaggioErrore(r));
  const j = await r.json();
  return j.content.sha;
}

/** Prova la connessione: restituisce un messaggio di esito. */
export async function provaConnessione(cfg) {
  const r = await fetch(`${API}/repos/${encodeURIComponent(cfg.utente)}/${encodeURIComponent(cfg.repo)}`, { headers: intestazioni(cfg), cache: 'no-store' });
  if (!r.ok) throw new Error(messaggioErrore(r));
  const j = await r.json();
  const scrittura = j.permissions && j.permissions.push;
  if (!scrittura) throw new Error('Il token può leggere ma non scrivere: serve il permesso "Contents: read and write".');
  return `Connesso a ${j.full_name}${j.private ? ' (privato)' : ' (ATTENZIONE: repository pubblico)'}.`;
}

/**
 * Coordinatore della sincronizzazione.
 * ctx = { stato, salvaLocale(), applicaStato(nuovo) }
 * Notifica i cambi di stato con onStato(stato, messaggio):
 *  "off" | "attesa" | "ok" | "errore" | "offline"
 */
export class Sincronizzatore {
  constructor(ctx) {
    this.ctx = ctx;
    this.sha = null;
    this.inCorso = false;
    this.richiesto = false;
    this.timer = null;
    this.ascoltatori = [];
    this.statoAttuale = 'off';
    this.messaggio = '';
    this.ultimoOk = null;

    window.addEventListener('online', () => this.sincronizza());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.sincronizza();
    });
  }

  onStato(fn) {
    this.ascoltatori.push(fn);
    fn(this.statoAttuale, this.messaggio);
  }

  notifica(stato, messaggio = '') {
    this.statoAttuale = stato;
    this.messaggio = messaggio;
    for (const fn of this.ascoltatori) fn(stato, messaggio);
  }

  /** Da chiamare dopo ogni modifica locale: aspetta 1,5 s e poi sincronizza. */
  programma() {
    if (!configurato(leggiConfig())) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.sincronizza(), 1500);
  }

  async sincronizza() {
    const cfg = leggiConfig();
    if (!configurato(cfg)) {
      this.notifica('off');
      return;
    }
    if (!navigator.onLine) {
      this.notifica('offline', 'Sei offline: le modifiche verranno inviate appena torna la rete.');
      return;
    }
    if (this.inCorso) {
      this.richiesto = true;
      return;
    }
    this.inCorso = true;
    this.notifica('attesa', 'Sincronizzazione in corso…');

    try {
      for (let tentativo = 0; tentativo < 3; tentativo++) {
        const remoto = await leggiRemoto(cfg);
        this.sha = remoto.sha;

        let unito;
        if (remoto.stato) {
          unito = unisci(this.ctx.stato, remoto.stato);
        } else {
          unito = normalizza(this.ctx.stato);
        }

        if (!uguali(unito, this.ctx.stato)) {
          this.ctx.applicaStato(unito);
          this.ctx.salvaLocale();
        }

        const remotoAggiornato = remoto.stato && uguali(unito, remoto.stato);
        if (!remotoAggiornato) {
          try {
            this.sha = await scriviRemoto(cfg, normalizza(this.ctx.stato), this.sha);
          } catch (e) {
            if (e instanceof Conflitto) continue; // rileggi e riprova
            throw e;
          }
        }
        this.ultimoOk = new Date();
        this.notifica('ok', `Sincronizzato alle ${this.ultimoOk.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
        break;
      }
    } catch (e) {
      const offline = !navigator.onLine || (e instanceof TypeError);
      this.notifica(offline ? 'offline' : 'errore', offline ? 'Rete non raggiungibile.' : e.message);
    } finally {
      this.inCorso = false;
      if (this.richiesto) {
        this.richiesto = false;
        this.sincronizza();
      }
    }
  }
}
