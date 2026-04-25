// src/pages/Landing/LandingHero.tsx

import { COLORS, FONTS, HERO, HERO_STATS, EXAM_DEMO, formatHMS } from "./landing.config";

type Props = {
  left:      number;
  onCTA:     () => void;
  onCourses: () => void;
};

export default function LandingHero({ left, onCTA, onCourses }: Props) {
  const pct = Math.round((EXAM_DEMO.progressCurrent / EXAM_DEMO.progressTotal) * 100);

  return (
    <section className="hero-grid" style={{
      padding: "5.5rem 2.5rem 3rem", maxWidth: "1280px", margin: "0 auto",
      display: "grid", gridTemplateColumns: "1fr minmax(0,420px)", gap: "4rem",
      alignItems: "center", minHeight: "88vh",
    }}>
      {/* Left — текст */}
      <div>
        <p className="f1 section-label">{HERO.label}</p>
        <h1 className="f2" style={{ fontFamily: FONTS.display, fontSize: "clamp(2.2rem,4vw,3.4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: "1.2rem" }}>
          {HERO.titleLine1}<br />
          <span style={{ color: COLORS.accent }}>{HERO.titleLine2}</span><br />
          {HERO.titleLine3}
        </h1>
        <p className="f3" style={{ fontSize: ".95rem", color: COLORS.textMuted, lineHeight: 1.8, marginBottom: "2rem", maxWidth: "400px" }}>
          {HERO.description}
        </p>
        <div className="f4" style={{ display: "flex", gap: ".75rem" }}>
          <button className="btn-red" onClick={onCTA}>{HERO.btnPrimary}</button>
          <button className="btn-ghost" onClick={onCourses}>{HERO.btnSecondary}</button>
        </div>
        <div className="f4" style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", paddingTop: "2rem", borderTop: `1px solid ${COLORS.border}` }}>
          {HERO_STATS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
              {i > 0 && <div style={{ width: "1px", height: "30px", background: COLORS.border, marginRight: "-1rem" }} />}
              <div>
                <div className="num" style={{ fontFamily: FONTS.display, fontSize: "1.5rem", fontWeight: 800, color: COLORS.textPrimary }}>{s.value}</div>
                <div style={{ fontSize: ".72rem", fontWeight: 600, color: COLORS.textFaint, marginTop: ".2rem", letterSpacing: ".04em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — демо-карточка экзамена */}
      <div className="bob hero-demo">
        <div style={{ background: COLORS.bgCard, border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "1.4rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", background: "rgba(255,58,58,0.07)", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
          <p className="section-label">{EXAM_DEMO.label}</p>
          <div style={{ background: COLORS.bgPage, borderRadius: "10px", padding: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: ".65rem", color: COLORS.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".3rem" }}>{EXAM_DEMO.timerLabel}</div>
              <div className="num" style={{ fontFamily: FONTS.display, fontSize: "1.9rem", fontWeight: 800, color: COLORS.accent }}>{formatHMS(left)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: ".65rem", color: COLORS.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".3rem" }}>{EXAM_DEMO.progressLabel}</div>
              <div className="num" style={{ fontFamily: FONTS.display, fontSize: "1.2rem", fontWeight: 800, color: COLORS.textPrimary }}>
                {EXAM_DEMO.progressCurrent} <span style={{ fontSize: ".8rem", color: COLORS.textFaint, fontWeight: 400 }}>/ {EXAM_DEMO.progressTotal}</span>
              </div>
            </div>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginBottom: "1rem", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: COLORS.accent, borderRadius: "2px" }} />
          </div>
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem" }}>
            <div className="num" style={{ fontSize: ".68rem", color: COLORS.accent, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: ".6rem" }}>
              Вопрос {EXAM_DEMO.questionNum}
            </div>
            <p style={{ fontSize: ".8rem", color: "#B0B0CC", lineHeight: 1.6, marginBottom: ".8rem" }}>{EXAM_DEMO.questionText}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".4rem" }}>
              {EXAM_DEMO.options.map(o => (
                <div key={o.label} style={{ background: o.correct ? "rgba(255,58,58,0.1)" : COLORS.bgPage, border: `1px solid ${o.correct ? "rgba(255,58,58,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: ".45rem .7rem", fontSize: ".73rem", color: o.correct ? "#FF6B6B" : COLORS.textMuted, fontWeight: o.correct ? 700 : 400 }}>
                  {o.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
