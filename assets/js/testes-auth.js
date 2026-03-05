// assets/js/testes-auth.js
(function(){
  const TOKEN_KEY = "n1_tests_token_v1";
  const USER_KEY  = "n1_tests_user_v1";

  function now(){ return Date.now(); }

  function safeParse(s){
    try { return JSON.parse(s); } catch(e){ return null; }
  }

  // Base do projeto = tudo antes de "/testes/"
  // Ex:
  // /treinamenton1/testes/t1/video.html  -> base "/treinamenton1"
  // /testes/t1/video.html               -> base ""
  function getBasePath(){
    const p = window.location.pathname || "/";
    const idx = p.indexOf("/testes/");
    if (idx === -1) return "";           // fallback: raiz
    const base = p.slice(0, idx);        // inclui "/treinamenton1"
    return base || "";
  }

  function loginUrl(){
    // URL absoluta (à prova de path relativo/caching)
    return window.location.origin + getBasePath() + "/testes/login.html";
  }

  const N1TestAuth = {
    login(username, password){
      const list = window.N1TestUsers || [];
      const found = list.find(u => (u.user === username && u.pass === password));
      if(!found) return { ok:false, message:"Usuário ou senha inválidos." };

      const token = { v:1, u:found.user, n:(found.name || found.user), t: now() };

      localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
      localStorage.setItem(USER_KEY, JSON.stringify({ user: found.user, name: token.n }));

      return { ok:true, user: token };
    },

    logout(){
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Mantém locks/resultados para garantir tentativa única
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
