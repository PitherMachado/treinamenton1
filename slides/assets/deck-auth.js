
/* ===============================
   N1 Deck Auth (login extra)
   =============================== */

const DECK_AUTH_KEY = "n1_deck_auth_ok";
const DECK_USER_KEY = "n1_deck_user";

function setDeckAuth(username) {
  localStorage.setItem(DECK_AUTH_KEY, "1");
  localStorage.setItem(DECK_USER_KEY, username || "");
}

function clearDeckAuth() {
  localStorage.removeItem(DECK_AUTH_KEY);
  localStorage.removeItem(DECK_USER_KEY);
}

function isDeckAuthed() {
  return localStorage.getItem(DECK_AUTH_KEY) === "1";
}

function guardDeck() {
  if (!isDeckAuthed()) {
    window.location.href = "./login.html";
  }
}

function deckLogout() {
  clearDeckAuth();
  // volta pro site/área que você quiser
  window.location.href = "https://pithermachado.github.io/treinamenton1/";
}

function deckUser() {
  return localStorage.getItem(DECK_USER_KEY) || "";
}

window.N1DeckAuth = {
  setDeckAuth,
  clearDeckAuth,
  isDeckAuthed,
  guardDeck,
  deckLogout,
  deckUser,
};
