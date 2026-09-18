# Sincronizzazione tra dispositivi (GitHub)

L'app può salvare il piano settimanale in un file dentro un **repository GitHub privato**.
Ogni dispositivo (il tuo Mac, il tuo iPhone, il telefono dell'altra persona) legge e scrive
lo stesso file, così tutti vedono le stesse scelte e la stessa lista della spesa.

È gratuito. Serve solo un account GitHub (lo stesso che userai per pubblicare l'app).

## Passo 1 — Creare il repository privato per i dati

1. Vai su https://github.com e accedi.
2. In alto a destra premi il **+** e scegli **New repository**.
3. In "Repository name" scrivi: `dieta-facile-dati`
4. Seleziona **Private** (importante: qui dentro ci saranno le vostre scelte alimentari).
5. Non spuntare nient'altro. Premi **Create repository**.

Questo repository è diverso da quello dell'app (che invece sarà pubblico, perché
GitHub Pages gratuito lo richiede). Nel repository pubblico c'è solo il codice.

## Passo 2 — Creare il token (la "chiave" che l'app usa per scrivere)

1. Sempre su GitHub, clicca sulla tua foto in alto a destra → **Settings**.
2. In fondo al menu di sinistra: **Developer settings**.
3. A sinistra: **Personal access tokens** → **Fine-grained tokens**.
4. Premi **Generate new token**.
5. Compila così:
   - **Token name**: `Dieta Facile`
   - **Expiration**: scegli la durata massima che ti propone (di solito 1 anno).
     Alla scadenza dovrai creare un nuovo token e reinserirlo nell'app.
   - **Repository access**: scegli **Only select repositories** e seleziona `dieta-facile-dati`.
   - **Permissions** → **Repository permissions** → cerca **Contents** e imposta
     **Read and write**. (Automaticamente si attiva anche "Metadata: read", va bene.)
6. Premi **Generate token**.
7. **Copia subito il token** (inizia con `github_pat_`). GitHub lo mostra una sola volta:
   se lo perdi, ne crei un altro.

Il token permette SOLO di leggere e scrivere i file di quel repository. Non dà accesso
al resto del tuo account.

## Passo 3 — Inserire i dati nell'app

Su ogni dispositivo che deve essere sincronizzato:

1. Apri l'app e tocca l'ingranaggio **⚙︎** in alto a destra.
2. Nella sezione "Sincronizzazione tra dispositivi" compila:
   - **Utente GitHub**: il tuo nome utente (quello che compare nell'indirizzo del tuo profilo).
   - **Nome del repository privato**: `dieta-facile-dati`
   - **Token**: incolla il token copiato al passo 2.
3. Premi **Prova connessione**: deve comparire "Connesso a … (privato)".
4. Premi **Salva e sincronizza**.

Da questo momento nell'intestazione compare una piccola nuvola ☁︎: toccandola forzi
una sincronizzazione. Se compare ⚠︎ c'è un problema (tocca l'icona per riprovare,
oppure apri le impostazioni per leggere il messaggio).

Sul secondo dispositivo si inseriscono **gli stessi tre dati**. Per comodità puoi mandarti
il token con AirDrop o con un messaggio a te stesso; poi cancella il messaggio.

## Come funziona la fusione

- Ogni persona ha il proprio piano. Se due dispositivi modificano persone diverse,
  entrambe le modifiche vengono conservate.
- Se due dispositivi modificano la **stessa** persona senza sincronizzarsi in mezzo,
  vince la modifica più recente.
- Le spunte della lista della spesa sono in comune e vince l'ultima modifica.
- La sincronizzazione avviene all'apertura dell'app, quando torni sull'app, e circa
  1,5 secondi dopo ogni modifica. Senza rete le modifiche restano sul dispositivo e
  partono appena la rete torna.

## Sicurezza: cosa sapere

- Il token è salvato nel browser del dispositivo. Chi ha il telefono sbloccato può
  usare l'app: è lo stesso livello di protezione delle altre app sul telefono.
- Se un dispositivo viene perso: su GitHub → Settings → Developer settings →
  Fine-grained tokens → **Delete** sul token "Dieta Facile". L'app su quel dispositivo
  smette immediatamente di poter leggere o scrivere.
- Il repository dei dati resta privato: nessuno oltre a te può vederlo.
