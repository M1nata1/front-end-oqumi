// src/pages/Courses/CategoryPage.tsx — модули внутри курса (= courses внутри category)

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardNav from "@/pages/Dashboard/DashboardNav";
import { API_BASE, mediaUrl } from "@/api/auth";
import type { ApiCategory, ApiCourse } from "./Courses";

const COLORS = {
  bgPage: "#0D0D11", bgCard: "#13131A", bgCardHover: "#161620",
  border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,58,58,0.3)",
  accent: "#FF3A3A", textPrimary: "#FAFAFF", textBody: "#F0F0FF",
  textMuted: "#8888AA", textFaint: "#44445A",
};
const FONTS = {
  display: "'Syne', sans-serif",
  body: "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Nunito:wght@400;600;700&display=swap",
};

const PALETTE = ["#FF3A3A", "#3A8EFF", "#FF9F3A", "#3AFFB4", "#B43AFF"];
function slugColor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function CategoryPage() {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Используем state если пришли из Courses.tsx, иначе грузим заново
  const stateCategory = (location.state as { category?: ApiCategory } | null)?.category;
  const [category, setCategory] = useState<ApiCategory | null>(stateCategory ?? null);
  const [loading,  setLoading]  = useState(!stateCategory);

  useEffect(() => {
    if (stateCategory) return; // уже есть из state
    fetch(`${API_BASE}/courses/categories/?page_size=100`)
      .then(r => r.ok ? r.json() : { result: [] })
      .then(data => {
        const found = (data.result as ApiCategory[]).find(c => c.code === categoryCode);
        setCategory(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryCode, stateCategory]);

  if (loading) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh" }}>
        <DashboardNav />
        <div style={{ padding: "3rem 2rem", color: COLORS.textFaint, fontSize: ".85rem" }}>Загрузка...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div style={{ background: COLORS.bgPage, minHeight: "100vh" }}>
        <DashboardNav />
        <div style={{ padding: "3rem 2rem", color: "#fff" }}>Курс не найден</div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgPage, color: COLORS.textBody, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <link href={FONTS.googleUrl} rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .module-card{background:${COLORS.bgCard};border:1px solid ${COLORS.border};border-radius:14px;padding:1.25rem 1.5rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:space-between;gap:1rem}
        .module-card:hover{border-color:${COLORS.borderHover};transform:translateY(-2px);background:${COLORS.bgCardHover}}
        .module-arrow{color:${COLORS.textFaint};transition:transform .18s,color .18s;font-size:1rem;flex-shrink:0}
        .module-card:hover .module-arrow{transform:translateX(4px);color:${COLORS.accent}}
      `}</style>

      <DashboardNav />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "3.5rem 2rem" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".75rem", color: COLORS.textFaint, marginBottom: "1.5rem" }}>
          <span
            style={{ cursor: "pointer", transition: "color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = COLORS.accent)}
            onMouseLeave={e => (e.currentTarget.style.color = COLORS.textFaint)}
            onClick={() => navigate("/courses")}
          >
            Курсы
          </span>
          <span>/</span>
          <span style={{ color: COLORS.textMuted }}>{category.name}</span>
        </div>

        {/* Header */}
        <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: COLORS.accent, marginBottom: ".5rem" }}>
          Курс
        </p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.025em", color: COLORS.textPrimary, marginBottom: ".5rem" }}>
          {category.name}
        </h1>
        {category.description && (
          <p style={{ fontSize: ".9rem", color: COLORS.textMuted, marginBottom: "2.5rem" }}>
            {category.description}
          </p>
        )}
        {!category.description && <div style={{ marginBottom: "2.5rem" }} />}

        {/* Модули */}
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 800, color: COLORS.textPrimary }}>
            Модули
          </h2>
        </div>

        {category.courses.length === 0 ? (
          <div style={{ color: COLORS.textFaint, fontSize: ".85rem", fontStyle: "italic" }}>Модули скоро появятся</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {category.courses.map((mod: ApiCourse) => {
              const color  = slugColor(mod.slug);
              const imgUrl = mediaUrl(mod.image);

              return (
                <div
                  key={mod.slug}
                  className="module-card"
                  onClick={() => navigate(`/courses/${mod.slug}`, {
                    state: { categoryCode: category.code, categoryName: category.name },
                  })}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: color }} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: FONTS.display, fontSize: "1.05rem", fontWeight: 800, color: COLORS.textPrimary, marginBottom: ".25rem" }}>
                        {mod.name}
                      </div>
                      {mod.description && (
                        <div style={{ fontSize: ".75rem", color: COLORS.textFaint, maxWidth: "480px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {mod.description}
                        </div>
                      )}
                      {!mod.is_free && mod.cost && (
                        <div style={{ fontSize: ".72rem", color: COLORS.textMuted, marginTop: ".15rem" }}>
                          {parseFloat(mod.cost).toLocaleString("ru-RU")} ₸
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="module-arrow">→</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
