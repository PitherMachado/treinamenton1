/* assets/js/testes-engine.js
   Motor genérico de provas (GitHub Pages / HTML estático)
   - Suporta modo "wizard" (1 pergunta por tela) ou "scroll" (todas de uma vez)
   - 1 tentativa (localStorage)
   - Nota mínima configurável
*/

(function () {
  // ========= Helpers =========
  function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function normalizeText(s) {
    return (s || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/\s+/g, " ");
  }

  function uniq(arr) { return Array.from(new Set(arr)); }

  function esc(s) {
    return (s || "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ========= BANCO DE QUESTÕES (VOCÊ EDITA SÓ AQUI) =========
  const QUESTION_BANK = {
   t1: [
  {
    id: "t1_q1",
    type: "mcq",
    points: 1,
    prompt: "Qual é o objetivo principal da sondagem no atendimento?",
    options: [
      "Falar mais que o cliente para convencer",
      "Descobrir a necessidade real do cliente",
      "Encerrar rápido para ganhar volume",
      "Evitar perguntas para não parecer invasivo"
    ],
    correctIndex: 1
  },
  {
    id: "t1_q2",
    type: "mcq",
    points: 1,
    prompt: "Qual destas atitudes aumenta a confiança do cliente logo no início?",
    options: [
      "Prometer aprovação antes de entender o caso",
      "Falar acelerado para mostrar domínio",
      "Explicar o próximo passo com clareza e segurança",
      "Pedir documentos antes de se apresentar"
    ],
    correctIndex: 2
  },
  {
    id: "t1_q3",
    type: "mcq",
    points: 1,
    prompt: "Quando o cliente diz 'vou pensar', qual é a melhor postura?",
    options: [
      "Encerrar imediatamente e esperar ele voltar",
      "Pressionar com urgência sem ouvir o motivo",
      "Perguntar o que exatamente ele precisa analisar e orientar",
      "Ignorar e mudar o assunto"
    ],
    correctIndex: 2
  },
  {
    id: "t1_q4",
    type: "mcq",
    points: 1,
    prompt: "O que caracteriza uma argumentação forte?",
    options: [
      "Falar alto e com emoção",
      "Dar muitos detalhes técnicos sem necessidade",
      "Conectar benefício com a dor/necessidade do cliente",
      "Repetir a oferta várias vezes"
    ],
    correctIndex: 2
  },
  {
    id: "t1_q5",
    type: "mcq",
    points: 1,
    prompt: "Qual é a função da validação antes de responder uma objeção?",
    options: [
      "Concordar com tudo que o cliente fala",
      "Aumentar o tempo da ligação",
      "Reduzir resistência e abrir espaço para o argumento",
      "Encerrar a objeção rapidamente"
    ],
    correctIndex: 2
  },

  {
    id: "t1_q6",
    type: "text",
    points: 1,
    prompt: "Explique em 1 frase o que significa 'mentalidade de dono' na operação.",
    rubric: {
      mustHaveAny: [
        ["responsabilidade", "responsavel"],
        ["resultado", "meta", "performance"],
        ["execucao", "agir", "proatividade", "fazer acontecer"]
      ],
      minHits: 2
    },
    placeholder: "Ex: assumir responsabilidade pelo resultado e executar sem desculpas..."
  },
  {
    id: "t1_q7",
    type: "text",
    points: 1,
    prompt: "Em 1 frase, qual é a diferença entre 'atender' e 'conduzir' um atendimento?",
    rubric: {
      mustHaveAny: [
        ["conduzir", "direcionar", "guiar", "controle"],
        ["processo", "etapas", "fluxo"],
        ["clareza", "objetivo", "fechamento", "conversao"]
      ],
      minHits: 2
    },
    placeholder: "Digite sua resposta..."
  },

  {
    id: "t1_q8",
    type: "mcq",
    points: 1,
    prompt: "Qual pergunta é mais forte para aprofundar a necessidade do cliente?",
    options: [
      "Você quer sim ou não?",
      "Por que você está buscando isso agora?",
      "Qual seu CPF?",
      "Você já fez antes?"
    ],
    correctIndex: 1
  },
  {
    id: "t1_q9",
    type: "mcq",
    points: 1,
    prompt: "O que é 'controle de conversa' em vendas?",
    options: [
      "Não deixar o cliente falar",
      "Conduzir a conversa com perguntas e próximos passos claros",
      "Falar o roteiro sem adaptar",
      "Encerrar quando o cliente questiona"
    ],
    correctIndex: 1
  },
  {
    id: "t1_q10",
    type: "mcq",
    points: 1,
    prompt: "Qual sinal indica que o cliente está mais pronto para avançar?",
    options: [
      "Ele faz perguntas de próximo passo (prazo, documentos, liberação)",
      "Ele muda de assunto",
      "Ele reclama do tempo",
      "Ele fala que não confia em nada"
    ],
    correctIndex: 0
  },

  {
    id: "t1_q11",
    type: "text",
    points: 1,
    prompt: "Cite 2 pontos que tornam um atendimento 'profissional e confiável'.",
    rubric: {
      mustHaveAny: [
        ["clareza", "objetivo", "explicar", "passo a passo"],
        ["seguranca", "confiança", "autoridade", "postura"],
        ["transparencia", "verdade", "sem promessa", "realismo"],
        ["documentacao", "procedimento", "processo", "organizacao"]
      ],
      minHits: 2
    },
    placeholder: "Ex: clareza no processo + postura segura..."
  },

  {
    id: "t1_q12",
    type: "mcq",
    points: 1,
    prompt: "Qual destas é uma forma correta de lidar com objeção de confiança?",
    options: [
      "Ignorar e repetir o preço",
      "Dizer 'confia em mim' sem prova",
      "Validar a preocupação e explicar o procedimento/segurança do processo",
      "Criticar outras empresas"
    ],
    correctIndex: 2
  },
  {
    id: "t1_q13",
    type: "mcq",
    points: 1,
    prompt: "Em uma operação de alta performance, o que vem antes da persuasão?",
    options: [
      "Pressa",
      "Clareza de processo e diagnóstico",
      "Piadas para quebrar gelo",
      "Desconto"
    ],
    correctIndex: 1
  },

  {
    id: "t1_q14",
    type: "text",
    points: 1,
    prompt: "Escreva um micro-argumento (1–2 frases) para quando o cliente disser: 'tá caro'.",
    rubric: {
      mustHaveAny: [
        ["entendo", "compreendo", "faz sentido"], // validação
        ["valor", "beneficio", "resultado", "vantagem"], // valor
        ["comparar", "custo", "investimento"], // reenquadramento
        ["passo", "processo", "proximo", "garantia"] // segurança
      ],
      minHits: 2
    },
    placeholder: "Digite seu micro-argumento..."
  },
  {
    id: "t1_q15",
    type: "text",
    points: 1,
    prompt: "Em 1 frase, qual é o objetivo de um 'próximo passo' bem definido no atendimento?",
    rubric: {
      mustHaveAny: [
        ["clareza", "objetivo"],
        ["avancar", "seguir", "proximo passo"],
        ["fechamento", "conversao", "decisao"],
        ["compromisso", "alinhamento"]
      ],
      minHits: 2
    },
    placeholder: "Digite sua resposta..."
  }
]
      // ✅ COPIE/COLE MAIS QUESTÕES ATÉ CHEGAR EM 15 (ou a quantidade que quiser)
      // Não precisa mudar mais nada no código.
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
      const redirectOnDone = cfg.redirectOnDone || "../index.html";

      const allowBackQuestions = !!cfg.allowBackQuestions; // padrão: false (mais rígido)
      const sessionKey = `n1_tests_${testId}_session_v1`;

      if (!testId) throw new Error("N1TestsEngine.mount: testId é obrigatório.");
      const container = document.getElementById(containerId);
      if (!container) throw new Error(`N1TestsEngine.mount: container #${containerId} não encontrado.`);

      const questions = QUESTION_BANK[testId];
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        container.innerHTML = this._card(`
          <h2>⚠️ Nenhuma pergunta configurada</h2>
          <p>Configure as perguntas em <code>assets/js/testes-engine.js</code> dentro de <code>QUESTION_BANK.${esc(testId)}</code>.</p>
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
        setTimeout(() => window.location.replace(redirectOnDone), 2500);
        return;
      }

      // CSS local mínimo (não mexe no seu style.css)
      container.insertAdjacentHTML("afterbegin", `
        <style>
          .n1card{padding:18px;border-radius:18px}
          .n1meta{opacity:.85;margin:.25rem 0 0}
          .n1q-top{display:flex;justify-content:space-between;gap:10px;opacity:.9}
          .n1q-title{margin:12px 0 10px;font-size:1.08rem}
          .n1opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);cursor:pointer;margin:10px 0}
          .n1opt input{margin-top:3px}
          .n1txt{width:100%;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);color:inherit;padding:12px;outline:none;resize:vertical}
          .n1hint{opacity:.75;margin:8px 0 0;font-size:.92rem}
          .n1actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px;flex-wrap:wrap}
          .n1progress{opacity:.9}
          .n1warn{opacity:.85;margin-top:10px}
          .n1err{opacity:.9;margin-top:10px}
          code{background:rgba(255,255,255,.08);padding:.12rem .35rem;border-radius:8px}
        </style>
      `);

      // Sessão (para manter respostas ao trocar de tela / refresh)
      const session = safeParse(sessionStorage.getItem(sessionKey)) || {
        idx: 0,
        answers: {}
      };

      // Modo scroll
      if (mode === "scroll") {
        container.innerHTML = this._renderExamScroll({ testId, questions, minScore });
        const form = container.querySelector("form[data-n1test='form']");
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const ok = confirm("Confirma enviar sua prova? Após enviar, você não poderá refazer.");
          if (!ok) return;

          const payload = this._collectAnswersScroll({ testId, questions, form });
          const result = this._grade({ questions, answers: payload.answers, minScore });

          localStorage.setItem(KEY_DONE, "1");
          localStorage.setItem(KEY_RESULT, JSON.stringify({
            testId, at: Date.now(),
            totalPoints: result.totalPoints,
            earnedPoints: result.earnedPoints,
            scorePercent: result.scorePercent,
            passed: result.passed,
            breakdown: result.breakdown
          }));

          container.innerHTML = this._renderResult({ result, minScore });
        });

        this._lockBackNav();
        return;
      }

      // Modo wizard (1 por tela)
      const renderWizard = () => {
        sessionStorage.setItem(sessionKey, JSON.stringify(session));
        const q = questions[session.idx];
        container.innerHTML = this._renderExamWizard({
          testId, questions, minScore,
          idx: session.idx,
          answer: session.answers[q.id],
          allowBackQuestions
        });

        // Eventos
        const btnNext = container.querySelector("[data-act='next']");
        const btnPrev = container.querySelector("[data-act='prev']");
        const btnFinish = container.querySelector("[data-act='finish']");
        const err = container.querySelector("#n1Err");

        // Captura resposta atual
        const saveCurrentAnswer = () => {
          const q = questions[session.idx];
          const name = `${testId}__${q.id}`;

          if (q.type === "mcq") {
            const checked = container.querySelector(`input[name="${name}"]:checked`);
            session.answers[q.id] = checked ? parseInt(checked.value, 10) : null;
          } else if (q.type === "text") {
            const ta = container.querySelector(`textarea[name="${name}"]`);
            session.answers[q.id] = ta ? ta.value : "";
          }
        };

        const isCurrentValid = () => {
          const q = questions[session.idx];
          const a = session.answers[q.id];

          if (q.type === "mcq") return Number.isInteger(a);
          if (q.type === "text") return normalizeText(a).length >= 2;
          return false;
        };

        const validateOrShow = () => {
          saveCurrentAnswer();
          if (!isCurrentValid()) {
            err.textContent = "⛔ Responda a pergunta para continuar.";
            return false;
          }
          err.textContent = "";
          return true;
        };

        // Change listeners para salvar
        container.addEventListener("change", () => saveCurrentAnswer());
        container.addEventListener("input", () => saveCurrentAnswer());

        if (btnPrev) {
          btnPrev.onclick = () => {
            saveCurrentAnswer();
            if (!allowBackQuestions) return;
            session.idx = clamp(session.idx - 1, 0, questions.length - 1);
            renderWizard();
          };
        }

        if (btnNext) {
          btnNext.onclick = () => {
            if (!validateOrShow()) return;
            session.idx = clamp(session.idx + 1, 0, questions.length - 1);
            renderWizard();
          };
        }

        if (btnFinish) {
          btnFinish.onclick = () => {
            // valida a atual antes de finalizar
            if (!validateOrShow()) return;

            // valida todas as respostas (sem permitir buraco)
            for (const q of questions) {
              const a = session.answers[q.id];
              const ok = (q.type === "mcq")
                ? Number.isInteger(a)
                : normalizeText(a).length >= 2;

              if (!ok) {
                err.textContent = "⛔ Existem perguntas sem resposta. Complete todas antes de finalizar.";
                return;
              }
            }

            const ok = confirm("Confirma enviar sua prova? Após enviar, você não poderá refazer.");
            if (!ok) return;

            const result = this._grade({ questions, answers: session.answers, minScore });

            localStorage.setItem(KEY_DONE, "1");
            localStorage.setItem(KEY_RESULT, JSON.stringify({
              testId, at: Date.now(),
              totalPoints: result.totalPoints,
              earnedPoints: result.earnedPoints,
              scorePercent: result.scorePercent,
              passed: result.passed,
              breakdown: result.breakdown
            }));

            // limpa sessão (pra não tentar reabrir)
            sessionStorage.removeItem(sessionKey);

            container.innerHTML = this._renderResult({ result, minScore });
          };
        }

        this._lockBackNav();
      };

      renderWizard();
    },

    // -------- Renderers --------
    _renderExamWizard({ testId, questions, minScore, idx, answer, allowBackQuestions }) {
      const totalPts = questions.reduce((s, q) => s + (q.points || 1), 0);
      const q = questions[idx];
      const n = idx + 1;
      const pts = q.points || 1;

      const header = this._card(`
        <h2 style="margin:0;">Prova • ${esc(testId.toUpperCase())}</h2>
        <p class="n1meta">Total: <strong>${totalPts}</strong> ponto(s) • Nota mínima: <strong>${minScore}%</strong> • <strong>1 tentativa</strong></p>
        <p class="n1warn">⚠️ Não use o botão voltar do navegador.</p>
      `);

      const progress = `
        <div class="n1q-top">
          <div class="n1progress">Pergunta <strong>${n}</strong> de <strong>${questions.length}</strong></div>
          <div class="n1q-pts">${pts} ponto(s)</div>
        </div>
      `;

      const name = `${testId}__${q.id}`;

      let body = "";
      if (q.type === "mcq") {
        const opts = (q.options || []).map((opt, i) => {
          const id = `${name}__${i}`;
          const checked = (Number.isInteger(answer) && answer === i) ? "checked" : "";
          return `
            <label class="n1opt" for="${id}">
              <input type="radio" name="${name}" id="${id}" value="${i}" ${checked} />
              <span>${esc(opt)}</span>
            </label>
          `;
        }).join("");
        body = `<div>${opts}</div>`;
      } else if (q.type === "text") {
        const ph = q.placeholder || "Digite sua resposta...";
        body = `
          <textarea name="${name}" rows="5" class="n1txt" placeholder="${esc(ph)}">${esc(answer || "")}</textarea>
          <p class="n1hint">Responda com objetividade. A correção é automática por critérios definidos.</p>
        `;
      } else {
        body = `<p>Tipo não suportado: <code>${esc(q.type)}</code></p>`;
      }

      const isLast = idx === questions.length - 1;
      const showPrev = allowBackQuestions && idx > 0;

      const actions = `
        <div class="n1actions">
          ${showPrev ? `<button type="button" class="btn" data-act="prev">Voltar</button>` : ""}
          ${!isLast ? `<button type="button" class="btn btn-primary" data-act="next">Próxima</button>` : ""}
          ${isLast ? `<button type="button" class="btn btn-primary" data-act="finish">Finalizar e ver nota</button>` : ""}
        </div>
        <div id="n1Err" class="n1err"></div>
      `;

      return `
        ${header}
        <section class="card n1card" style="margin-top:14px;">
          ${progress}
          <h3 class="n1q-title">${esc(q.prompt)}</h3>
          ${body}
          ${actions}
        </section>
      `;
    },

    _renderExamScroll({ testId, questions, minScore }) {
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
                <span>${esc(opt)}</span>
              </label>
            `;
          }).join("");

          return `
            <section class="card n1card" style="margin-top:14px;">
              <div class="n1q-top">
                <div class="n1progress">Pergunta <strong>${n}</strong></div>
                <div class="n1q-pts">${pts} ponto(s)</div>
              </div>
              <h3 class="n1q-title">${esc(q.prompt)}</h3>
              ${opts}
            </section>
          `;
        }

        if (q.type === "text") {
          const name = `${testId}__${q.id}`;
          const ph = q.placeholder || "Digite sua resposta...";
          return `
            <section class="card n1card" style="margin-top:14px;">
              <div class="n1q-top">
                <div class="n1progress">Pergunta <strong>${n}</strong></div>
                <div class="n1q-pts">${pts} ponto(s)</div>
              </div>
              <h3 class="n1q-title">${esc(q.prompt)}</h3>
              <textarea name="${name}" rows="4" class="n1txt" placeholder="${esc(ph)}" required></textarea>
              <p class="n1hint">Responda com objetividade. A correção é automática por critérios definidos.</p>
            </section>
          `;
        }

        return `
          <section class="card n1card" style="margin-top:14px;">
            <p>Tipo não suportado: <code>${esc(q.type)}</code></p>
          </section>
        `;
      }).join("");

      return `
        <section class="card n1card">
          <h2 style="margin:0;">Prova • ${esc(testId.toUpperCase())}</h2>
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
        <p style="font-weight:800; font-size:1.12rem;">
          ${passed ? "✅ APROVADO" : "⛔ REPROVADO"}
        </p>
        <p style="opacity:.85;">Nota mínima: <strong>${minScore}%</strong></p>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,.10);margin:14px 0;">
        <p style="opacity:.85;margin:0;">Prova finalizada. Não há nova tentativa.</p>
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

    _card(inner) {
      return `<section class="card" style="margin-top:14px;">${inner}</section>`;
    },

    // -------- Coleta + Correção --------
    _collectAnswersScroll({ testId, questions, form }) {
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

        if (q.type === "mcq") ok = (answers[q.id] === q.correctIndex);
        if (q.type === "text") ok = this._gradeText(q, answers[q.id]);

        if (ok) earnedPoints += pts;

        breakdown.push({ id: q.id, type: q.type, points: pts, correct: ok });
      }

      const scorePercent = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePercent >= minScore;

      return { totalPoints, earnedPoints, scorePercent, passed, breakdown };
    },

    _gradeText(q, userAnswerRaw) {
      const user = normalizeText(userAnswerRaw);

      // Resposta exata (se você quiser usar)
      if (q.correctText) {
        const correct = normalizeText(q.correctText);
        return user === correct;
      }

      // Rubrica por palavras-chave
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
    },

    _lockBackNav() {
      try {
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", () => history.pushState(null, "", location.href));
      } catch (e) {}
    }
  };

  window.N1TestsEngine = N1TestsEngine;
})();
