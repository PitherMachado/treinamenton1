// assets/js/testes-auth.js
(function(){
  const TOKEN_KEY = "n1_tests_token_v1";
  const USER_KEY  = "n1_tests_user_v1";

  function now(){ return Date.now(); }

  function safeParse(s){
    try { return JSON.parse(s); } catch(e){ return null; }
  }

  // Descobre o "base path" do projeto no GitHub Pages.
  // Ex: https://usuario.github.io/treinamenton1/testes/login.html
  // basePath = "/treinamenton1"
  function getBasePath(){
    const parts = window.location.pathname.split("/").filter(Boolean);
    // Se estiver em github.io/REPO/...
    // parts[0] geralmente é o nome do repo.
    // Em domínio próprio pode ser diferente, mas ainda funciona bem (base = "").
    if (window.location.hostname.endsWith("github.io") && parts.length >= 1) {
      return "/" + parts[0];
    }
    // Domínio próprio (ex.: treinamenton1.com/testes/...)
    // Nesse caso, assume raiz como base.
    return "";
  }

  function loginUrl(){
    return getBasePath() + "/testes/login.html";
  }

  const N1TestAuth = {
    login(username, password){
      const list = window.N1TestUsers || [];
      const found = list.find(u => (u.user === username && u.pass === password));
      if(!found) return { ok:false, message:"Usuário ou senha inválidos." };

      const token = {
        v: 1,
        u: found.user,
        n: found.name || found.user,
        t: now()
      };

      localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
      localStorage.setItem(USER_KEY, JSON.stringify({ user: found.user, name: token.n }));

      return { ok:true, user: token };
    },

    logout(){
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // opcional: não limpar resultados de prova automaticamente
      // (assim a tentativa única permanece travada)
    },

    getUser(){
      return safeParse(localStorage.getItem(USER_KEY));
    },

    isAuthed(){
      const t = safeParse(localStorage.getItem(TOKEN_KEY));
      return !!(t && t.u && t.t);
    },

    guard(){
      if(!this.isAuthed()){
        window.location.replace(loginUrl());
      }
    },

    getLoginUrl(){
      return loginUrl();
    }
  };

  window.N1TestAuth = N1TestAuth;
})();
