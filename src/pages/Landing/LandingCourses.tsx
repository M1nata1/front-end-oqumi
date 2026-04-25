// src/pages/Landing/LandingCourses.tsx

import { COLORS, FONTS, COURSES_SECTION, SUBJECTS } from "./landing.config";

type Props = {
  onCTA: () => void;
};

export default function LandingCourses({ onCTA }: Props) {
  return (
    <section
      id="courses"
      className="courses-section"
      style={{ maxWidth: "1280px", margin: "0 auto", padding: "4rem 2.5rem", scrollMarginTop: "80px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="section-label">{COURSES_SECTION.label}</p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1.6rem", fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-.02em" }}>{COURSES_SECTION.title}</h2>
        </div>
        {COURSES_SECTION.description && (
          <p style={{ fontSize: ".82rem", color: COLORS.textFaint, maxWidth: "280px", lineHeight: 1.65 }}>{COURSES_SECTION.description}</p>
        )}
      </div>
      <div className="courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".6rem" }}>
        {SUBJECTS.map(s => (
          <div key={s.name} className="chip" onClick={onCTA}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: ".85rem" }}>{s.name}</span>
            <span className="num" style={{ marginLeft: "auto", fontSize: ".72rem", color: COLORS.textFaint }}>{s.topics} тем</span>
          </div>
        ))}
      </div>
    </section>
  );
}
