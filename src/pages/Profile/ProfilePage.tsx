// src/pages/Profile/ProfilePage.tsx
// Профиль студента — статистика с анимированными графиками
// Route: /profile (protected)

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { API_BASE } from "@/api/auth";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { COLORS, FONTS } from "@/pages/Dashboard/dashboard.config";

// ─── Types ────────────────────────────────────────────────────

interface UserStats {
  total_score:          number;
  total_quizzes_passed: number;
  attempts?:            AttemptItem[];
}

interface AttemptItem {
  quiz?:       number | { id: number; title: string };
  quiz_id?:    number;
  quiz_title?: string;
  score?:      number;
  is_correct?: boolean;
}


// ─── Animated counter hook ────────────────────────────────────

function useCounter(target: number, delay = 0): number {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!target || started.current) return;
    const timer = setTimeout(() => {
      started.current = true;
      const duration = 1400;
      const start    = Date.now();
      const tick = () => {
        const t = Math.min((Date.now() - start) / duration, 1);
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setVal(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  return val;
}

// ─── Ring chart ───────────────────────────────────────────────

function RingChart({
  value, max, label, color = COLORS.accent, size = 140, delay = 0,
}: {
  value: number; max: number; label: string; color?: string; size?: number; delay?: number;
}) {
  const r   = 44;
  const circ = 2 * Math.PI * r;
  const frac = max > 0 ? Math.min(value / max, 1) : 0;
  const [offset, setOffset] = useState(circ);
  const animated = useCounter(value, delay);

  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => {
      setOffset(circ * (1 - frac));
    }, delay + 80);
    return () => clearTimeout(timer);
  }, [value, frac, circ, delay]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".75rem" }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
        <text x="50" y="46" textAnchor="middle" fill={COLORS.textPrimary}
          style={{ fontSize: "18px", fontWeight: 800, fontFamily: "Syne, sans-serif" }}>
          {animated}
        </text>
        <text x="50" y="60" textAnchor="middle" fill={COLORS.textFaint}
          style={{ fontSize: "8px", fontFamily: "Nunito, sans-serif", fontWeight: 600 }}>
          из {max}
        </text>
      </svg>
      <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.textFaint, textAlign: "center" }}>
        {label}
      </p>
    </div>
  );
}

// ─── Horizontal bar ───────────────────────────────────────────

function HBar({
  label, value, max, score, color = COLORS.accent, delay = 0,
}: {
  label: string; value: number; max: number; score?: number; color?: string; delay?: number;
}) {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay + 60);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div style={{ marginBottom: ".85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".35rem" }}>
        <span style={{ fontSize: ".8rem", color: COLORS.textBody, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: ".5rem" }}>
          {label}
        </span>
        <span style={{ fontSize: ".75rem", color: color, fontWeight: 700, flexShrink: 0 }}>
          {score !== undefined ? `${score} балл${score === 1 ? "" : score < 5 ? "а" : "ов"}` : `${value} вопр.`}
        </span>
      </div>
      <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: "99px",
          transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }} />
      </div>
    </div>
  );
}

// ─── Stat card with counter ───────────────────────────────────

function StatCard({
  label, value, suffix = "", color = COLORS.textPrimary, delay = 0,
}: {
  label: string; value: number; suffix?: string; color?: string; delay?: number;
}) {
  const animated = useCounter(value, delay);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.5rem",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity .5s ease, transform .5s ease",
    }}>
      <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: ".6rem" }}>
        {label}
      </p>
      <p style={{ fontFamily: FONTS.display, fontSize: "2.6rem", fontWeight: 800, color, lineHeight: 1 }}>
        {animated}{suffix}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function ProfilePage() {
  const user        = useAuthStore(s => s.user);
  const accessToken = useAuthStore(s => s.accessToken);

  const [stats,   setStats]   = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = { Authorization: `Bearer ${accessToken}` };
    fetch(`${API_BASE}/statistics/me/`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d as UserStats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const initial      = (user?.name ?? "?")[0].toUpperCase();
  const totalScore   = stats?.total_score ?? 0;
  const totalPassed  = stats?.total_quizzes_passed ?? 0;
  const avgScore     = totalPassed > 0 ? Math.round(totalScore / totalPassed) : 0;

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .nav-link{font-size:.82rem;font-weight:600;color:${COLORS.textMuted};cursor:pointer;transition:color .18s}
        .nav-link:hover{color:${COLORS.accent}}
        .quiz-row{
          background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:10px;
          padding:.9rem 1.1rem;cursor:pointer;transition:all .18s;
          display:flex;align-items:center;justify-content:space-between;gap:1rem;
        }
        .quiz-row:hover{border-color:${COLORS.borderHover};transform:translateY(-1px);background:#161620}
        .quiz-row .arr{color:${COLORS.textFaint};transition:transform .14s,color .14s}
        .quiz-row:hover .arr{transform:translateX(3px);color:${COLORS.accent}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .fade-up-1{animation:fadeUp .55s ease both .05s}
        .fade-up-2{animation:fadeUp .55s ease both .18s}
        .fade-up-3{animation:fadeUp .55s ease both .32s}
        .fade-up-4{animation:fadeUp .55s ease both .46s}
        .fade-up-5{animation:fadeUp .55s ease both .60s}

        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .skeleton{
          background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
          background-size:800px 100%;
          animation:shimmer 1.4s infinite;
          border-radius:8px;
        }
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* ── Avatar + name ── */}
        <div className="fade-up-1" style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "3rem" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.accent}, #FF6B6B)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", fontWeight: 800, color: "#fff",
            fontFamily: FONTS.display, flexShrink: 0,
            boxShadow: `0 0 0 3px rgba(255,58,58,0.18)`,
          }}>
            {initial}
          </div>
          <div>
            <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".25rem" }}>
              Профиль
            </p>
            <h1 style={{ fontFamily: FONTS.display, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, lineHeight: 1.1 }}>
              {user?.name ?? "Студент"}
            </h1>
            {(user as { email?: string })?.email && (
              <p style={{ fontSize: ".82rem", color: COLORS.textMuted, marginTop: ".2rem" }}>
                {(user as { email?: string }).email}
              </p>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
            {[0,1,2].map(i => (
              <div key={i} className="skeleton" style={{ height: "110px", borderRadius: "14px" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "2.5rem" }}>
            <StatCard label="Всего баллов"     value={totalScore}  color={COLORS.accent}      delay={0}   />
            <StatCard label="Квизов пройдено"  value={totalPassed} color="#3A8EFF"             delay={120} />
            <StatCard label="Средний балл"     value={avgScore}    color="#3AFFB4"             delay={240} />
          </div>
        )}

        {/* ── Ring charts + bars ── */}
        {!loading && (totalScore > 0 || quizzes.length > 0) && (
          <div className="fade-up-3" style={{
            display: "grid",
            gridTemplateColumns: quizzes.length > 0 ? "auto 1fr" : "1fr",
            gap: "1.5rem",
            marginBottom: "2.5rem",
            alignItems: "start",
          }}>

            {/* Rings */}
            <div style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: "14px", padding: "1.75rem 2rem",
              display: "flex", gap: "2.5rem", alignItems: "center", flexWrap: "wrap",
              justifyContent: "center",
            }}>
              <RingChart
                value={totalPassed}
                max={Math.max(totalPassed + 2, 10)}
                label="Квизов"
                color={COLORS.accent}
                delay={300}
              />
              <RingChart
                value={totalScore}
                max={Math.max(totalScore + totalPassed * 2, totalScore + 5)}
                label="Баллов"
                color="#3A8EFF"
                delay={500}
              />
            </div>

            {/* Bar chart */}
            {quizzes.length > 0 && (
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.5rem" }}>
                <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: COLORS.textFaint, marginBottom: "1.1rem" }}>
                  Активность по квизам
                </p>
                {quizzes.slice(0, 8).map((q, i) => (
                  <HBar
                    key={q.id}
                    label={q.title}
                    value={q.questions.length}
                    max={maxBarQ}
                    color={i % 3 === 0 ? COLORS.accent : i % 3 === 1 ? "#3A8EFF" : "#3AFFB4"}
                    delay={400 + i * 80}
                  />
                ))}
              </div>
            )}
          </div>
        )}


      </main>
    </div>
  );
}
