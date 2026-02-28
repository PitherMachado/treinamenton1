
/* ===============================
   N1 Gate (Caminho 1 — Front-end)
   - Token simples em localStorage
   - Guard para páginas /app
   =============================== */

const AUTH_KEY = "n1_auth_ok";

/** Define login como OK */
function setAuth() {
  localStorage.setItem(AUTH_KEY, "1");
}

/** Remove login */
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/** Retorna se está logado */
function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === "1";
}

/** Protege páginas /app */
function guardApp() {
  if (!isAuthed()) {
    window.location.href = "../login.html";
  }
}

/** Logout padrão */
function doLogout() {
  clearAuth();
  window.location.href = "../login.html";
}

/* Expondo funções para usar no HTML sem framework */
window.N1Auth = {
  setAuth,
  clearAuth,
  isAuthed,
  guardApp,
  doLogout,
};
