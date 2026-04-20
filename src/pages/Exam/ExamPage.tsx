// src/pages/Exam/ExamPage.tsx
// Хаб раздела "Экзамен" — статистика и история квизов студента
// Route: /exam (protected)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { API_BASE } from "@/api/auth";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

interface UserStats {
  total_score: number;
  total_quizzes_passed: number;
}

interface QuizSummary {
  id: number;
  title: string;
  description: string;
  is_free: boolean;
  questions: { id: number }[];
}

function pluralQuestions(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "вопрос";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "вопроса";
  return "вопросов";
}

export default function ExamPage() {
  const navigate     = useNavigate();
  const accessToken  = useAuthStore(s => s.accessToken);

  const [stats,   setStats]   = useState<UserStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${accessToken}` };

    const s = fetch(`${API_BASE}/statistics/me/`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d as UserStats); })
      .catch(() => {});

    const q = fetch(`${API_BASE}/statistics/my-quizzes/`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(d => setQuizzes(Array.isArray(d) ? (d as QuizSummary[]) : []))
      .catch(() => setQuizzes([]));

    Promise.all([s, q]).finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{font-size:.82rem;font-weight:600;color:${COLORS.textMuted};cursor:pointer;transition:color .18s}
        .nav-link:hover{color:${COLORS.accent}}
        .quiz-row{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:12px;
          padding:1.1rem 1.25rem;cursor:pointer;transition:all .18s;
          display:flex;align-items:center;justify-content:space-between;gap:1rem;
        }
        .quiz-row:hover{border-color:${COLORS.borderHover};transform:translateY(-1px);background:${COLORS.bgCardHover}}
        .quiz-row .arrow{color:${COLORS.textFaint};transition:transform .15s,color .15s;flex-shrink:0}
        .quiz-row:hover .arrow{transform:translateX(3px);color:${COLORS.accent}}
        .stat-card{background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:14px;padding:1.5rem}
        .btn-red{background:${COLORS.accent};color:#fff;border:none;padding:.6rem 1.5rem;border-radius:8px;font-family:${FONTS.body};font-weight:700;font-size:.85rem;cursor:pointer;transition:all .18s}
        .btn-red:hover{background:${COLORS.accentHover};transform:translateY(-1px)}
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Header */}
        <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
          Экзамен
        </p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".4rem" }}>
          Мои квизы
        </h1>
        <p style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
          История пройденных тестов и статистика
        </p>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
            <div className="stat-card">
              <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".6rem" }}>
                Всего баллов
              </p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.4rem", fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 }}>
                {stats.total_score}
              </p>
            </div>
            <div className="stat-card">
              <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".6rem" }}>
                Квизов пройдено
              </p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.4rem", fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>
                {stats.total_quizzes_passed}
              </p>
            </div>
          </div>
        )}

        {/* Quiz list */}
        <p style={{ fontSize: ".65rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1rem" }}>
          Пройденные тесты
        </p>

        {loading && (
          <p style={{ color: COLORS.textFaint, fontSize: ".85rem" }}>Загрузка...</p>
        )}

        {!loading && quizzes.length === 0 && (
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "3rem 2rem", textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: ".5rem" }}>
              Ещё нет пройденных квизов
            </p>
            <p style={{ fontSize: ".85rem", color: COLORS.textMuted, marginBottom: "1.75rem" }}>
              Перейди в курсы — там к каждой теме прикреплён тест
            </p>
            <button className="btn-red" onClick={() => navigate("/courses")}>
              К курсам →
            </button>
          </div>
        )}

        {quizzes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: ".65rem", marginBottom: "2.5rem" }}>
            {quizzes.map(quiz => (
              <div key={quiz.id} className="quiz-row" onClick={() => navigate(`/exam/${quiz.id}`)}>
                <div>
                  <p style={{ fontFamily: FONTS.display, fontSize: ".95rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: ".2rem" }}>
                    {quiz.title}
                  </p>
                  {quiz.description && (
                    <p style={{ fontSize: ".78rem", color: COLORS.textMuted, marginBottom: ".3rem" }}>
                      {quiz.description}
                    </p>
                  )}
                  <p style={{ fontSize: ".7rem", color: COLORS.textFaint }}>
                    {quiz.questions.length} {pluralQuestions(quiz.questions.length)}
                    {!quiz.is_free && (
                      <span style={{ marginLeft: ".5rem", color: COLORS.accent }}>• Подписка</span>
                    )}
                  </p>
                </div>
                <span className="arrow">→</span>
              </div>
            ))}
          </div>
        )}

        {/* Trial exam banner */}
        <div style={{
          background: COLORS.accentSoft,
          border: `1px solid ${COLORS.accentBorder}`,
          borderRadius: "14px",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontFamily: FONTS.display, fontSize: ".95rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: ".25rem" }}>
              Пробный КТ
            </p>
            <p style={{ fontSize: ".8rem", color: COLORS.textMuted }}>
              80 вопросов · ТГО + Английский · 2ч 5мин
            </p>
          </div>
          <button className="btn-red" onClick={() => navigate("/exam/trial")}>
            Начать →
          </button>
        </div>

      </main>
    </div>
  );
}
