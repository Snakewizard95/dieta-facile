# CLAUDE.md — Progetto "Dieta Facile"

> Guida vincolante di questo progetto. Va letta all'inizio di ogni sessione.
> Il CLAUDE.md nella cartella padre ("Corsi e AI") riguarda un altro progetto
> (EA TrendRider per MetaTrader) e NON si applica qui.

## 1. Contesto e regole di comunicazione

- L'utente (Davide) **non è un programmatore**. Ogni consegna va spiegata in italiano
  semplice, passo-passo, con istruzioni numerate per le azioni manuali.
- Tutta la comunicazione, i commenti nel codice e la documentazione sono **in italiano**.
- Ambiente: macOS, Safari, iPhone. Nessun servizio a pagamento: **costo zero assoluto**.

## 2. Cos'è il progetto

Web app installabile (PWA) che aiuta a seguire un piano nutrizionale settimanale,
per **una o più persone** che seguono la stessa dieta:
1. **Settimana**: per la persona selezionata, 7 giorni × 6 slot (colazione, spuntino,
   pranzo, merenda, cena, dopo cena). In ogni slot si sceglie un'opzione prevista dalla
   dieta; i limiti settimanali (es. biscotti max 2 volte) e le frequenze dei secondi vengono
   controllati automaticamente, per persona. Frutta e verdura si possono specificare
   scegliendo tra quelle di stagione del mese.
2. **Spesa**: lista unica che somma i piani di tutte le persone, con spunte in comune.
3. **Ricette**: suggerimenti dal ricettario, coerenti con gli ingredienti scelti.
4. **Sincronizzazione**: i dati vengono condivisi tra dispositivi tramite un file JSON in
   un repository GitHub privato (vedi `docs/SINCRONIZZAZIONE.md`).

## 3. Scelte tecniche non negoziabili

- HTML + CSS + JavaScript puro. **Nessun framework, nessun build step, nessun npm.**
- Nessun backend proprio: i dati vivono in `localStorage` e, se configurato, in un file
  `piano.json` dentro un repository GitHub privato letto/scritto con l'API GitHub
  (token fine-grained con solo "Contents: read and write" su quel repository).
- Hosting: GitHub Pages (repository pubblico, solo codice). Deve funzionare anche
  aprendo i file con `python3 -m http.server` in locale.
- La dieta vive SOLO in `dati/dieta.json`, `dati/ricette.json` e `dati/stagioni.json`.
  La logica in `js/` non deve contenere grammature o nomi di alimenti "cablati".
- Deve funzionare bene su iPhone (schermo stretto, touch) e offline dopo la prima apertura.
- Fusione tra dispositivi: per ogni persona vince il piano con `aggiornatoIl` più recente;
  le spunte della spesa seguono `spuntateIl`. Mai perdere silenziosamente dati.

## 4. Privacy

- MAI committare il PDF originale della dieta.
- MAI inserire nome del paziente, nome/contatti della nutrizionista nel repository pubblico.
- I JSON del repository pubblico contengono solo alimenti, grammature e regole, in forma anonima.
- Le scelte settimanali vanno SOLO nel repository privato dei dati (o restano sul dispositivo).
- Il token GitHub è salvato in `localStorage` del dispositivo; mai nel codice, mai nei commit.

## 5. Struttura

```
index.html            pagina unica con 3 schede + pannello a comparsa
manifest.webmanifest  installazione su iPhone (Fase 4)
sw.js                 service worker per l'offline (Fase 4)
css/stile.css
js/app.js             avvio, navigazione, collegamento sincronizzazione
js/dati.js            caricamento JSON e ricerca opzioni
js/stato.js           stato v2 (persone, piani, extra), localStorage, fusione, backup
js/vincoli.js         contatori settimanali e avvisi (per piano)
js/sync.js            lettura/scrittura piano.json su GitHub, coordinatore
js/impostazioni.js    pannello: persone, GitHub, backup
js/backup.js          esporta/importa file JSON
js/foglio.js          pannello a comparsa dal basso
js/settimana.js       scheda Settimana
js/spesa.js           scheda Spesa
js/ricette.js         scheda Ricette: suggerimenti per pasto + ricettario con ricerca
js/emoji.js           emoji per alimenti e piatti (da dati/emoji.json)
js/calorie.js         stima indicativa delle calorie (da dati/calorie.json), disattivabile
dati/dieta.json       piano nutrizionale strutturato
dati/ricette.json     ricettario
dati/stagioni.json    frutta e verdura di stagione per mese
dati/emoji.json       parole chiave → emoji (l'ordine conta: specifiche prima)
dati/calorie.json     parole chiave → kcal per 100 g o per pezzo (stime, specifiche prima)
docs/VERIFICA_DATI.md tabella leggibile dei dati, per controllo contro il PDF
docs/SINCRONIZZAZIONE.md guida per repository privato e token
icone/                icone PNG per la PWA
```

## 6. Fasi e verifiche

| Fase | Contenuto | Verifica di Davide |
|---|---|---|
| 0 | Setup cartelle, CLAUDE.md, README, git | — |
| 1 | dieta.json + ricette.json + VERIFICA_DATI.md | Conferma grammature e limiti contro il PDF |
| 2 | Scheda Settimana + vincoli | Prova a superare un limite in Safari |
| 3 | Scheda Spesa | Controllo manuale di 2-3 ingredienti |
| 3b | Più persone, sincronizzazione GitHub, stagionalità | Due dispositivi vedono lo stesso piano; frutto scelto compare in spesa |
| 4 | PWA + GitHub Pages | App installata sull'iPhone, funziona offline |
| 5 | Scheda Ricette | Con "legumi" a cena compaiono farinata, ragù di lenticchie… |
| 6 | Rifiniture (Esporta/Importa, vista Oggi) | — |

Non passare alla fase successiva senza la conferma dell'utente.

Stato al 18/09/2026: Fasi 1-5 completate. L'app è pubblicata su GitHub Pages e installata
sull'iPhone; la sincronizzazione GitHub è attiva. Ad ogni pubblicazione aumentare `VERSIONE`
in `sw.js` e ricaricare i file cambiati su GitHub (guida in `docs/PUBBLICAZIONE.md`).

## 7. Regole operative

1. Ogni modifica ai JSON della dieta va riportata anche in `docs/VERIFICA_DATI.md`.
2. Ogni consegna include: cosa è cambiato, come provarlo, quale fase si sta chiudendo.
3. Le regole della dieta si trascrivono dal PDF, non si interpretano: in caso di dubbio
   si segnala il punto in VERIFICA_DATI.md nella sezione "Punti da chiarire".
4. Questo strumento aiuta a organizzare un piano prescritto da una professionista; non
   dà consigli nutrizionali propri e non modifica le grammature di sua iniziativa.
5. Le calorie sono una stima dichiarata come tale, per curiosità: mai presentarle come
   dato preciso né usarle per suggerire modifiche ai pasti.
