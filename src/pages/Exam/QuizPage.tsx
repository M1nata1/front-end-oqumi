// src/pages/Exam/QuizPage.tsx
// Страница прохождения квиза студентом
// Route: /exam/:quizId (protected)

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE, mediaUrl } from "@/api/auth";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";
import { TipTapContent } from "@/components/TipTapRenderer";

// ─── API types ───────────────────────────────────────────────

interface QuizOption {
  id:   number;
  text: string;
}

interface QuizQuestion {
  id:      number;
  type:    "single" | "multiple" | "ordering";
  content: unknown;
  image:   string | null;
  options: (QuizOption | string)[];
  score:   number;
}

interface QuizDetail {
  id:          number;
  title:       string;
  description: string;
  is_free:     boolean;
  image:       string | null;
  questions:   QuizQuestion[];
}


function optText(opt: QuizOption | string, idx: number): { id: number; text: string } {
  if (typeof opt === "string") return { id: idx, text: opt };
  return { id: opt.id ?? idx, text: opt.text };
}

interface CheckResult {
  question_id:    number;
  is_correct:     boolean;
  correct_answer: number[];
  score:          number;
  explanation:    string | null;
}

type Phase = "loading" | "error" | "intro" | "exam" | "checking" | "result";

// ─── Helpers ─────────────────────────────────────────────────

const EXTRA_COLORS = {
  correct:       "rgba(58,255,148,0.08)",
  correctBorder: "rgba(58,255,148,0.35)",
  correctText:   "#3AFFB4",
  wrong:         "rgba(255,58,58,0.08)",
  wrongBorder:   "rgba(255,58,58,0.35)",
};

function pluralQuestions(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "вопрос";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "вопроса";
  return "вопросов";
}

// ─── Component ───────────────────────────────────────────────

export default function QuizPage() {
  const { quizId }  = useParams<{ quizId: string }>();
  const navigate    = useNavigate();
  const accessToken = useAuthStore(s => s.accessToken);

  const [phase,      setPhase]      = useState<Phase>("loading");
  const [quiz,       setQuiz]       = useState<QuizDetail | null>(null);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState<Map<number, number[]>>(new Map());
  const [results,    setResults]    = useState<CheckResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore,   setMaxScore]   = useState(0);

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const loadQuiz = useCallback(() => {
    setPhase("loading");
    fetch(`${API_BASE}/quizzes/${quizId}/`, { headers: authHeaders })
      .then(r => {
        if (r.status === 401) { navigate("/auth"); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (!data) { setPhase("error"); return; }
        const raw = (data?.quiz ?? data) as QuizDetail;
        if (!raw?.questions) { setPhase("error"); return; }
        setQuiz(raw);
        setAnswers(new Map());
        setCurrent(0);
        setResults([]);
        setTotalScore(0);
        setPhase("intro");
      })
      .catch(() => setPhase("error"));
  }, [quizId, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const toggleOption = (qIdx: number, optId: number, type: QuizQuestion["type"]) => {
    setAnswers(prev => {
      const next = new Map(prev);
      const cur  = next.get(qIdx) ?? [];
      if (type === "single") {
        next.set(qIdx, cur.includes(optId) ? [] : [optId]);
      } else {
        next.set(qIdx, cur.includes(optId)
          ? cur.filter(id => id !== optId)
          : [...cur, optId],
        );
      }
      return next;
    });
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setPhase("checking");

    const payload = quiz.questions.map((q, i) => ({
      question_id: q.id,
      selected:    answers.get(i) ?? [],
    }));

    try {
      const res = await fetch(`${API_BASE}/quizzes/${quizId}/check/`, {
        method:  "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body:    JSON.stringify({ answers: payload }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as CheckResult[];
      const scored = data.reduce((s, r) => s + (r.is_correct ? r.score : 0), 0);
      const max    = quiz.questions.reduce((s, q) => s + q.score, 0);
      setResults(data);
      setTotalScore(scored);
      setMaxScore(max);
      setPhase("result");
    } catch {
      setPhase("exam");
    }
  };

  const retryQuiz = async () => {
    try {
      await fetch(`${API_BASE}/quizzes/${quizId}/attempt/`, {
        method:  "DELETE",
        headers: authHeaders,
      });
    } catch { /* ignore */ }
    loadQuiz();
  };

  // ── Shared layout wrapper ────────────────────────────────
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}

        .opt{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:10px;
          padding:.85rem 1rem;cursor:pointer;transition:all .18s;
          display:flex;align-items:flex-start;gap:.75rem;
          font-size:.88rem;line-height:1.55;text-align:left;
          color:${COLORS.textBody};width:100%;
        }
        .opt:hover:not(.chosen){border-color:rgba(255,58,58,.28);background:rgba(255,58,58,0.04)}
        .opt.chosen{border-color:${COLORS.accent};background:${COLORS.accentSoft}}
        .opt.correct{border-color:${EXTRA_COLORS.correctBorder}!important;background:${EXTRA_COLORS.correct}!important;color:${EXTRA_COLORS.correctText}!important}
        .opt.wrong{border-color:${EXTRA_COLORS.wrongBorder}!important;background:${EXTRA_COLORS.wrong}!important;color:#FF6B6B!important}
        .opt.result-neutral{cursor:default;pointer-events:none}

        .q-cell{
          width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;
          font-size:.7rem;font-weight:700;cursor:pointer;
          border:1.5px solid rgba(255,255,255,0.06);color:${COLORS.textFaint};background:transparent;
          transition:all .14s;font-family:${FONTS.body};
        }
        .q-cell:hover:not(.qc-current){border-color:rgba(255,58,58,.3);color:${COLORS.textMuted}}
        .q-cell.qc-answered{background:rgba(58,142,255,0.12);border-color:rgba(58,142,255,0.32);color:#7BB8FF}
        .q-cell.qc-current{border-color:${COLORS.accent}!important;color:${COLORS.textPrimary}!important;background:${COLORS.accentSoft}!important}

        .btn-red{background:${COLORS.accent};color:#fff;border:none;padding:.65rem 1.5rem;border-radius:8px;font-family:${FONTS.body};font-weight:700;font-size:.85rem;cursor:pointer;transition:all .18s}
        .btn-red:hover{background:${COLORS.accentHover};transform:translateY(-1px)}
        .btn-ghost{background:transparent;color:${COLORS.textMuted};border:1px solid rgba(255,255,255,.1);padding:.65rem 1.5rem;border-radius:8px;font-family:${FONTS.body};font-weight:600;font-size:.85rem;cursor:pointer;transition:all .18s}
        .btn-ghost:hover{border-color:${COLORS.accent};color:${COLORS.accent}}
        .btn-ghost:disabled{opacity:.3;pointer-events:none}
      `}</style>
      <DashboardNav />
      {children}
    </div>
  );

  // ── Loading ──────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "7rem 2rem", color: COLORS.textFaint, fontSize: ".9rem" }}>
          Загрузка квиза...
        </div>
      </Shell>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (phase === "error" || !quiz) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "7rem 2rem" }}>
          <p style={{ fontSize: ".95rem", color: COLORS.textMuted, marginBottom: "1.5rem" }}>
            Квиз не найден или требует подписку
          </p>
          <button className="btn-ghost" onClick={() => navigate("/exam")}>← К экзаменам</button>
        </div>
      </Shell>
    );
  }

  const q         = quiz.questions?.[current];
  const chosenIds = answers.get(current) ?? [];
  const answered  = Array.from(answers.values()).filter(a => a.length > 0).length;
  const qOptions  = (q?.options ?? []).map((o, i) => optText(o, i));

  // ── Intro ────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <Shell>
        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "5.5rem 2rem", textAlign: "center" }}>
          <p className="fade-up-1" style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".75rem" }}>
            Квиз
          </p>
          {quiz.image && (
            <img
              src={mediaUrl(quiz.image) ?? ""}
              alt=""
              className="fade-up-2"
              style={{ width: "72px", height: "72px", borderRadius: "16px", objectFit: "cover", marginBottom: "1.25rem" }}
            />
          )}
          <h1 className="fade-up-2" style={{ fontFamily: FONTS.display, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".75rem" }}>
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="fade-up-3" style={{ fontSize: ".9rem", color: COLORS.textMuted, lineHeight: 1.65, marginBottom: "1.5rem" }}>
              {quiz.description}
            </p>
          )}
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2.75rem" }}>
            <span style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: ".4rem .9rem", fontSize: ".78rem", color: COLORS.textMuted }}>
              {quiz.questions.length} {pluralQuestions(quiz.questions.length)}
            </span>
            <span style={{
              background: COLORS.bgCard,
              border:     `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              padding:    ".4rem .9rem",
              fontSize:   ".78rem",
              color:      quiz.is_free ? EXTRA_COLORS.correctText : COLORS.accent,
            }}>
              {quiz.is_free ? "Бесплатный" : "Требует подписку"}
            </span>
          </div>
          <button className="btn-red" style={{ padding: ".8rem 2.75rem", fontSize: ".9rem" }} onClick={() => setPhase("exam")}>
            Начать →
          </button>
        </main>
      </Shell>
    );
  }

  // ── Checking ─────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "7rem 2rem", color: COLORS.textFaint, fontSize: ".9rem" }}>
          Проверяем ответы...
        </div>
      </Shell>
    );
  }

  // ── Result ───────────────────────────────────────────────
  if (phase === "result") {
    const correctCount = results.filter(r => r.is_correct).length;
    return (
      <Shell>
        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "3.5rem 2rem" }}>

          <p className="fade-up-1" style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
            Результат
          </p>
          <h1 className="fade-up-2" style={{ fontFamily: FONTS.display, fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: "1.75rem" }}>
            {quiz.title}
          </h1>

          {/* Score banner */}
          <div className="fade-up-3" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.75rem 2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>Баллы</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.6rem", fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>
                {totalScore}
                <span style={{ fontSize: "1.1rem", color: COLORS.textFaint, marginLeft: ".35rem" }}>/ {maxScore}</span>
              </p>
            </div>
            <div>
              <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".4rem" }}>Верных ответов</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.6rem", fontWeight: 800, color: EXTRA_COLORS.correctText, lineHeight: 1 }}>
                {correctCount}
                <span style={{ fontSize: "1.1rem", color: COLORS.textFaint, marginLeft: ".35rem" }}>/ {quiz.questions.length}</span>
              </p>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
            {quiz.questions.map((question, i) => {
              const res       = results.find(r => r.question_id === question.id);
              const chosen    = answers.get(i) ?? [];

              return (
                <div key={question.id} style={{
                  background:   COLORS.bgCard,
                  border:       `1px solid ${res?.is_correct ? EXTRA_COLORS.correctBorder : EXTRA_COLORS.wrongBorder}`,
                  borderRadius: "12px",
                  padding:      "1.25rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", marginBottom: ".6rem" }}>
                    <p style={{ fontSize: ".72rem", fontWeight: 700, color: COLORS.textFaint }}>Вопрос {i + 1}</p>
                    <span style={{ fontSize: ".72rem", fontWeight: 700, color: res?.is_correct ? EXTRA_COLORS.correctText : "#FF6B6B" }}>
                      {res?.is_correct
                        ? `+${res.score} балл${res.score === 1 ? "" : res.score < 5 ? "а" : "ов"}`
                        : "0 баллов"}
                    </span>
                  </div>

                  {question.image && (
                    <img
                      src={mediaUrl(question.image) ?? ""}
                      alt=""
                      style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "6px", marginBottom: ".75rem" }}
                    />
                  )}
                  <div style={{ fontSize: ".88rem", color: COLORS.textPrimary, lineHeight: 1.6, marginBottom: ".85rem" }}>
                    <TipTapContent content={question.content} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                    {question.options.map((rawOpt, oi) => {
                      const opt        = optText(rawOpt, oi);
                      const letter     = String.fromCharCode(65 + oi);
                      const wasChosen  = chosen.includes(opt.id);
                      const correctIds = res?.correct_answer;
                      const hasIds     = correctIds && correctIds.length > 0;
                      const isCorrect  = hasIds
                        ? correctIds.includes(opt.id)
                        : (res?.is_correct && wasChosen) ?? false;
                      const cls = isCorrect
                        ? " correct"
                        : wasChosen && !isCorrect
                          ? " wrong"
                          : " result-neutral";

                      return (
                        <div key={opt.id} className={`opt${cls}`}>
                          <span style={{
                            width: "20px", height: "20px", borderRadius: "4px",
                            border: "1.5px solid rgba(255,255,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, fontSize: ".62rem", color: COLORS.textFaint, fontWeight: 700,
                          }}>
                            {letter}
                          </span>
                          {opt.text}
                        </div>
                      );
                    })}
                  </div>

                  {res?.explanation && (
                    <p style={{ fontSize: ".78rem", color: COLORS.textMuted, marginTop: ".85rem", paddingTop: ".85rem", borderTop: `1px solid ${COLORS.border}`, lineHeight: 1.6 }}>
                      💡 {res.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <button className="btn-ghost" onClick={() => navigate("/exam")}>← К экзаменам</button>
            <button className="btn-red" onClick={retryQuiz}>Пройти снова</button>
          </div>
        </main>
      </Shell>
    );
  }

  // ── Exam ─────────────────────────────────────────────────
  return (
    <Shell>
      <div className="quiz-grid" style={{
        maxWidth: "1100px", margin: "0 auto",
        padding: "1.5rem",
        display: "grid", gridTemplateColumns: "1fr 204px",
        gap: "1.25rem", alignItems: "start",
      }}>

        {/* Question card */}
        <div className="fade-up-1" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.75rem" }}>
          <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
            Вопрос {current + 1} / {quiz.questions.length}
          </p>

          {q.image && (
            <img
              src={mediaUrl(q.image) ?? ""}
              alt=""
              style={{ width: "100%", maxHeight: "240px", objectFit: "cover", borderRadius: "8px", marginBottom: "1rem" }}
            />
          )}

          <div style={{ fontSize: "1rem", fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.65, marginBottom: "1.25rem" }}>
            {q && <TipTapContent content={q.content} />}
          </div>

          <p style={{ fontSize: ".7rem", color: COLORS.textFaint, marginBottom: ".85rem" }}>
            {q.type === "single" ? "Один правильный ответ" : "Выберите все верные ответы"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", marginBottom: "1.75rem" }}>
            {qOptions.map((opt, oi) => {
              const letter  = String.fromCharCode(65 + oi);
              const chosen  = chosenIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  className={`opt${chosen ? " chosen" : ""}`}
                  onClick={() => q && toggleOption(current, opt.id, q.type)}
                >
                  <span style={{
                    width: "22px", height: "22px",
                    borderRadius: q.type === "single" ? "50%" : "5px",
                    border:       `2px solid ${chosen ? COLORS.accent : "rgba(255,255,255,0.15)"}`,
                    background:   chosen ? COLORS.accent : "transparent",
                    display:      "flex", alignItems: "center", justifyContent: "center",
                    flexShrink:   0, fontSize: ".65rem",
                    color:        chosen ? "#fff" : COLORS.textFaint,
                    fontWeight:   700, transition: "all .15s",
                  }}>
                    {chosen ? "✓" : letter}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: ".75rem" }}>
            <button className="btn-ghost" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
              ← Назад
            </button>
            {current < quiz.questions.length - 1 ? (
              <button className="btn-red" onClick={() => setCurrent(c => c + 1)}>Далее →</button>
            ) : (
              <button className="btn-red" onClick={submitQuiz}>Завершить →</button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="fade-up-2 quiz-sidebar" style={{
          background: COLORS.bgCard,
          border:     `1px solid ${COLORS.border}`,
          borderRadius: "14px",
          padding:    "1.25rem",
          position:   "sticky",
          top:        "1rem",
        }}>
          <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".75rem" }}>
            {quiz.title}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", marginBottom: "1.1rem" }}>
            {quiz.questions.map((_, i) => {
              const ans = (answers.get(i) ?? []).length > 0;
              return (
                <button
                  key={i}
                  className={`q-cell${i === current ? " qc-current" : ans ? " qc-answered" : ""}`}
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: ".75rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: ".7rem", color: COLORS.textFaint }}>
              Отвечено: {answered} / {quiz.questions.length}
            </p>
          </div>

          <button className="btn-red" style={{ width: "100%", textAlign: "center" }} onClick={submitQuiz}>
            Завершить
          </button>
        </div>

      </div>
    </Shell>
  );
}
