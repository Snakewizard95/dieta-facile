// ==========================================================================
// foglio.js — il pannello che sale dal basso per fare una scelta
// ==========================================================================

const foglio = document.getElementById('foglio');
const sfondo = document.getElementById('sfondo-foglio');
const titolo = document.getElementById('foglio-titolo');
const corpo = document.getElementById('foglio-corpo');
const chiudi = document.getElementById('foglio-chiudi');

export function apriFoglio(testoTitolo, contenuto) {
  titolo.textContent = testoTitolo;
  corpo.innerHTML = '';
  corpo.appendChild(contenuto);
  foglio.hidden = false;
  sfondo.hidden = false;
  corpo.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

/** Sostituisce il contenuto del foglio mantenendo la posizione di scorrimento. */
export function aggiornaFoglio(contenuto) {
  const scroll = corpo.scrollTop;
  corpo.innerHTML = '';
  corpo.appendChild(contenuto);
  corpo.scrollTop = scroll;
}

export function chiudiFoglio() {
  foglio.hidden = true;
  sfondo.hidden = true;
  document.body.style.overflow = '';
}

export function foglioAperto() {
  return !foglio.hidden;
}

chiudi.addEventListener('click', chiudiFoglio);
sfondo.addEventListener('click', chiudiFoglio);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !foglio.hidden) chiudiFoglio();
});
