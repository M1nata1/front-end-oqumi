// src/pages/Landing/LandingExamCta.tsx

import { COLORS, FONTS, EXAM_CTA } from "./landing.config";

type Props = {
  onStart: () => void;
};

export default function LandingExamCta({ onStart }: Props) {
  return (
    <section
      id="exam-cta"
      className="exam-cta-section"
      style={{ maxWidth: "1080px", margin: "0 auto", padding: "5rem 2.5rem", scrollMarginTop: "80px" }}
    >
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "2.5rem 3rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
        <div style={{ maxWidth: "460px" }}>
          <p className="section-label">{EXAM_CTA.label}</p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1.55rem", fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-.02em", marginBottom: ".75rem" }}>{EXAM_CTA.title}</h2>
          <p style={{ color: COLORS.textFaint, lineHeight: 1.7, fontSize: ".82rem" }}>{EXAM_CTA.description}</p>
        </div>
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: "1.25rem" }}>
            {EXAM_CTA.features.map(f => <span key={f} className="feat-tag">{f}</span>)}
          </div>
          {/* Публичная кнопка — авторизация не нужна */}
          <button className="btn-red" onClick={onStart}>{EXAM_CTA.btnLabel}</button>
        </div>
      </div>
    </section>
  );
}
