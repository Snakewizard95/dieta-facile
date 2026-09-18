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
   - le cartelle `css`, `js`, `dati`, `icone`, `docs`
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

## Come si aggiorna l'app dopo una modifica

1. Su GitHub apri il repository `dieta-facile` → **Add file** → **Upload files**.
2. Trascina di nuovo i file o le cartelle cambiati (quelli con lo stesso nome vengono sostituiti).
3. **Commit changes**. Dopo 1-2 minuti l'app online è aggiornata.
4. Sull'iPhone chiudi e riapri l'app: la nuova versione viene scaricata da sola.
   Se non la vedi, aprila due volte (la prima scarica, la seconda usa la nuova).

Nota per chi modifica il codice: ad ogni pubblicazione aumentare `VERSIONE` in `sw.js`
(es. `dieta-facile-v2`), così la cache vecchia viene eliminata.
