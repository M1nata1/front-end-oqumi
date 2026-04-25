// src/pages/Landing/landing.config.ts
// ============================================================
//  ВСЯ КОНФИГУРАЦИЯ ЛЕНДИНГА
// ============================================================

export const BRAND = {
  name:   "Oqu",
  accent: "Mi",
  year:   "2025",
};

export const COLORS = {
  bgPage:       "#0D0D11",
  bgSection:    "#0A0A0E",
  bgCard:       "#13131A",
  border:       "rgba(255,255,255,0.07)",
  borderHover:  "rgba(255,58,58,0.35)",
  accent:       "#FF3A3A",
  accentHover:  "#FF5555",
  accentSoft:   "rgba(255,58,58,0.08)",
  accentBorder: "rgba(255,58,58,0.15)",
  accentText:   "#FF5555",
  textPrimary:  "#FAFAFF",
  textBody:     "#F0F0FF",
  textMuted:    "#66668A",
  textFaint:    "#44445A",
  textGhost:    "#2A2A3A",
};

export const FONTS = {
  display:   "'Syne', sans-serif",
  body:      "'Nunito', sans-serif",
  googleUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Nunito:wght@400;500;600;700&display=swap",
};

// --- Навигация ---
// action: "scroll:#id"       — плавный скролл к секции на этой странице
//         "route:/path"      — переход на страницу
//         "route:/path#hash" — переход на страницу + хэш (якорь в FAQ)
export const NAV_LINKS: { label: string; action: string }[] = [
  { label: "О платформе", action: "route:/faq#about"  },
  { label: "Курсы",       action: "scroll:#courses"   },
  { label: "Экзамен",     action: "scroll:#exam-cta"  },
  { label: "FAQ",         action: "route:/faq"         },
];

export const NAV_BTN_LABEL = "Войти";

// --- Hero ---
export const HERO = {
  label:        "Подготовка к КТ",
  titleLine1:   "Сдай КТ",
  titleLine2:   "на максимум",
  titleLine3:   "с первой попытки",
  description:  "Курсы по всем предметам, мини-тесты и реальный формат экзамена с таймером — всё в одном месте.",
  btnPrimary:   "Начать подготовку",
  btnSecondary: "Смотреть курсы",
};

export const HERO_STATS = [
  { value: "3 000+", label: "вопросов"     },
  { value: "94%",    label: "сдают с нами" },
  { value: "12+",    label: "предметов"    },
];

// --- Демо-карточка экзамена в Hero ---
export const EXAM_DEMO = {
  label:           "Пробный экзамен",
  timerLabel:      "Оставшееся время",
  timer:           "01:45:33",
  progressLabel:   "Прогресс",
  progressCurrent: 20,
  progressTotal:   100,
  questionNum:     47,
  questionText:    "Какой год считается датой принятия первой Конституции Казахстана?",
  options: [
    { label: "1991", correct: false },
    { label: "1995", correct: true  },
    { label: "1993", correct: false },
    { label: "1997", correct: false },
  ],
};

// --- Курсы ---
export const COURSES_SECTION = {
  label:       "Курсы",
  title:       "Все предметы КТ",
  description: "",
};

export const SUBJECTS = [
  { name: "Английский язык",                                     color: "#FF3A3A", topics: 24 },
  { name: "ТГО",                                                 color: "#3A8EFF", topics: 31 },
  { name: "M093 Механика",                                       color: "#06B6D4", topics: 19 },
  { name: "M094 Информационные технологии",                      color: "#A855F7", topics: 18 },
  { name: "M095 Информационная безопасность",                    color: "#22C55E", topics: 22 },
  { name: "M096 Коммуникации и коммуникационные технологии",     color: "#F59E0B", topics: 27 },
];

// --- Шаги ---
export const HOW_SECTION = {
  label: "Как это работает",
  title: "4 шага до магистратуры",
};

export const HOW_STEPS = [
  { n: "01", title: "Выбери предмет",  desc: "Выбери нужный курс из списка предметов КТ." },
  { n: "02", title: "Читай статьи",    desc: "Каждая тема — подробная статья с примерами." },
  { n: "03", title: "Пройди тест",     desc: "Короткий тест после каждой темы для закрепления." },
  { n: "04", title: "Сдай пробный КТ", desc: "Здесь ты испытаешь все знания, которые ты получил." },
];

// --- CTA пробного КТ ---
// ПУБЛИЧНЫЙ — доступен без авторизации, только обязательные предметы
export const EXAM_CTA = {
  label:       "Пробный КТ",
  title:       "Попробуй реальный формат прямо сейчас",
  description: "Таймер, 60 вопросов, анализ ошибок и итоговый балл — как на настоящем экзамене. Без регистрации.",
  features:    ["60 вопросов", "60 минут", "ТГО", "Английский язык"],
  btnLabel:    "Начать пробный экзамен",
  route:       "/exam/trial",  // публичный маршрут, только обязательные предметы
};

// --- Футер ---
export const FOOTER = {
  copyright: "Все права защищены.",
  links: [
    { label: "Контакты", action: "route:/faq#contacts" },
    { label: "Политика", action: "route:/policy"       },
  ],
};

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export const parseHMS = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(x => parseInt(x, 10));
  return (isNaN(h) ? 0 : h) * 3600 + (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
};

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export const formatHMS = (total: number) => {
  const t = Math.max(0, total);
  return `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor((t % 3600) / 60))}:${pad2(t % 60)}`;
};
