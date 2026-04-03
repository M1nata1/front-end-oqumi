// src/pages/Subscriptions/subscriptions.config.ts

export const BRAND = { name: "Bilim", accent: "Ly" };

export const API_SUB = {
  tariffs:   "/subscription/tariffs/",
  me:        "/subscription/me/",
  subscribe: "/subscription/",          // POST { tariff_id } → MySubscription
};

export const COLORS = {
  bgPage:       "#0D0D11",
  bgCard:       "#13131A",
  bgCardHover:  "#161620",
  border:       "rgba(255,255,255,0.07)",
  borderHover:  "rgba(255,58,58,0.3)",
  accent:       "#FF3A3A",
  accentHover:  "#FF5555",
  accentSoft:   "rgba(255,58,58,0.08)",
  textPrimary:  "#FAFAFF",
  textBody:     "#F0F0FF",
  textMuted:    "#8888AA",
  textFaint:    "#44445A",
};

export const FONTS = {
  display:   "'Syne', sans-serif",
  body:      "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Nunito:wght@400;500;600;700&display=swap",
};

export const COPY = {
  pageLabel:       "Подписка",
  pageTitle:       "Тарифы",
  pageSubtitle:    "Выбери план, который подходит тебе",
  currentTitle:    "Текущая подписка",
  noSub:           "Нет активной подписки",
  noSubHint:       "Выберите тариф ниже, чтобы начать",
  activeUntil:     "Действует до",
  tariffLabel:     "Тариф",
  days:            "дней",
  free:            "Бесплатно",
  btnConnect:      "Подключить",
  btnCurrent:      "Текущий тариф",
};

// ── Типы ────────────────────────────────────────────────────

export interface Tariff {
  id:         number;
  title:      string;
  days_count: number;
  is_trial:   boolean;
  cost:       string;        // "499.00"
  created_at: string;
  updated_at: string;
}

export interface MySubscription {
  id:                number;
  tariff:            number;
  tariff_title:      string;
  tariff_days_count: number;
  deadline:          string;   // ISO datetime
  created_at:        string;
  is_active:         boolean;
}

// ── Хелперы ─────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export function formatCost(cost: string): string {
  const num = parseFloat(cost);
  return `${num.toLocaleString("ru-RU")} ₸`;
}
