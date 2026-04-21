// src/pages/Exam/ExamPage.tsx
// Хаб раздела "Экзамен"
// Route: /exam (protected)

import { useNavigate } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

const CARDS = [
  {
    key:   "trial",
    href:  "/exam/trial",
    label: "Пробный КТ",
    title: "Полноформатный экзамен",
    desc:  "80 вопросов · ТГО + Английский · 2 ч 5 мин. Точный формат реального КТ с таймером.",
    cta:   "Начать →",
    accent: true,
  },
  {
    key:   "quizzes",
    href:  "/courses",
    label: "Квизы",
    title: "Тесты по темам",
    desc:  "Короткие проверочные тесты по каждому уроку. Переходи в курсы чтобы их найти.",
    cta:   "К курсам →",
    accent: false,
  },
];

export default function ExamPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{font-size:.82rem;font-weight:600;color:${COLORS.textMuted};cursor:pointer;transition:color .18s}
        .nav-link:hover{color:${COLORS.accent}}
        .exam-card{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:16px;
          padding:2rem;cursor:pointer;transition:all .22s;
        }
        .exam-card:hover{border-color:${COLORS.borderHover};transform:translateY(-3px);background:#161620}
        .btn-red{background:${COLORS.accent};color:#fff;border:none;padding:.65rem 1.5rem;border-radius:8px;font-family:${FONTS.body};font-weight:700;font-size:.85rem;cursor:pointer;transition:all .18s;display:inline-block}
        .btn-red:hover{background:${COLORS.accentHover};transform:translateY(-1px)}
        .btn-ghost{background:transparent;color:${COLORS.textMuted};border:1px solid rgba(255,255,255,.1);padding:.65rem 1.5rem;border-radius:8px;font-family:${FONTS.body};font-weight:600;font-size:.85rem;cursor:pointer;transition:all .18s;display:inline-block}
        .btn-ghost:hover{border-color:${COLORS.accent};color:${COLORS.accent}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp .5s ease both .05s}
        .fu2{animation:fadeUp .5s ease both .18s}
        .fu3{animation:fadeUp .5s ease both .32s}
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Header */}
        <div className="fu1">
          <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
            Экзамен
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.7rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".5rem" }}>
            Подготовка к КТ
          </h1>
          <p style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
            Пробный экзамен в реальном формате и тематические квизы по урокам
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "3rem" }}>
          {CARDS.map((card, i) => (
            <div
              key={card.key}
              className="exam-card"
              style={{ animationName: "fadeUp", animationDuration: ".5s", animationFillMode: "both", animationDelay: `${0.18 + i * 0.14}s` }}
              onClick={() => navigate(card.href)}
            >
              <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".75rem" }}>
                {card.label}
              </p>
              <h2 style={{ fontFamily: FONTS.display, fontSize: "1.2rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: ".6rem" }}>
                {card.title}
              </h2>
              <p style={{ fontSize: ".82rem", color: COLORS.textFaint, lineHeight: 1.65, marginBottom: "1.5rem" }}>
                {card.desc}
              </p>
              <span className={card.accent ? "btn-red" : "btn-ghost"}>
                {card.cta}
              </span>
            </div>
          ))}
        </div>

        {/* Stats hint */}
        <div className="fu3" style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "12px",
          padding: "1.1rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <p style={{ fontSize: ".82rem", color: COLORS.textMuted }}>
            Твоя статистика и история пройденных квизов — в профиле
          </p>
          <button
            onClick={() => navigate("/profile")}
            style={{ background: "transparent", color: COLORS.accent, border: `1px solid rgba(255,58,58,.25)`, borderRadius: "7px", padding: ".4rem 1rem", fontFamily: FONTS.body, fontWeight: 700, fontSize: ".8rem", cursor: "pointer" }}
          >
            Профиль →
          </button>
        </div>

      </main>
    </div>
  );
}
