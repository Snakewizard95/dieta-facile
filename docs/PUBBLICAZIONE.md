# Pubblicare l'app su GitHub Pages e installarla sull'iPhone

Alla fine l'app sarà raggiungibile a un indirizzo tipo
`https://TUO-UTENTE.github.io/dieta-facile/` da qualsiasi dispositivo, senza il server sul Mac.

## Passo 1 — Creare il repository pubblico dell'app

1. Su https://github.com premi **+** → **New repository**.
2. Repository name: `dieta-facile`
3. Seleziona **Public** (GitHub Pages gratuito funziona solo con repository pubblici;
   qui dentro c'è solo il codice e la dieta anonima, mai le vostre scelte).
4. Premi **Create repository**.

## Passo 2 — Caricare i file

Il modo più semplice, senza Terminale:

1. Nella pagina del repository appena creato clicca sul link **uploading an existing file**
   (oppure, se il repository non è vuoto, **Add file** → **Upload files**).
2. Apri il Finder nella cartella `Dieta Facile`.
3. Trascina nella finestra del browser **questi elementi**:
   - i file `index.html`, `manifest.webmanifest`, `sw.js`, `README.md`, `CLAUDE.md`
   - le cartelle `css`, `js`, `dati`, `icone`, `fonts`, `docs`
   Puoi trascinare le cartelle intere: GitHub carica anche il contenuto.
   Il file `.gitignore` è nascosto nel Finder e non serve per il caricamento manuale:
   puoi ignorarlo (se vuoi vederlo, premi Cmd + Shift + . nel Finder).
   **NON caricare** il PDF della dieta né la cartella nascosta `.git`.
4. In basso, nel campo del messaggio, scrivi `Prima pubblicazione` e premi **Commit changes**.

## Passo 3 — Attivare GitHub Pages

1. Nel repository vai su **Settings** (in alto, con l'ingranaggio).
2. Nel menu di sinistra: **Pages**.
3. In "Build and deployment" → "Source" scegli **Deploy from a branch**.
4. In "Branch" scegli **main** e la cartella **/ (root)**, poi **Save**.
5. Aspetta 1-2 minuti e ricarica la pagina: in alto compare
   "Your site is live at https://TUO-UTENTE.github.io/dieta-facile/".

## Passo 4 — Installare sull'iPhone

1. Apri **Safari** sull'iPhone e vai all'indirizzo del passo 3.
2. Tocca il pulsante **Condividi** (quadrato con la freccia verso l'alto).
3. Scorri e tocca **Aggiungi alla schermata Home**, poi **Aggiungi**.
4. Apri l'app dall'icona verde. Tocca ⚙︎ e inserisci i dati di sincronizzazione
   (vedi `SINCRONIZZAZIONE.md`): dopo pochi secondi compare il piano.
5. Prova in modalità aereo: l'app deve aprirsi lo stesso (le modifiche partono
   quando torna la rete).

## Passo 4b — Installare su Android

1. Aprire l'indirizzo dell'app in **Chrome**.
2. Toccare i tre puntini in alto a destra e scegliere **Installa app** (oppure **Aggiungi a
   schermata Home**). Spesso Chrome lo propone da solo con un avviso in basso.
3. Aprire l'app dall'icona, toccare ⚙︎ e inserire i dati di sincronizzazione.
Su Android l'icona si aggiorna da sola nelle versioni successive.

## Come si aggiorna l'app dopo una modifica

1. Su GitHub apri il repository `dieta-facile` → **Add file** → **Upload files**.
2. Trascina di nuovo i file o le cartelle cambiati (quelli con lo stesso nome vengono sostituiti).
   **Prima di confermare, controlla la lista dei file** che compare sotto l'area di trascinamento:
   se manca una cartella, trascinala di nuovo. Con molte cartelle insieme può perdersene qualcuna;
   in caso di dubbio fai due caricamenti separati.
3. **Commit changes**. Dopo 1-2 minuti l'app online è aggiornata.
   Per controllare cosa è davvero online: nel repository apri le cartelle e guarda dimensione e
   data dei file, oppure apri `https://TUO-UTENTE.github.io/dieta-facile/css/stile.css` nel browser.
4. Sull'iPhone chiudi e riapri l'app: la nuova versione viene scaricata da sola.
   Se non la vedi, aprila due volte (la prima scarica, la seconda usa la nuova).

Nota per chi modifica il codice: ad ogni pubblicazione aumentare lo stesso numero in tre punti,
così le cache (GitHub Pages, Safari, service worker) scaricano i file nuovi:
- `index.html`: `css/stile.css?v=N`, `manifest.webmanifest?v=N` e `js/app.js?v=N`
- `js/dati.js`: `VERSIONE_DATI = 'N'`
- `sw.js`: `VERSIONE = 'dieta-facile-vN'`

Se dopo un caricamento l'app online sembra "a metà" (alcune parti nuove, altre vecchie),
è la cache di GitHub Pages: dura circa 10 minuti, basta aspettare e ricaricare.
