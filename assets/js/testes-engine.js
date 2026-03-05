/* N1 Tests Engine — wizard/scroll
   - Provas com MCQ + texto
   - Modo wizard (1 pergunta por tela) ou scroll (tudo de uma vez)

   FIX (2026-03-05):
   - No modo wizard, o "Finalizar" usava `session.answers` (estado antigo).
     Agora sincroniza e corrige/gera relatório usando `answersNow` (estado atual).
   - Proteção contra duplo clique no Finalizar.
*/
(() => {
  // ========= Helpers =========
  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeParse(s) {
    try { return JSON.parse(s); } catch (e) { return null; }
  }

function postResult(reportUrl, payload) {
  if (!reportUrl) return;

  const data = JSON.stringify(payload);

  // 1) Melhor caminho (não depende de CORS)
  try {
    if (navigator && typeof navigator.sendBeacon === "function") {
      // text/plain evita preflight
      const blob = new Blob([data], { type: "text/plain;charset=UTF-8" });
      navigator.sendBeacon(reportUrl, blob);
      return;
    }
  } catch (e) { /* ignora */ }

  // 2) Fallback: fetch sem headers + no-cors (evita preflight)
  try {
    fetch(reportUrl, {
      method: "POST",
      mode: "no-cors",
      body: data
    }).catch(function () { /* silencioso */ });
  } catch (e) { /* silencioso */ }
}

  // ========= Banco de Questões =========
  const QUESTION_BANK = {
    t1: [
      {
        id: "t1q01",
        type: "mcq",
        points: 1,
        prompt: "Qual é o melhor objetivo de uma ligação de crédito pessoal com INSS?",
        options: [
          { id: "a", text: "Falar rápido e fechar no primeiro minuto." },
          { id: "b", text: "Gerar confiança, entender a necessidade e direcionar para o próximo passo." },
          { id: "c", text: "Pedir dados completos antes de qualquer explicação." },
          { id: "d", text: "Discutir com o cliente até ele concordar." }
        ],
        correct: "b"
      },
      {
        id: "t1q02",
        type: "mcq",
        points: 1,
        prompt: "Quando o cliente diz “não tenho interesse”, qual a melhor postura inicial?",
        options: [
          { id: "a", text: "Encerrar imediatamente sem tentar." },
          { id: "b", text: "Discutir e insistir para provar que ele está errado." },
          { id: "c", text: "Acolher, fazer uma pergunta simples e tentar entender o motivo." },
          { id: "d", text: "Oferecer taxa impossível só pra segurar." }
        ],
        correct: "c"
      },
      {
        id: "t1q03",
        type: "mcq",
        points: 1,
        prompt: "Qual é um bom “próximo passo” após despertar interesse?",
        options: [
          { id: "a", text: "Pedir CPF e senha do banco." },
          { id: "b", text: "Enviar mensagem no WhatsApp com resumo + confirmação do interesse." },
          { id: "c", text: "Prometer liberação em 5 minutos." },
          { id: "d", text: "Mandar áudio de 10 minutos sem contexto." }
        ],
        correct: "b"
      },
      {
        id: "t1q04",
        type: "mcq",
        points: 1,
        prompt: "O que mais destrói a confiança do cliente no início da chamada?",
        options: [
          { id: "a", text: "Falar com calma e explicar o processo." },
          { id: "b", text: "Ser objetivo e confirmar dados básicos." },
          { id: "c", text: "Pressionar e pedir dados sensíveis sem contexto." },
          { id: "d", text: "Perguntar qual horário é melhor." }
        ],
        correct: "c"
      },
      {
        id: "t1q05",
        type: "mcq",
        points: 1,
        prompt: "Qual frase melhor abre espaço para sondagem sem parecer interrogatório?",
        options: [
          { id: "a", text: "Me passa seus dados agora." },
          { id: "b", text: "Só pra eu te orientar certo: qual o principal motivo de buscar esse valor?" },
          { id: "c", text: "Você vai fazer ou não?" },
          { id: "d", text: "Se não fizer hoje, perde." }
        ],
        correct: "b"
      },
      {
        id: "t1q06",
        type: "mcq",
        points: 1,
        prompt: "Em objeção de juros, qual é a melhor linha?",
        options: [
          { id: "a", text: "Juros é assim mesmo, aceita." },
          { id: "b", text: "Comparar com alternativas (cartão/cheque especial) e focar no uso inteligente do crédito." },
          { id: "c", text: "Ignorar o cliente e continuar o script." },
          { id: "d", text: "Prometer juros zero." }
        ],
        correct: "b"
      },
      {
        id: "t1q07",
        type: "mcq",
        points: 1,
        prompt: "Qual é o papel da confirmação de dados no atendimento?",
        options: [
          { id: "a", text: "Somente burocracia." },
          { id: "b", text: "Gerar segurança e garantir elegibilidade antes de avançar." },
          { id: "c", text: "Ganhar tempo." },
          { id: "d", text: "Assustar o cliente." }
        ],
        correct: "b"
      },
      {
        id: "t1q08",
        type: "mcq",
        points: 1,
        prompt: "Se o cliente pede para “pensar”, qual ação mais inteligente?",
        options: [
          { id: "a", text: "Dizer que não dá, tem que fechar agora." },
          { id: "b", text: "Perguntar o que falta pra decidir e combinar um retorno com objetivo claro." },
          { id: "c", text: "Desligar." },
          { id: "d", text: "Mandar mensagem todo dia sem contexto." }
        ],
        correct: "b"
      },
      {
        id: "t1q09",
        type: "mcq",
        points: 1,
        prompt: "Qual é o melhor momento para oferecer simulação/condição?",
        options: [
          { id: "a", text: "Antes de entender necessidade." },
          { id: "b", text: "Depois de sondagem e alinhamento do cenário do cliente." },
          { id: "c", text: "Nunca." },
          { id: "d", text: "Só no final, sem explicar." }
        ],
        correct: "b"
      },
      {
        id: "t1q10",
        type: "mcq",
        points: 1,
        prompt: "O que significa “conduzir” o atendimento?",
        options: [
          { id: "a", text: "Falar sem parar." },
          { id: "b", text: "Guiar etapas: abrir, sondar, argumentar, confirmar, próximo passo." },
          { id: "c", text: "Ser agressivo." },
          { id: "d", text: "Ignorar objeções." }
        ],
        correct: "b"
      },
      {
        id: "t1q11",
        type: "mcq",
        points: 1,
        prompt: "Qual erro comum mata conversão em crédito?",
        options: [
          { id: "a", text: "Explicar processo." },
          { id: "b", text: "Pular etapas e tentar fechar sem confiança." },
          { id: "c", text: "Confirmar horário de retorno." },
          { id: "d", text: "Ouvir o cliente." }
        ],
        correct: "b"
      },
      {
        id: "t1q12",
        type: "mcq",
        points: 1,
        prompt: "Qual é o melhor objetivo de uma mensagem no WhatsApp após a ligação?",
        options: [
          { id: "a", text: "Mandar spam." },
          { id: "b", text: "Registrar o combinado e facilitar o próximo passo com clareza." },
          { id: "c", text: "Assustar com urgência falsa." },
          { id: "d", text: "Mandar link sem explicação." }
        ],
        correct: "b"
      },
      {
        id: "t1q13",
        type: "mcq",
        points: 1,
        prompt: "Se o cliente está com receio de golpe, qual resposta é mais sólida?",
        options: [
          { id: "a", text: "Confia em mim." },
          { id: "b", text: "Explicar passos, canais, validações e dar tempo para ele confirmar." },
          { id: "c", text: "Ignorar." },
          { id: "d", text: "Pressionar." }
        ],
        correct: "b"
      },
      {
        id: "t1q14",
        type: "mcq",
        points: 1,
        prompt: "O que é “próximo passo” no contexto de atendimento consultivo?",
        options: [
          { id: "a", text: "Uma frase genérica." },
          { id: "b", text: "Um combinado específico: o que acontece, quando e por qual canal." },
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

  // Expor banco para reaproveitar
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
      if (!container) throw new Error(`N1TestsEngine.mount: container #${containerId} não encontrado.`);

      const questions = (cfg.questions && Array.isArray(cfg.questions)) ? cfg.questions : (QUESTION_BANK[testId] || []);
      if (!questions.length) {
        container.innerHTML = `<div class="card"><h2>Sem questões</h2><p>Não há questões configuradas para este teste (${escapeHtml(testId)}).</p></div>`;
        return;
      }

      const KEY_DONE = `n1_tests_${testId}_done_v1`;
      const KEY_RESULT = `n1_tests_${testId}_result_v1`;

      // se já concluiu
      const done = localStorage.getItem(KEY_DONE) === "1";
      if (done) {
        const saved = safeParse(localStorage.getItem(KEY_RESULT));
        container.innerHTML = this._renderLocked(saved, minScore);
        this._bindExitButton(container, redirectOnDone);
        return;
      }

      // sessão atual do wizard
      const session = safeParse(sessionStorage.getItem(sessionKey)) || { i: 0, answers: {} };

      // bloqueio se sem vídeo (opcional, mas aqui respeita seu HTML)
      if (cfg.requireVideo && cfg.requireVideo === true) {
        // você controla fora, mas mantém compatível
        if (cfg.videoKey && localStorage.getItem(cfg.videoKey) !== "1") {
          window.location.replace(redirectOnMissingVideo);
          return;
        }
      }

      const postResultUrl = cfg.reportUrl;

      const renderStep = () => {
        const total = questions.length;

        // estado mutável (sempre “fonte da verdade”)
        const state = safeParse(sessionStorage.getItem(sessionKey)) || session;
        state.i = Number.isFinite(state.i) ? state.i : 0;
        state.answers = state.answers || {};

        const i = Math.min(Math.max(state.i, 0), total - 1);

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

          // sincroniza também no objeto "session" (evita estado antigo na correção final)
          try { session.answers = state.answers; } catch (e) {}

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
            if (btnFinish.dataset && btnFinish.dataset.busy === "1") return;

            const ok = saveCurrent();
            if (!ok) return;

            try { btnFinish.dataset.busy = "1"; btnFinish.disabled = true; } catch (e) {}

            const answersNow = (state && state.answers) ? state.answers : (session && session.answers ? session.answers : {});
            const result = this._grade({ questions, answers: answersNow, minScore });

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
              answers: answersNow
            };

            localStorage.setItem(KEY_RESULT, JSON.stringify(reportPayload));
            postResult(postResultUrl, reportPayload);

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

      // shell do wizard
      if (mode === "wizard") {
        container.innerHTML = this._renderWizardShell({ testId, questions, minScore, allowBackQuestions });
      } else {
        container.innerHTML = this._renderScrollShell({ testId, questions, minScore });
        const form = container.querySelector("form");
        if (form) {
          form.addEventListener("submit", (ev) => {
            ev.preventDefault();
            const { answers } = this._collectAnswersScroll({ testId, questions, form });

            // valida: não pode ficar vazia em texto e mcq precisa marcar
            const invalid = questions.find((q) => {
              const a = answers[q.id];
              if (q.type === "mcq") return !a;
              return !String(a || "").trim();
            });

            if (invalid) {
              alert("Responda todas as questões para finalizar.");
              return;
            }

            const result = this._grade({ questions, answers, minScore });

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
              answers: answers
            };

            localStorage.setItem(KEY_RESULT, JSON.stringify(reportPayload));
            postResult(postResultUrl, reportPayload);

            container.innerHTML = this._renderResult({ result, minScore });

            setTimeout(() => {
              try { window.location.replace(redirectOnDone); } catch (e) {}
            }, 1200);
          });
        }
      }

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
        </section>
      `;
    },

    _renderResult({ result, minScore }) {
      const passed = result.passed;
      return `
        <section class="card">
          <h2 style="margin:0 0 6px;">Resultado</h2>
          <p style="opacity:.9;margin:0 0 8px;">Nota mínima: ${minScore}%</p>
          <p style="margin:0;"><b>Nota:</b> ${result.scorePercent}% • <b>${passed ? "APROVADO ✅" : "REPROVADO ❌"}</b></p>
          <p style="opacity:.85;margin:10px 0 0;">Você será redirecionado…</p>
        </section>
      `;
    },

    _renderScrollShell({ testId, questions, minScore }) {
      const items = questions.map((q, idx) => {
        return `
          <article class="card" style="margin-top:14px;">
            <p style="opacity:.85;margin:0 0 6px;">Questão ${idx + 1} de ${questions.length}</p>
            <h3 style="margin:0 0 10px;">${escapeHtml(q.prompt)}</h3>
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
            <div>
              <span class="pill" style="opacity:.95">${allowBackQuestions ? "Voltar permitido" : "Voltar bloqueado"}</span>
            </div>
          </div>
          <div style="height:10px;background:rgba(255,255,255,.06);border-radius:999px;margin-top:14px;overflow:hidden;">
            <div data-progress style="height:100%;width:0%;background:linear-gradient(90deg,#ffffff,#ff2fd8);"></div>
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
          <h3 style="margin:0 0 10px;">${escapeHtml(q.prompt)}</h3>
          ${body}
          <p data-err style="margin:10px 0 0;color:#ff8aa1;min-height:18px;"></p>
        </section>
      `;
    },

    _renderQuestionBody({ testId, q }) {
      if (q.type === "mcq") {
        const opts = (q.options || []).map((o) => {
          return `
            <label class="split-card" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
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
