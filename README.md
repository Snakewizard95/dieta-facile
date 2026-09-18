# Dieta Facile

Web app per organizzare la settimana di un piano nutrizionale: scegli cosa mangiare in ogni
pasto, l'app controlla i limiti settimanali, genera la lista della spesa e suggerisce ricette.

Funziona su iPhone come un'app installata (si aggiunge alla schermata Home da Safari),
non ha costi, non ha server: i tuoi dati restano sul telefono.

## Come si usa (quando sarà pubblicata)

1. Apri l'indirizzo dell'app in Safari sull'iPhone.
2. Tocca il pulsante **Condividi** (il quadrato con la freccia in alto).
3. Scorri e tocca **Aggiungi alla schermata Home**, poi **Aggiungi**.
4. Da quel momento apri l'app dall'icona, anche senza connessione.

## Come si prova sul Mac durante lo sviluppo

1. Apri il **Terminale**.
2. Entra nella cartella del progetto:
   ```
   cd "/Users/valsarpartecipazioni/Downloads/Corsi e AI/Claude/Dieta Facile"
   ```
3. Avvia un piccolo server locale (è già incluso in macOS):
   ```
   python3 -m http.server 8080
   ```
4. Apri Safari all'indirizzo `http://localhost:8080`.
5. Per fermare il server torna nel Terminale e premi `Ctrl + C`.

## Più persone e sincronizzazione

L'app gestisce più persone che seguono la stessa dieta: ognuna ha il proprio piano
settimanale, la lista della spesa è unica. I nomi si impostano dall'ingranaggio ⚙︎.

Per vedere lo stesso piano da più dispositivi, l'app può salvare i dati in un
repository GitHub privato: guida passo-passo in [docs/SINCRONIZZAZIONE.md](docs/SINCRONIZZAZIONE.md).
In alternativa, sempre dall'ingranaggio, si può esportare un backup su file e importarlo altrove.

## Struttura

- `dati/dieta.json` — il piano nutrizionale in forma strutturata (alimenti, grammature, limiti).
- `dati/ricette.json` — il ricettario.
- `docs/VERIFICA_DATI.md` — la stessa dieta in tabelle leggibili, per controllarla.
- `index.html`, `css/`, `js/` — l'applicazione.

## Privacy

Il repository è pubblico: contiene solo regole alimentari anonime. Il PDF originale,
i nomi e i contatti non vanno mai caricati. Le scelte settimanali restano nel telefono.
