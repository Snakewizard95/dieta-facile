// ==========================================================================
// backup.js — esporta e importa il piano settimanale come file JSON
// ==========================================================================
//
// Serve per spostare il piano da un dispositivo all'altro (es. Mac → iPhone):
// i dati vivono solo nel browser che li ha creati.

import { esporta, importa } from './stato.js';

/** Fa scaricare un file "dieta-facile-AAAA-MM-GG.json" con il piano attuale. */
export function scaricaBackup(stato) {
  const testo = esporta(stato);
  const blob = new Blob([testo], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dieta-facile-${stato.dietaId || 'piano'}-${stato.settimanaDel}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Apre il selettore di file e, se il file è valido, chiama `alRisultato(nuovoStato)`.
 * In caso di errore mostra un messaggio.
 */
export function scegliFileBackup(alRisultato, dietaId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const testo = await file.text();
      const nuovo = importa(testo, dietaId);
      alRisultato(nuovo);
    } catch (e) {
      alert(`Non riesco a leggere il backup: ${e.message}`);
    }
  });
  input.click();
}
