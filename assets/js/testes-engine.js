
/* assets/js/testes-engine.js
   Motor genérico de provas (GitHub Pages / HTML estático)

   Como usar no prova.html:
   <script src="../../assets/js/testes-auth.js"></script>
   <script>window.N1TestAuth.guard();</script>
   <script src="../../assets/js/testes-engine.js"></script>
   <script>
     N1TestsEngine.mount({
       testId: "t1",
       minScore: 70,
       containerId: "testRoot",
       redirectOnMissingVideo: "./video.html",
       redirectOnDone: "../index.html"
     });
   </script>

   E no HTML ter:
   <div id="testRoot"></div>
*/

(function () {
  // ========= Helpers =========
  const $ = (sel) => document.querySelector(sel);

  function safeParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function normalizeText(s) {
    return (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/\s+/g, " ");
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  // ========= Banco de questões (EDITÁVEL SEM MEXER NA LÓGICA) =========
  // Você só edita o array de cada testId.
  const QUESTION_BANK = {
    t1: [
      // ====== EXEMPLOS (você substitui pelo seu conteúdo real) ======

      {
        id: "t1_q1",
        type: "mcq",
        points: 1,
        prompt: "Qual é o objetivo da sondagem no atendimento?",
        options: [
          "Oferecer qualquer produto",
          "Descobrir a necessidade do cliente",
          "Encerrar rapidamente a ligação",
          "Ignorar objeções"
        ],
        correctIndex: 1
      },

      {
        id: "t1_q2",
        type: "mcq",
        points: 1,
        prompt: "Quando o cliente apresenta uma objeção, o que é mais adequado?",
        options: [
          "Interromper e insistir no preço",
          "Ouvir, validar e responder com argumento",
          "Encerrar a conversa",
          "Mudar de assunto imediatamente"
        ],
        correctIndex: 1
      },

      {
        id: "t1_q3",
        type: "text",
        points: 1,
        prompt: "Em uma frase, descreva o que significa 'mentalidade de dono' na operação.",
        // Correção por palavras-chave: o aluno precisa mencionar ao menos X termos.
        // Ajuste "mustHaveAny" e "minHits" como preferir.
        rubric: {
          mustHaveAny: [
            ["responsabilidade", "responsavel"],
            ["resultado", "meta", "performance"],
            ["execucao", "agir", "fazer acontecer", "proatividade"]
          ],
          minHits: 2
        },
        placeholder: "Digite sua resposta aqui..."
      },

      // DICA: copie e cole mais blocos para chegar em 15 (ou quantas quiser).
      // Não precisa alterar a lógica, só adicionar/remover itens.
    ]
  };

  // ========= Engine =========
  const N1TestsEngine = {
    mount(config) {
      const {
        testId,
        minScore = 70,
        containerId = "testRoot",
        redirectOnMissingVideo = "./video.html",
        redirectOnDone = "../index.html"
      } = config || {};

      if (!testId) throw new Error("N1TestsEngine.mount: testId é obrigatório.");

      const container = document.getElementById(containerId);
      if (!container) throw new Error(`N1TestsEngine.mount: container #${containerId} não encontrado.`);

      const questions = QUESTION_BANK[testId];
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        container.innerHTML = this._card(`
          <h2>⚠️ Nenhuma pergunta configurada</h2>
          <p>Configure as perguntas em <code>assets/js/testes-engine.js</code> dentro de <code>QUESTION_BANK.${testId}</code>.</p>
        `);
        return;
      }

      // Keys de estado
      const KEY_WATCHED = `n1_tests_${testId}_watched_v1`;
      const KEY_DONE = `n1_tests_${testId}_done_v1`;
      const KEY_RESULT = `n1_tests_${testId}_result_v1`;

      // 1) se não assistiu vídeo, volta
      if (localStorage.getItem(KEY_WATCHED) !== "1") {
        window.location.replace(redirectOnMissingVideo);
        return;
      }

      // 2) se já concluiu, bloqueia
      if (localStorage.getItem(KEY_DONE) === "1") {
        const saved = safeParse(localStorage.getItem(KEY_RESULT));
        container.innerHTML = this._renderLocked(saved, minScore);
        // opcional: volta pro hub após alguns segundos
        setTimeout(() => window.location.replace(redirectOnDone), 2500);
        return;
      }

      // Render prova
      container.innerHTML = this._renderExam({ testId, questions, minScore });

      // Wire submit
      const form = container.querySelector("form[data-n1test='form']");
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Confirmação simples (sem popup intrusivo)
        const ok = confirm("Confirma enviar sua prova? Após enviar, você não poderá refazer.");
        if (!ok) return;

        const payload = this._collectAnswers({ testId, questions, form });
        const result = this._grade({ questions, answers: payload.answers, minScore });

        // Persiste (1 tentativa)
        localStorage.setItem(KEY_DONE, "1");
        localStorage.setItem(KEY_RESULT, JSON.stringify({
          testId,
          at: Date.now(),
          totalPoints: result.totalPoints,
          earnedPoints: result.earnedPoints,
          scorePercent: result.scorePercent,
          passed: result.passed,
          breakdown: result.breakdown
        }));

        // Exibe resultado final
        container.innerHTML = this._renderResult({
          testId,
          result,
          minScore
        });

        // Trava retorno por histórico (melhora fluxo)
        try {
          history.pushState(null, "", location.href);
          window.addEventListener("popstate", () => history.pushState(null, "", location.href));
        } catch (err) {}
      });

      // Trava retorno por histórico durante a prova também
      try {
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", () => history.pushState(null, "", location.href));
      } catch (err) {}
    },

    // -------- Renderers --------
    _renderExam({ testId, questions, minScore }) {
      const total = questions.reduce((s, q) => s + (q.points || 1), 0);

      const qHtml = questions.map((q, idx) => {
        const n = idx + 1;
        const pts = q.points || 1;

        if (q.type === "mcq") {
          const opts = (q.options || []).map((opt, i) => {
            const name = `${testId}__${q.id}`;
            const id = `${name}__${i}`;
            return `
              <label class="n1opt" for="${id}">
                <input type="radio" name="${name}" id="${id}" value="${i}" required />
                <span>${this._escape(opt)}</span>
              </label>
            `;
          }).join("");

          return this._qCard(`
            <div class="n1q-top">
              <div class="n1q-num">Pergunta ${n}</div>
              <div class="n1q-pts">${pts} ponto(s)</div>
            </div>
            <h3 class="n1q-title">${this._escape(q.prompt)}</h3>
            <div class="n1q-body">${opts}</div>
          `);
        }

        if (q.type === "text") {
          const name = `${testId}__${q.id}`;
          const ph = q.placeholder || "Digite sua resposta...";
          return this._qCard(`
            <div class="n1q-top">
              <div class="n1q-num">Pergunta ${n}</div>
              <div class="n1q-pts">${pts} ponto(s)</div>
            </div>
            <h3 class="n1q-title">${this._escape(q.prompt)}</h3>
            <div class="n1q-body">
              <textarea name="${name}" rows="4" class="n1txt" placeholder="${this._escape(ph)}" required></textarea>
              <p class="n1hint">Responda com objetividade. A correção é automática por critérios definidos.</p>
            </div>
          `);
        }

        return this._qCard(`
          <p>Tipo de questão não suportado: <code>${this._escape(q.type)}</code></p>
        `);
      }).join("");

      // CSS mínimo local (não mexe no seu style.css)
      const css = `
        <style>
          .n1card{padding:18px;border-radius:18px}
          .n1meta{opacity:.85;margin:.25rem 0 0}
          .n1q{margin-top:14px}
          .n1q-top{display:flex;justify-content:space-between;gap:10px;opacity:.9}
          .n1q-title{margin:10px 0 10px;font-size:1.05rem}
          .n1opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);cursor:pointer;margin:10px 0}
          .n1opt input{margin-top:3px}
          .n1txt{width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);color:inherit;padding:12px;outline:none;resize:vertical}
          .n1hint{opacity:.75;margin:8px 0 0;font-size:.92rem}
          .n1actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
          .n1warn{opacity:.85;margin-top:10px}
          code{background:rgba(255,255,255,.08);padding:.12rem .35rem;border-radius:8px}
        </style>
      `;

      return `
        ${css}
        <section class="card n1card">
          <h2 style="margin:0;">Prova • ${this._escape(testId.toUpperCase())}</h2>
          <p class="n1meta">Total: <strong>${total}</strong> ponto(s) • Nota mínima: <strong>${minScore}%</strong> • <strong>1 tentativa</strong></p>
          <p class="n1warn">⚠️ Ao enviar, você não poderá refazer. Não use o botão voltar.</p>
        </section>

        <form data-n1test="form">
          ${qHtml}

          <section class="card n1card" style="margin-top:14px;">
            <div class="n1actions">
              <button class="btn btn-primary" type="submit">Finalizar e ver nota</button>
            </div>
          </section>
        </form>
      `;
    },

    _renderResult({ result, minScore }) {
      const pct = result.scorePercent;
      const passed = result.passed;

      return this._card(`
        <h2 style="margin-top:0;">Resultado</h2>
        <p style="opacity:.9;">Sua nota: <strong>${pct}%</strong></p>
        <p style="opacity:.9;">Pontuação: <strong>${result.earnedPoints}</strong> / ${result.totalPoints}</p>
        <p style="font-weight:700; font-size:1.1rem;">
          ${passed ? "✅ APROVADO" : "⛔ REPROVADO"}
        </p>
        <p style="opacity:.85;">Nota mínima: <strong>${minScore}%</strong></p>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,.10);margin:14px 0;">
        <p style="opacity:.85;margin:0;">Você pode fechar esta página ou voltar ao menu de testes.</p>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
          <a class="btn" href="../index.html">Voltar ao menu de testes</a>
        </div>
      `);
    },

    _renderLocked(saved, minScore) {
      const pct = saved?.scorePercent ?? "—";
      const passed = saved?.passed ? "✅ APROVADO" : "⛔ REPROVADO";

      return this._card(`
        <h2 style="margin-top:0;">Teste já finalizado</h2>
        <p style="opacity:.9;">Este teste possui <strong>apenas 1 tentativa</strong>.</p>
        <p style="opacity:.9;">Sua nota registrada: <strong>${pct}%</strong> (${passed})</p>
        <p style="opacity:.85;">Nota mínima: <strong>${minScore}%</strong></p>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
          <a class="btn" href="../index.html">Voltar ao menu de testes</a>
        </div>
      `);
    },

    _qCard(inner) {
      return `<section class="card n1q">${inner}</section>`;
    },

    _card(inner) {
      return `<section class="card" style="margin-top:14px;">${inner}</section>`;
    },

    _escape(s) {
      return (s || "").toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    },

    // -------- Coleta + Correção --------
    _collectAnswers({ testId, questions, form }) {
      const answers = {};
      for (const q of questions) {
        const name = `${testId}__${q.id}`;

        if (q.type === "mcq") {
          const el = form.querySelector(`input[name="${name}"]:checked`);
          answers[q.id] = el ? parseInt(el.value, 10) : null;
        } else if (q.type === "text") {
          const el = form.querySelector(`textarea[name="${name}"]`);
          answers[q.id] = el ? el.value : "";
        } else {
          answers[q.id] = null;
        }
      }
      return { answers };
    },

    _grade({ questions, answers, minScore }) {
      let totalPoints = 0;
      let earnedPoints = 0;
      const breakdown = [];

      for (const q of questions) {
        const pts = q.points || 1;
        totalPoints += pts;

        let ok = false;

        if (q.type === "mcq") {
          ok = (answers[q.id] === q.correctIndex);
        }

        if (q.type === "text") {
          ok = this._gradeText(q, answers[q.id]);
        }

        if (ok) earnedPoints += pts;

        breakdown.push({
          id: q.id,
          type: q.type,
          points: pts,
          correct: ok
        });
      }

      const scorePercent = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePercent >= minScore;

      return { totalPoints, earnedPoints, scorePercent, passed, breakdown };
    },

    _gradeText(q, userAnswerRaw) {
      const user = normalizeText(userAnswerRaw);

      // 1) Resposta exata (quando definido)
      if (q.correctText) {
        const correct = normalizeText(q.correctText);
        return user === correct;
      }

      // 2) Rubrica por palavras-chave
      const rubric = q.rubric;
      if (!rubric || !Array.isArray(rubric.mustHaveAny)) return false;

      const groups = rubric.mustHaveAny
        .map(group => uniq(group.map(normalizeText)).filter(Boolean))
        .filter(g => g.length > 0);

      let hits = 0;
      for (const group of groups) {
        const found = group.some(term => user.includes(term));
        if (found) hits += 1;
      }

      const minHits = clamp(parseInt(rubric.minHits ?? groups.length, 10), 1, groups.length);
      return hits >= minHits;
    }
  };

  window.N1TestsEngine = N1TestsEngine;
})();
