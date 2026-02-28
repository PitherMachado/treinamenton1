/* ===============================
   N1 Gate (Caminho 1 — Front-end)
   - Token simples em localStorage
   - Guard para páginas /app
   - ATENÇÃO: GitHub Pages não é segurança real
   =============================== */

const AUTH_KEY  = "n1_auth";      // chave única (padrão do seu login.html)
const USER_KEY  = "n1_user";
const ROLE_KEY  = "n1_role";

/** Define login como OK */
function setAuth() {
  localStorage.setItem(AUTH_KEY, "true");
}

/** Remove login */
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

/** Retorna se está logado */
function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === "true";
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
  window.location.href = "https://pithermachado.github.io/treinamenton1/";
}
/** Login (opcional): valida em window.N1_USERS e cria sessão */
function login(user, pass) {
  const users = Array.isArray(window.N1_USERS) ? window.N1_USERS : [];

  const found = users.find(u => u.user === user && u.pass === pass);

  if (!found) return false;
  if (found.active !== true) return false;

  setAuth();
  localStorage.setItem(USER_KEY, found.user);
  localStorage.setItem(ROLE_KEY, found.role || "aluno");

  return true;
}

/** Helpers */
function getUser() {
  return localStorage.getItem(USER_KEY) || "";
}

function getRole() {
  return localStorage.getItem(ROLE_KEY) || "aluno";
}

/* Expondo funções */
window.N1Auth = {
  AUTH_KEY,
  USER_KEY,
  ROLE_KEY,
  setAuth,
  clearAuth,
  isAuthed,
  guardApp,
  doLogout,
  login,
  getUser,
  getRole,
};
