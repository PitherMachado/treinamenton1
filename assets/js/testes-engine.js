/* assets/js/testes-engine.js
   Motor genérico de provas (GitHub Pages / HTML estático)
   - Suporta modo "wizard" (1 pergunta por tela) ou "scroll" (todas de uma vez)
   - 1 tentativa (localStorage)
   - Nota mínima configurável
   - (NOVO) Report opcional via webhook (Google Sheets / Apps Script)
*/

(function () {
  // ========= Helpers =========
  function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }

  // ========= Report (opcional) =========
  // Envia o resultado para um endpoint (ex.: Google Apps Script) para você ver notas de todos os alunos.
  function postResult(reportUrl, payload) {
    if (!reportUrl) return;
    try {
      fetch(reportUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () { /* silencioso */ });
    } catch (e) { /* silencioso */ }
  }

  // ========= Banco de Questões =========
  // (mantido do seu arquivo original)
  const QUESTION_BANK = {
    t1: [
      {
        id: "t1q01",
        type: "mcq",
        points: 1,
        prompt: "Qual é o melhor objetivo de uma ligação de crédito pessoal com INSS?",
        options: [
          { id: "a", text: "Falar rápido e fechar no primeiro minuto." },
          { id: "b", text: "Gerar confiança, entender o cliente e conduzir para a decisão." },
          { id: "c", text: "Passar o máximo de informações técnicas possíveis." },
          { id: "d", text: "Perguntar se quer e encerrar se disser não." }
        ],
        correct: "b"
      },
      {
        id: "t1q02",
        type: "mcq",
        points: 1,
        prompt: "Quando o cliente diz “vou pensar”, o que você faz primeiro?",
        options: [
          { id: "a", text: "Encerrra e pede para ele te retornar." },
          { id: "b", text: "Pressiona com urgência e ameaça perder a condição." },
          { id: "c", text: "Pergunta o motivo e isola a dúvida principal com calma." },
          { id: "d", text: "Oferece desconto imediato." }
        ],
        correct: "c"
      },
      {
        id: "t1q03",
        type: "mcq",
        points: 1,
        prompt: "Qual postura melhora a conversão em chamadas com aposentados/pensionistas?",
        options: [
          { id: "a", text: "Falar com pressa e cortar o cliente." },
          { id: "b", text: "Tom de voz calmo, segurança e clareza no passo a passo." },
          { id: "c", text: "Muita gíria para parecer próximo." },
          { id: "d", text: "Não perguntar nada, só oferecer valores." }
        ],
        correct: "b"
      },
      {
        id: "t1q04",
        type: "mcq",
        points: 1,
        prompt: "Qual é o melhor momento de apresentar a proposta?",
        options: [
          { id: "a", text: "Antes de qualquer pergunta." },
          { id: "b", text: "Depois de criar contexto e confirmar necessidade/objetivo." },
          { id: "c", text: "Só no final quando o cliente estiver cansado." },
          { id: "d", text: "Sempre no início para ganhar tempo." }
        ],
        correct: "b"
      },
      {
        id: "t1q05",
        type: "mcq",
        points: 1,
        prompt: "Se o cliente fala “juros alto”, qual resposta é mais inteligente?",
        options: [
          { id: "a", text: "Não é alto, é o padrão." },
          { id: "b", text: "Então não faz." },
          { id: "c", text: "Comparar com cartão/cheque especial e mostrar vantagem do prazo/planejamento." },
          { id: "d", text: "Ignorar e continuar." }
        ],
        correct: "c"
      },
      {
        id: "t1q06",
        type: "mcq",
        points: 1,
        prompt: "A melhor forma de reduzir resistência é:",
        options: [
          { id: "a", text: "Discutir com o cliente até ele ceder." },
          { id: "b", text: "Conduzir com perguntas e confirmar entendimento." },
          { id: "c", text: "Prometer o que não pode." },
          { id: "d", text: "Falar sem parar." }
        ],
        correct: "b"
      },
      {
        id: "t1q07",
        type: "mcq",
        points: 1,
        prompt: "Qual é uma regra de ouro em telemarketing de crédito?",
        options: [
          { id: "a", text: "Cliente não decide: você decide." },
          { id: "b", text: "Sem clareza de próximo passo, a venda morre." },
          { id: "c", text: "Quanto mais rápido, melhor sempre." },
          { id: "d", text: "Nunca confirme dados." }
        ],
        correct: "b"
      },
      {
        id: "t1q08",
        type: "mcq",
        points: 1,
        prompt: "Quando o cliente não atende, o melhor é:",
        options: [
          { id: "a", text: "Desistir para sempre." },
          { id: "b", text: "Tentar em horários diferentes e manter cadência organizada." },
          { id: "c", text: "Ligar 30 vezes seguidas." },
          { id: "d", text: "Mandar áudio longo sem permissão." }
        ],
        correct: "b"
      },
      {
        id: "t1q09",
        type: "mcq",
        points: 1,
        prompt: "O que significa “próximo passo” no atendimento?",
        options: [
          { id: "a", text: "Uma frase genérica para encerrar." },
          { id: "b", text: "Uma ação clara com data/horário/condição definida." },
          { id: "c", text: "Um bônus." },
          { id: "d", text: "Um desconto." }
        ],
        correct: "b"
      },
      {
        id: "t1q10",
        type: "mcq",
        points: 1,
        prompt: "Qual frase é melhor para conduzir para WhatsApp?",
        options: [
          { id: "a", text: "Me chama aí." },
          { id: "b", text: "Vou te mandar agora um resumo e você só confirma OK." },
          { id: "c", text: "Depois a gente vê." },
          { id: "d", text: "Você que sabe." }
        ],
        correct: "b"
      },
      {
        id: "t1q11",
        type: "mcq",
        points: 1,
        prompt: "Por que validar dados com clareza é importante?",
        options: [
          { id: "a", text: "Para enrolar mais." },
          { id: "b", text: "Para dar segurança e evitar retrabalho/erros no processo." },
          { id: "c", text: "Não é importante." },
          { id: "d", text: "Só para cumprir script." }
        ],
        correct: "b"
      },
      {
        id: "t1q12",
        type: "mcq",
        points: 1,
        prompt: "Qual é a melhor forma de lidar com objeção sem discussão?",
        options: [
          { id: "a", text: "Negar a objeção." },
          { id: "b", text: "Validar, esclarecer e conduzir com lógica + próximo passo." },
          { id: "c", text: "Subir o tom." },
          { id: "d", text: "Cortar o cliente." }
        ],
        correct: "b"
      },
      {
        id: "t1q13",
        type: "mcq",
        points: 1,
        prompt: "Quando o cliente diz “não tenho interesse”, o que fazer?",
        options: [
          { id: "a", text: "Encerrar na hora." },
          { id: "b", text: "Abrir conversa com 1 pergunta simples e oferecer contexto." },
          { id: "c", text: "Insistir falando mais alto." },
          { id: "d", text: "Ignorar." }
        ],
        correct: "b"
      },
      {
        id: "t1q14",
        type: "mcq",
        points: 1,
        prompt: "O que mais aumenta conversão em venda consultiva de crédito?",
        options: [
          { id: "a", text: "Pressa e urgência falsa." },
          { id: "b", text: "Clareza, segurança e condução de processo (etapas)." },
          { id: "c", text: "Falar rápido." },
          { id: "d", text: "Prometer taxa impossível." }
        ],
        correct: "b"
      },
      {
        id: "t1q15",
        type: "text",
        points: 1,
        prompt: "Em 1 frase, qual é o objetivo de um “próximo passo” bem definido no atendimento?",
        rubric: {
          mustHaveAny: [
            ["clareza", "objetivo"],
            ["avançar", "seguir", "próximo passo"],
            ["fechamento", "conversão", "decisão"],
            ["compromisso", "alinhamento"]
          ],
          minHits: 2
        },
        placeholder: "Digite sua resposta..."
      }
    ]
  };

  // Expor banco para você poder reaproveitar em outros arquivos se quiser
  window.N1TestsBank = QUESTION_BANK;

  // ========= Engine =========
  const N1TestsEngine = {
    mount(config) {
      const cfg = config || {};
      const testId = cfg.testId;
      const minScore = cfg.minScore ?? 70;

      const mode = (cfg.mode || "wizard").toLowerCase(); // "wizard" | "scroll"
      const containerId = cfg.containerId || "testRoot";

      const redirectOnMissingVideo = cfg.redirectOnMissingVideo || "./video.html";
      const redirectOnDone = cfg.redirectOnDone || "./index.html";

      const allowBackQuestions = !!cfg.allowBackQuestions; // padrão: false (mais rígido)
      const sessionKey = `n1_tests_${testId}_session_v1`;

      if (!testId) throw new Error("N1TestsEngine.mount: testId é obrigatório.");

      const container = document.getElementById(containerId);
      if (!container) throw new Error(`N1TestsEngine.mount: container #${containerId} não existe.`);

      const questions = (QUESTION_BANK[testId] || []).slice();
      if (!questions.length) {
        container.innerHTML = `<div class="card"><h2>Sem questões</h2><p>Não há questões configuradas para o teste <b>${escapeHtml(testId)}</b>.</p></div>`;
        return;
      }

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
        setTimeout(() => window.location.replace(redirectOnDone), 900);
        return;
      }

      // monta UI conforme modo
      if (mode === "scroll") {
        container.innerHTML = this._renderScroll({ testId, questions, minScore });
        const form = container.querySelector("form");
        if (!form) return;

        form.addEventListener("submit", (ev) => {
          ev.preventDefault();

          const payload = this._collectAnswersScroll({ testId, questions, form });
          const result = this._grade({ questions, answers: payload.answers, minScore });

          localStorage.setItem(KEY_DONE, "1");

          const user = (cfg && cfg.user)
            ? cfg.user
            : (window.N1TestAuth && typeof window.N1TestAuth.getUser === "function" ? window.N1TestAuth.getUser() : null);

          const reportPayload = {
            testId,
            at: Date.now(),
            user: user,
            totalPoints: result.totalPoints,
            earnedPoints: result.earnedPoints,
            scorePercent: result.scorePercent,
            passed: result.passed,
            breakdown: result.breakdown,
            answers: payload.answers
          };

          localStorage.setItem(KEY_RESULT, JSON.stringify(reportPayload));
          postResult(cfg && cfg.reportUrl, reportPayload);

          container.innerHTML = this._renderResult({ result, minScore });
        });

        this._bindExitButton(container, redirectOnDone);
        return;
      }

      // wizard (1 por tela)
      container.innerHTML = this._renderWizardShell({ testId, questions, minScore, allowBackQuestions });

      const state = safeParse(sessionStorage.getItem(sessionKey)) || {
        i: 0,
        answers: {},
        startedAt: Date.now()
      };

      sessionStorage.setItem(sessionKey, JSON.stringify(state));

      const renderStep = () => {
        const total = questions.length;
        const i = clamp(state.i, 0, total - 1);

        const q = questions[i];
        const stepHost = container.querySelector("[data-step-host]");
        if (!stepHost) return;

        stepHost.innerHTML = this._renderQuestion({ testId, q, index: i, total });

        // progress
        const prog = container.querySelector("[data-progress]");
        if (prog) prog.style.width = `${Math.round(((i + 1) / total) * 100)}%`;

        // bind
        const btnNext = container.querySelector("[data-next]");
        const btnBack = container.querySelector("[data-back]");
        const btnFinish = container.querySelector("[data-finish]");

        if (btnBack) {
          btnBack.disabled = (!allowBackQuestions) || i === 0;
          btnBack.onclick = () => {
            if (!allowBackQuestions) return;
            state.i = Math.max(0, state.i - 1);
            sessionStorage.setItem(sessionKey, JSON.stringify(state));
            renderStep();
          };
        }

        const saveCurrent = () => {
          const ans = this._collectSingleAnswer({ q, root: stepHost });
          if (ans === null) return false;
          state.answers[q.id] = ans;
          sessionStorage.setItem(sessionKey, JSON.stringify(state));
          return true;
        };

        if (btnNext) {
          btnNext.style.display = (i < total - 1) ? "" : "none";
          btnNext.onclick = () => {
            const ok = saveCurrent();
            if (!ok) return;
            state.i = Math.min(total - 1, state.i + 1);
            sessionStorage.setItem(sessionKey, JSON.stringify(state));
            renderStep();
          };
        }

        if (btnFinish) {
          btnFinish.style.display = (i === total - 1) ? "" : "none";
          btnFinish.onclick = () => {
            const ok = saveCurrent();
            if (!ok) return;

            const result = this._grade({ questions, answers: session.answers, minScore });

            localStorage.setItem(KEY_DONE, "1");

            const user = (cfg && cfg.user)
              ? cfg.user
              : (window.N1TestAuth && typeof window.N1TestAuth.getUser === "function" ? window.N1TestAuth.getUser() : null);

            const reportPayload = {
              testId,
              at: Date.now(),
              user: user,
              totalPoints: result.totalPoints,
              earnedPoints: result.earnedPoints,
              scorePercent: result.scorePercent,
              passed: result.passed,
              breakdown: result.breakdown,
              answers: session.answers
            };

            localStorage.setItem(KEY_RESULT, JSON.stringify(reportPayload));
            postResult(cfg && cfg.reportUrl, reportPayload);

            // limpa sessão (pra não tentar reabrir)
            sessionStorage.removeItem(sessionKey);

            container.innerHTML = this._renderResult({ result, minScore });

            // redirect opcional
            setTimeout(() => {
              try { window.location.replace(redirectOnDone); } catch (e) {}
            }, 1200);
          };
        }

        // (opcional) Enter = next / finish
        stepHost.addEventListener("keydown", (ev) => {
          if (ev.key !== "Enter") return;
          const isText = !!stepHost.querySelector("textarea, input[type=text]");
          if (isText) return;
          ev.preventDefault();
          if (i === total - 1 && btnFinish) btnFinish.click();
          else if (btnNext) btnNext.click();
        }, { once: true });
      };

      renderStep();
      this._bindExitButton(container, redirectOnDone);
    },

    // ========= UI Render =========
    _renderLocked(saved, minScore) {
      const pct = saved?.scorePercent ?? 0;
      const passed = !!saved?.passed;
      return `
        <section class="card">
          <h2>Prova já concluída</h2>
          <p>Você já finalizou esta prova.</p>
          <p><b>Nota:</b> ${pct}% • <b>Resultado:</b> ${passed ? "APROVADO" : "REPROVADO"} • <b>Mínimo:</b> ${minScore}%</p>
          <p style="opacity:.8;margin-top:10px;">Redirecionando…</p>
        </section>
      `;
    },

    _renderResult({ result, minScore }) {
      const badge = result.passed ? "APROVADO" : "REPROVADO";
      const hint = result.passed
        ? "Parabéns. Você atingiu a nota mínima."
        : "Você não atingiu a nota mínima nesta tentativa.";
      return `
        <section class="card">
          <h2>Resultado</h2>
          <p><b>Nota:</b> ${result.scorePercent}% • <b>Mínimo:</b> ${minScore}% • <b>Status:</b> ${badge}</p>
          <p style="opacity:.9">${escapeHtml(hint)}</p>
        </section>
      `;
    },

    _renderScroll({ testId, questions, minScore }) {
      const items = questions.map((q, idx) => {
        return `
          <article class="card" style="margin-top:14px;">
            <h3 style="margin:0 0 10px;">${idx + 1}. ${escapeHtml(q.prompt)}</h3>
            ${this._renderQuestionBody({ testId, q })}
          </article>
        `;
      }).join("");

      return `
        <section class="card">
          <h2 style="margin:0 0 6px;">Prova</h2>
          <p style="opacity:.85;margin:0;">Modo completo • Nota mínima ${minScore}%</p>
        </section>
        <form style="margin-top:14px;">
          ${items}
          <button class="btn btn-primary" type="submit" style="margin-top:14px;">Finalizar</button>
        </form>
      `;
    },

    _renderWizardShell({ testId, questions, minScore, allowBackQuestions }) {
      const total = questions.length;
      return `
        <section class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div>
              <h2 style="margin:0;">Prova</h2>
              <p style="opacity:.85;margin:6px 0 0;">1 pergunta por tela • Nota mínima ${minScore}% • Total ${total}</p>
            </div>
            <div class="pill">${allowBackQuestions ? "Voltar: liberado" : "Voltar: bloqueado"}</div>
          </div>

          <div style="height:10px;border-radius:999px;background:rgba(255,255,255,.06);margin-top:14px;overflow:hidden;">
            <div data-progress style="height:100%;width:0%;background:linear-gradient(90deg,#fff,#ff2fd8);"></div>
          </div>
        </section>

        <div data-step-host style="margin-top:14px;"></div>

        <div class="row" style="justify-content:space-between;margin-top:14px;">
          <button class="btn btn-ghost" type="button" data-back>Voltar</button>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-primary" type="button" data-next>Próxima</button>
            <button class="btn btn-primary" type="button" data-finish style="display:none;">Finalizar</button>
          </div>
        </div>
      `;
    },

    _renderQuestion({ testId, q, index, total }) {
      const body = this._renderQuestionBody({ testId, q });
      return `
        <section class="card">
          <p style="opacity:.85;margin:0 0 6px;">Questão ${index + 1} de ${total}</p>
          <h3 style="margin:0 0 12px;">${escapeHtml(q.prompt)}</h3>
          ${body}
          <p class="form-error" data-err style="min-height:18px;margin-top:10px;"></p>
        </section>
      `;
    },

    _renderQuestionBody({ testId, q }) {
      if (q.type === "mcq") {
        const opts = (q.options || []).map(o => {
          return `
            <label class="row" style="align-items:flex-start;">
              <input type="radio" name="${escapeHtml(q.id)}" value="${escapeHtml(o.id)}" />
              <span style="opacity:.95">${escapeHtml(o.text)}</span>
            </label>
          `;
        }).join("");
        return `<div class="kv" style="gap:10px;">${opts}</div>`;
      }

      // text
      const ph = q.placeholder || "Digite...";
      return `
        <div class="kv">
          <textarea name="${escapeHtml(q.id)}"
            rows="3"
            style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);color:#fff;"
            placeholder="${escapeHtml(ph)}"></textarea>
        </div>
      `;
    },

    // ========= Coleta =========
    _collectAnswersScroll({ testId, questions, form }) {
      const answers = {};
      questions.forEach((q) => {
        if (q.type === "mcq") {
          const checked = form.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`);
          answers[q.id] = checked ? checked.value : null;
        } else {
          const t = form.querySelector(`[name="${CSS.escape(q.id)}"]`);
          answers[q.id] = t ? String(t.value || "").trim() : "";
        }
      });
      return { answers };
    },

    _collectSingleAnswer({ q, root }) {
      const err = root.querySelector("[data-err]");
      if (err) err.textContent = "";

      if (q.type === "mcq") {
        const checked = root.querySelector(`input[name="${CSS.escape(q.id)}"]:checked`);
        if (!checked) {
          if (err) err.textContent = "Selecione uma alternativa para continuar.";
          return null;
        }
        return checked.value;
      }

      const t = root.querySelector(`[name="${CSS.escape(q.id)}"]`);
      const v = t ? String(t.value || "").trim() : "";
      if (!v) {
        if (err) err.textContent = "Escreva sua resposta para continuar.";
        return null;
      }
      return v;
    },

    // ========= Correção =========
    _grade({ questions, answers, minScore }) {
      let totalPoints = 0;
      let earnedPoints = 0;
      const breakdown = [];

      questions.forEach((q) => {
        const pts = q.points ?? 1;
        totalPoints += pts;

        const given = answers[q.id];
        let ok = false;

        if (q.type === "mcq") {
          ok = (given === q.correct);
        } else {
          ok = this._gradeText(q, given);
        }

        if (ok) earnedPoints += pts;

        breakdown.push({
          id: q.id,
          ok,
          points: pts,
          given: given ?? null
        });
      });

      const scorePercent = totalPoints ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = scorePercent >= (minScore ?? 70);

      return { totalPoints, earnedPoints, scorePercent, passed, breakdown };
    },

    _gradeText(q, text) {
      const t = String(text || "").toLowerCase();
      const rubric = q.rubric;
      if (!rubric || !rubric.mustHaveAny) return t.length >= 8;

      let hits = 0;
      for (const group of rubric.mustHaveAny) {
        const ok = group.some(word => t.includes(String(word).toLowerCase()));
        if (ok) hits++;
      }
      return hits >= (rubric.minHits ?? 2);
    },

    // ========= Extras =========
    _bindExitButton(container, redirectOnDone) {
      const btnExit = document.getElementById("logout");
      if (!btnExit) return;
      btnExit.addEventListener("click", () => {
        try { window.location.replace(redirectOnDone); } catch (e) {}
      });
    }
  };

  window.N1TestsEngine = N1TestsEngine;
})();
