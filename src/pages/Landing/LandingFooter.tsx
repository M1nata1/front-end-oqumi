// src/pages/Landing/LandingFooter.tsx

import { BRAND, COLORS, FOOTER } from "./landing.config";

type Props = {
  onAction: (action: string) => void;
};

export default function LandingFooter({ onAction }: Props) {
  return (
    <footer className="landing-footer" style={{ borderTop: `1px solid ${COLORS.border}`, padding: "1.4rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
      <div
        className="logo-link"
        onClick={() => { if (window.scrollY > 8) window.scrollTo({ top: 0, behavior: "smooth" }); }}
        title="В начало"
      >
        {BRAND.name}<span style={{ color: COLORS.accent }}>{BRAND.accent}</span>
      </div>
      <p style={{ fontSize: ".72rem", color: COLORS.textGhost }}>
        © {BRAND.year} {BRAND.name}{BRAND.accent}. {FOOTER.copyright}
      </p>
      <div style={{ display: "flex", gap: "1.5rem" }}>
        {FOOTER.links.map(l => (
          <span key={l.label} className="footer-link" onClick={() => onAction(l.action)}>
            {l.label}
          </span>
        ))}
      </div>
    </footer>
  );
}
