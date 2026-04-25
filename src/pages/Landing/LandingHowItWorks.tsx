// src/pages/Landing/LandingHowItWorks.tsx

import { COLORS, FONTS, HOW_SECTION, HOW_STEPS } from "./landing.config";

export default function LandingHowItWorks() {
  return (
    <section className="steps-section" style={{ background: COLORS.bgSection, borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, padding: "4rem 2.5rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <p className="section-label">{HOW_SECTION.label}</p>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-.02em", marginBottom: "2rem" }}>{HOW_SECTION.title}</h2>
        <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: ".75rem" }}>
          {HOW_STEPS.map(s => (
            <div key={s.n} className="step">
              <div className="num" style={{ fontFamily: FONTS.display, fontSize: "2rem", fontWeight: 800, color: "rgba(255,58,58,0.2)", lineHeight: 1, marginBottom: "1rem" }}>{s.n}</div>
              <div style={{ fontFamily: FONTS.display, fontSize: ".95rem", fontWeight: 700, color: COLORS.textPrimary, marginBottom: ".5rem" }}>{s.title}</div>
              <p style={{ fontSize: ".78rem", color: COLORS.textFaint, lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
