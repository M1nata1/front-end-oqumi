// src/pages/Landing/LandingNav.tsx

import { BRAND, COLORS, FONTS, NAV_LINKS, NAV_BTN_LABEL } from "./landing.config";

type Props = {
  scrolled:  boolean;
  isAuth:    boolean;
  onAction:  (action: string) => void;
  onCTA:     () => void;
};

export default function LandingNav({ scrolled, isAuth, onAction, onCTA }: Props) {
  return (
    <nav className="landing-nav" style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: ".85rem 2.5rem",
      background: scrolled ? `${COLORS.bgPage}EC` : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? `1px solid ${COLORS.border}` : "none",
      transition: "all .25s",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div
        className="logo-link"
        onClick={() => { if (window.scrollY > 8) window.scrollTo({ top: 0, behavior: "smooth" }); }}
        title="В начало"
      >
        {BRAND.name}<span style={{ color: COLORS.accent }}>{BRAND.accent}</span>
      </div>
      <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        <div className="landing-nav-links" style={{ display: "contents" }}>
          {NAV_LINKS.map(l => (
            <span key={l.label} className="nav-link" onClick={() => onAction(l.action)}>
              {l.label}
            </span>
          ))}
        </div>
        <button
          className="btn-red"
          style={{ padding: ".45rem 1.2rem", fontSize: ".8rem", fontFamily: FONTS.body }}
          onClick={onCTA}
        >
          {isAuth ? "Личный кабинет" : NAV_BTN_LABEL}
        </button>
      </div>
    </nav>
  );
}
