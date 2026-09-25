#!/usr/bin/env node
/**
 * Fill chat i18n: merge full translated `workspace` (+ missing `common`) into
 * sparse locales, and add new workspace keys to all 8 locales.
 *
 * Source of truth for structure: messages/en.json
 * Usage: node scripts/fill-chat-i18n.mjs
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const MESSAGES_DIR = path.join(ROOT, "messages")

const ALL_LOCALES = ["en", "nl", "pt", "es", "ar", "fa", "ru", "tr"]
const SPARSE_LOCALES = ["nl", "pt", "es", "ru", "tr"]

const COMMON_FILL_KEYS = [
  "brand",
  "seePricing",
  "pricingLink",
  "toggleTheme",
  "theme",
  "themeSystem",
  "themeLight",
  "themeDark",
  "lightMode",
  "darkMode",
  "settings",
  "ready",
  "comingSoon",
  "live",
  "demo",
  "filled",
]

/** @param {unknown} a @param {unknown} b */
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

/**
 * Deep-merge `source` into `target`, only filling missing keys.
 * Existing leaf values in `target` are preserved.
 * @returns {string[]} dotted paths that were added
 */
function deepMergeMissing(target, source, prefix = "") {
  const added = []
  if (!isPlainObject(source)) return added
  if (!isPlainObject(target)) return added

  for (const [key, value] of Object.entries(source)) {
    const pathKey = prefix ? `${prefix}.${key}` : key
    if (!(key in target)) {
      target[key] = structuredClone(value)
      if (isPlainObject(value)) {
        added.push(...flattenLeaves(value, pathKey))
      } else {
        added.push(pathKey)
      }
      continue
    }
    if (isPlainObject(target[key]) && isPlainObject(value)) {
      added.push(...deepMergeMissing(target[key], value, pathKey))
    }
  }
  return added
}

/** @param {Record<string, unknown>} obj @param {string} prefix */
function flattenLeaves(obj, prefix = "") {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(v)) out.push(...flattenLeaves(v, p))
    else out.push(p)
  }
  return out
}

/** English new keys (also the en workspace patch). */
const NEW_KEYS_EN = {
  composerSend: "Send",
  composerSendTitle: "Send · Enter",
  showMore: "Show more",
  showLess: "Show less",
  reply: "Reply",
  replyToMessage: "Reply to message",
  copy: "Copy",
  copied: "Copied",
  copyMessage: "Copy message",
  copyResponse: "Copy response",
  copiedMessage: "Copied message",
  copiedResponse: "Copied response",
  edit: "Edit",
  editMessage: "Edit message",
  helpful: "Helpful",
  helpfulResponse: "Helpful response",
  notHelpful: "Not helpful",
  unhelpfulResponse: "Unhelpful response",
  replyToUser: "Reply to user",
  replyToAssistant: "Reply to assistant",
  cancelReply: "Cancel reply",
  noTradeTitle: "No trade",
  signalSideLong: "Long",
  signalSideShort: "Short",
  assistantTyping: "Assistant is typing",
  loadingExur: "Loading Exur",
  justNow: "Just now",
  minutesAgo: "{count}m ago",
  hoursAgo: "{count}h ago",
  errors: {
    recovery: "Something went wrong while receiving the response.",
    timeout:
      "Exur took too long to respond. Check your connection and try again.",
    credits: "You've used this period's chat credits. Upgrade to continue.",
    proSessionRefresh:
      "Your Plus plan is active, but this session needs a refresh. Try again.",
    auth: "Sign in with Google to get answers from Exur. You can explore prompts and typing first.",
    trialExhausted:
      "Your free messages this week are used up. Sign in to continue.",
  },
}

const NEW_KEYS = {
  en: NEW_KEYS_EN,
  nl: {
    composerSend: "Versturen",
    composerSendTitle: "Versturen · Enter",
    showMore: "Meer tonen",
    showLess: "Minder tonen",
    reply: "Beantwoorden",
    replyToMessage: "Bericht beantwoorden",
    copy: "Kopiëren",
    copied: "Gekopieerd",
    copyMessage: "Bericht kopiëren",
    copyResponse: "Antwoord kopiëren",
    copiedMessage: "Bericht gekopieerd",
    copiedResponse: "Antwoord gekopieerd",
    edit: "Bewerken",
    editMessage: "Bericht bewerken",
    helpful: "Nuttig",
    helpfulResponse: "Nuttig antwoord",
    notHelpful: "Niet nuttig",
    unhelpfulResponse: "Niet-nuttig antwoord",
    replyToUser: "Antwoord op gebruiker",
    replyToAssistant: "Antwoord op assistent",
    cancelReply: "Antwoord annuleren",
    noTradeTitle: "Geen trade",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "Assistent typt",
    loadingExur: "Exur laden",
    justNow: "Zojuist",
    minutesAgo: "{count}m geleden",
    hoursAgo: "{count}u geleden",
    errors: {
      recovery: "Er ging iets mis bij het ontvangen van het antwoord.",
      timeout:
        "Exur deed er te lang over. Controleer je verbinding en probeer opnieuw.",
      credits:
        "Je chatcredits voor deze periode zijn op. Upgrade om door te gaan.",
      proSessionRefresh:
        "Je Plus-abonnement is actief, maar deze sessie moet worden vernieuwd. Probeer opnieuw.",
      auth: "Log in met Google om antwoorden van Exur te krijgen. Je kunt eerst prompts en typen verkennen.",
      trialExhausted:
        "Je gratis berichten van deze week zijn op. Log in om door te gaan.",
    },
  },
  pt: {
    composerSend: "Enviar",
    composerSendTitle: "Enviar · Enter",
    showMore: "Mostrar mais",
    showLess: "Mostrar menos",
    reply: "Responder",
    replyToMessage: "Responder à mensagem",
    copy: "Copiar",
    copied: "Copiado",
    copyMessage: "Copiar mensagem",
    copyResponse: "Copiar resposta",
    copiedMessage: "Mensagem copiada",
    copiedResponse: "Resposta copiada",
    edit: "Editar",
    editMessage: "Editar mensagem",
    helpful: "Útil",
    helpfulResponse: "Resposta útil",
    notHelpful: "Não útil",
    unhelpfulResponse: "Resposta não útil",
    replyToUser: "Responder ao utilizador",
    replyToAssistant: "Responder ao assistente",
    cancelReply: "Cancelar resposta",
    noTradeTitle: "Sem trade",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "O assistente está a escrever",
    loadingExur: "A carregar Exur",
    justNow: "Agora mesmo",
    minutesAgo: "há {count}m",
    hoursAgo: "há {count}h",
    errors: {
      recovery: "Algo correu mal ao receber a resposta.",
      timeout:
        "O Exur demorou demasiado a responder. Verifique a ligação e tente de novo.",
      credits:
        "Usou os créditos de chat deste período. Faça upgrade para continuar.",
      proSessionRefresh:
        "O seu plano Plus está ativo, mas esta sessão precisa de ser atualizada. Tente de novo.",
      auth: "Inicie sessão com o Google para obter respostas do Exur. Pode explorar prompts e digitar primeiro.",
      trialExhausted:
        "As suas mensagens gratuitas desta semana esgotaram-se. Inicie sessão para continuar.",
    },
  },
  es: {
    composerSend: "Enviar",
    composerSendTitle: "Enviar · Enter",
    showMore: "Mostrar más",
    showLess: "Mostrar menos",
    reply: "Responder",
    replyToMessage: "Responder al mensaje",
    copy: "Copiar",
    copied: "Copiado",
    copyMessage: "Copiar mensaje",
    copyResponse: "Copiar respuesta",
    copiedMessage: "Mensaje copiado",
    copiedResponse: "Respuesta copiada",
    edit: "Editar",
    editMessage: "Editar mensaje",
    helpful: "Útil",
    helpfulResponse: "Respuesta útil",
    notHelpful: "No útil",
    unhelpfulResponse: "Respuesta no útil",
    replyToUser: "Responder al usuario",
    replyToAssistant: "Responder al asistente",
    cancelReply: "Cancelar respuesta",
    noTradeTitle: "Sin trade",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "El asistente está escribiendo",
    loadingExur: "Cargando Exur",
    justNow: "Justo ahora",
    minutesAgo: "hace {count}m",
    hoursAgo: "hace {count}h",
    errors: {
      recovery: "Algo salió mal al recibir la respuesta.",
      timeout:
        "Exur tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.",
      credits:
        "Has agotado los créditos de chat de este periodo. Mejora tu plan para continuar.",
      proSessionRefresh:
        "Tu plan Plus está activo, pero esta sesión necesita actualizarse. Inténtalo de nuevo.",
      auth: "Inicia sesión con Google para obtener respuestas de Exur. Puedes explorar prompts y escribir primero.",
      trialExhausted:
        "Se agotaron tus mensajes gratis de esta semana. Inicia sesión para continuar.",
    },
  },
  ar: {
    composerSend: "إرسال",
    composerSendTitle: "إرسال · Enter",
    showMore: "عرض المزيد",
    showLess: "عرض أقل",
    reply: "رد",
    replyToMessage: "الرد على الرسالة",
    copy: "نسخ",
    copied: "تم النسخ",
    copyMessage: "نسخ الرسالة",
    copyResponse: "نسخ الرد",
    copiedMessage: "تم نسخ الرسالة",
    copiedResponse: "تم نسخ الرد",
    edit: "تعديل",
    editMessage: "تعديل الرسالة",
    helpful: "مفيد",
    helpfulResponse: "رد مفيد",
    notHelpful: "غير مفيد",
    unhelpfulResponse: "رد غير مفيد",
    replyToUser: "الرد على المستخدم",
    replyToAssistant: "الرد على المساعد",
    cancelReply: "إلغاء الرد",
    noTradeTitle: "بلا صفقة",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "المساعد يكتب",
    loadingExur: "جارٍ تحميل Exur",
    justNow: "الآن",
    minutesAgo: "منذ {count}د",
    hoursAgo: "منذ {count}س",
    errors: {
      recovery: "حدث خطأ أثناء استلام الرد.",
      timeout: "استغرق Exur وقتًا طويلاً للرد. تحقق من اتصالك وأعد المحاولة.",
      credits:
        "استهلكت أرصدة الدردشة لهذه الفترة. رقِّ خطتك للمتابعة.",
      proSessionRefresh:
        "خطتك Plus نشطة، لكن هذه الجلسة تحتاج إلى تحديث. أعد المحاولة.",
      auth: "سجّل الدخول عبر Google للحصول على إجابات من Exur. يمكنك استكشاف الاقتراحات والكتابة أولاً.",
      trialExhausted:
        "استُنفدت رسائلك المجانية لهذا الأسبوع. سجّل الدخول للمتابعة.",
    },
  },
  fa: {
    composerSend: "ارسال",
    composerSendTitle: "ارسال · Enter",
    showMore: "نمایش بیشتر",
    showLess: "نمایش کمتر",
    reply: "پاسخ",
    replyToMessage: "پاسخ به پیام",
    copy: "کپی",
    copied: "کپی شد",
    copyMessage: "کپی پیام",
    copyResponse: "کپی پاسخ",
    copiedMessage: "پیام کپی شد",
    copiedResponse: "پاسخ کپی شد",
    edit: "ویرایش",
    editMessage: "ویرایش پیام",
    helpful: "مفید",
    helpfulResponse: "پاسخ مفید",
    notHelpful: "غیرمفید",
    unhelpfulResponse: "پاسخ غیرمفید",
    replyToUser: "پاسخ به کاربر",
    replyToAssistant: "پاسخ به دستیار",
    cancelReply: "لغو پاسخ",
    noTradeTitle: "بدون معامله",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "دستیار در حال نوشتن است",
    loadingExur: "در حال بارگذاری Exur",
    justNow: "همین الان",
    minutesAgo: "{count}د پیش",
    hoursAgo: "{count}س پیش",
    errors: {
      recovery: "هنگام دریافت پاسخ مشکلی پیش آمد.",
      timeout:
        "Exur خیلی دیر پاسخ داد. اتصال را بررسی کن و دوباره امتحان کن.",
      credits:
        "اعتبار چت این دوره تمام شده. برای ادامه ارتقا بده.",
      proSessionRefresh:
        "طرح Plus فعال است، اما این نشست نیاز به تازه‌سازی دارد. دوباره امتحان کن.",
      auth: "برای دریافت پاسخ از Exur با Google وارد شو. می‌توانی اول پیشنهادها و تایپ را امتحان کنی.",
      trialExhausted:
        "پیام‌های رایگان این هفته تمام شد. برای ادامه وارد شو.",
    },
  },
  ru: {
    composerSend: "Отправить",
    composerSendTitle: "Отправить · Enter",
    showMore: "Показать ещё",
    showLess: "Свернуть",
    reply: "Ответить",
    replyToMessage: "Ответить на сообщение",
    copy: "Копировать",
    copied: "Скопировано",
    copyMessage: "Копировать сообщение",
    copyResponse: "Копировать ответ",
    copiedMessage: "Сообщение скопировано",
    copiedResponse: "Ответ скопирован",
    edit: "Изменить",
    editMessage: "Изменить сообщение",
    helpful: "Полезно",
    helpfulResponse: "Полезный ответ",
    notHelpful: "Не полезно",
    unhelpfulResponse: "Бесполезный ответ",
    replyToUser: "Ответ пользователю",
    replyToAssistant: "Ответ ассистенту",
    cancelReply: "Отменить ответ",
    noTradeTitle: "Без сделки",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "Ассистент печатает",
    loadingExur: "Загрузка Exur",
    justNow: "Только что",
    minutesAgo: "{count}м назад",
    hoursAgo: "{count}ч назад",
    errors: {
      recovery: "Не удалось получить ответ.",
      timeout:
        "Exur слишком долго отвечает. Проверьте соединение и попробуйте снова.",
      credits:
        "Кредиты чата за этот период израсходованы. Обновите план, чтобы продолжить.",
      proSessionRefresh:
        "План Plus активен, но эту сессию нужно обновить. Попробуйте снова.",
      auth: "Войдите через Google, чтобы получать ответы от Exur. Сначала можно изучить подсказки и набор текста.",
      trialExhausted:
        "Бесплатные сообщения на этой неделе закончились. Войдите, чтобы продолжить.",
    },
  },
  tr: {
    composerSend: "Gönder",
    composerSendTitle: "Gönder · Enter",
    showMore: "Daha fazla",
    showLess: "Daha az",
    reply: "Yanıtla",
    replyToMessage: "Mesaja yanıt ver",
    copy: "Kopyala",
    copied: "Kopyalandı",
    copyMessage: "Mesajı kopyala",
    copyResponse: "Yanıtı kopyala",
    copiedMessage: "Mesaj kopyalandı",
    copiedResponse: "Yanıt kopyalandı",
    edit: "Düzenle",
    editMessage: "Mesajı düzenle",
    helpful: "Yararlı",
    helpfulResponse: "Yararlı yanıt",
    notHelpful: "Yararsız",
    unhelpfulResponse: "Yararsız yanıt",
    replyToUser: "Kullanıcıya yanıt",
    replyToAssistant: "Asistana yanıt",
    cancelReply: "Yanıtı iptal et",
    noTradeTitle: "İşlem yok",
    signalSideLong: "Long",
    signalSideShort: "Short",
    assistantTyping: "Asistan yazıyor",
    loadingExur: "Exur yükleniyor",
    justNow: "Az önce",
    minutesAgo: "{count}dk önce",
    hoursAgo: "{count}sa önce",
    errors: {
      recovery: "Yanıt alınırken bir sorun oluştu.",
      timeout:
        "Exur yanıt vermekte çok uzun sürdü. Bağlantınızı kontrol edip tekrar deneyin.",
      credits:
        "Bu dönemin sohbet kredilerini kullandınız. Devam etmek için yükseltin.",
      proSessionRefresh:
        "Plus planınız aktif, ancak bu oturumun yenilenmesi gerekiyor. Tekrar deneyin.",
      auth: "Exur’dan yanıt almak için Google ile giriş yapın. Önce istemleri ve yazmayı deneyebilirsiniz.",
      trialExhausted:
        "Bu haftaki ücretsiz mesajlarınız bitti. Devam etmek için giriş yapın.",
    },
  },
}

/** Missing `common` keys for sparse locales. */
const COMMON_FILL = {
  nl: {
    brand: "Exur",
    seePricing: "Bekijk prijzen voor actuele limieten.",
    pricingLink: "Prijzen bekijken",
    toggleTheme: "Thema wisselen",
    theme: "Thema",
    themeSystem: "Systeem",
    themeLight: "Licht",
    themeDark: "Donker",
    lightMode: "Lichte modus",
    darkMode: "Donkere modus",
    settings: "Instellingen",
    ready: "Klaar",
    comingSoon: "Binnenkort",
    live: "Live",
    demo: "Demo",
    filled: "Gevuld",
  },
  pt: {
    brand: "Exur",
    seePricing: "Veja os preços para os limites atuais.",
    pricingLink: "Ver preços",
    toggleTheme: "Alternar tema",
    theme: "Tema",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Escuro",
    lightMode: "Modo claro",
    darkMode: "Modo escuro",
    settings: "Definições",
    ready: "Pronto",
    comingSoon: "Em breve",
    live: "Ao vivo",
    demo: "Demo",
    filled: "Preenchido",
  },
  es: {
    brand: "Exur",
    seePricing: "Consulta los precios para los límites actuales.",
    pricingLink: "Ver precios",
    toggleTheme: "Cambiar tema",
    theme: "Tema",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    lightMode: "Modo claro",
    darkMode: "Modo oscuro",
    settings: "Ajustes",
    ready: "Listo",
    comingSoon: "Próximamente",
    live: "En vivo",
    demo: "Demo",
    filled: "Completado",
  },
  ru: {
    brand: "Exur",
    seePricing: "Смотрите тарифы для текущих лимитов.",
    pricingLink: "Тарифы",
    toggleTheme: "Сменить тему",
    theme: "Тема",
    themeSystem: "Системная",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    lightMode: "Светлый режим",
    darkMode: "Тёмный режим",
    settings: "Настройки",
    ready: "Готово",
    comingSoon: "Скоро",
    live: "Онлайн",
    demo: "Демо",
    filled: "Исполнено",
  },
  tr: {
    brand: "Exur",
    seePricing: "Güncel limitler için fiyatlara bakın.",
    pricingLink: "Fiyatları gör",
    toggleTheme: "Temayı değiştir",
    theme: "Tema",
    themeSystem: "Sistem",
    themeLight: "Açık",
    themeDark: "Koyu",
    lightMode: "Açık mod",
    darkMode: "Koyu mod",
    settings: "Ayarlar",
    ready: "Hazır",
    comingSoon: "Yakında",
    live: "Canlı",
    demo: "Demo",
    filled: "Dolduruldu",
  },
}

/**
 * Full workspace translations for sparse locales (all en keys + new keys).
 * Existing login/consent keys in locale files are kept via deepMergeMissing.
 */
const WORKSPACE_FILL = {
  nl: {
    news: "Nieuws",
    home: "Home",
    market: "Markt",
    workspace: "Werkruimte",
    iris: "Exur",
    irisChat: "Exur-chat",
    copilotSignIn: "Co-pilot · log in voor antwoorden",
    copilotGuestUnavailable: "Gastchat niet beschikbaar · log in om door te gaan",
    copilotGuestTry: "Gast · 3 gratis berichten deze week",
    emptyGuestUnavailable:
      "De gastproef is nu niet beschikbaar. Log in om met Exur te chatten.",
    guestSendBlocked:
      "Gastchat is nu niet beschikbaar. Log in om door te gaan.",
    guestTrialExhaustedPrompt:
      "Je gratis berichten van deze week zijn op. Log in om verder te chatten met Exur.",
    guestChatUpstreamUnreachable:
      "Exur is tijdelijk niet beschikbaar. Probeer zo opnieuw, of log in om door te gaan.",
    upgrade: "Upgraden",
    upgradeToPlus: "Upgraden naar Plus",
    billing: "Facturering",
    logOut: "Uitloggen",
    connecting: "Verbinden…",
    signIn: "Inloggen",
    continueWithGoogle: "Doorgaan met Google",
    continueWithGoogleShort: "Doorgaan",
    agreeContinueWithGoogle: "Akkoord & doorgaan met Google",
    secureSignInWithGoogle: "Veilig inloggen met Google",
    loginConsentDescription:
      "Accepteer de voorwaarden hieronder om veilig in te loggen.",
    loginConsentDisclaimer:
      "Je moet 18+ zijn en niet in een volledig gesanctioneerd rechtsgebied wonen. Exur geeft alleen analyse ter informatie — geen financieel advies.",
    agreeTerms: "Ik ga akkoord met de <link>Servicevoorwaarden</link>",
    agreePrivacy: "Ik ga akkoord met het <link>Privacybeleid</link>",
    cancel: "Annuleren",
    tryAgain: "Opnieuw proberen",
    chatHistory: "Chatgeschiedenis",
    closeChatHistory: "Chatgeschiedenis sluiten",
    closeNews: "Nieuws sluiten",
    collapseChatHistory: "Chatgeschiedenis inklappen",
    expandChatHistory: "Chatgeschiedenis uitklappen",
    historyDrawerSubtitle: "AI-marktco-pilot",
    dockChat: "Chat vastzetten",
    fullScreenChat: "Chat op volledig scherm",
    newChat: "Nieuwe chat",
    closeChat: "Chat sluiten",
    backToChat: "Terug naar chat",
    scrollToLatest: "Naar nieuwste berichten",
    ethereum: "Ethereum",
    bitcoin: "Bitcoin",
    gold: "Goud",
    primaryNav: "Primair",
    composerPlaceholder: "Vraag Exur of typ @ voor tools…",
    composerMobilePlaceholder: "Vraag Exur",
    composerVoiceInput: "Spraakinvoer",
    composerVoiceMode: "Spraakmodus",
    mobileGreeting: "Waarmee kan ik helpen, <highlight>{name}</highlight>?",
    mobileGreetingGuest: "Waarmee kan ik helpen?",
    composerSignalMenu: "Signaal aanvragen",
    composerMentionMenu: "Exur-tools",
    composerToolsMenu: "Exur-tools",
    composerToolSignalLabel: "Signaal",
    composerToolSignalDesc: "Trade-setup voor elk asset",
    composerToolSignalPlaceholder: "ETH, BTC, SOL…",
    composerRemoveTool: "Tool verwijderen",
    composerHint: "Exur geeft alleen marktinformatie, geen financieel advies",
    lowSignalUserReply:
      "Dat begreep ik niet helemaal. Vraag naar ETH of BTC, marktniews, of beschrijf de setup die Exur moet checken.",
    signalCardTitle: "Trade-signaal",
    signalCardEntry: "Entry",
    signalCardStopLoss: "Stop-loss",
    signalCardTakeProfit: "Take-profit",
    signalCardLeverage: "Hefboom",
    signalCardSize: "Omvang",
    signalCardRisk: "Risico",
    signalCardRewardRisk: "R:R",
    signalCardTimeHorizon: "Tijdshorizon",
    signalCardThesisHeading: "These — waarom deze setup",
    signalCardDisclaimer:
      "Exur geeft alleen marktinformatie, geen financieel advies.",
    samplePromptsLabel: "Starters",
    samplePrompts: {
      usePrompt: "Gebruik prompt: {title}",
      "btc-signal": {
        title: "BTC trade-signaal",
        description:
          "Vraag om een live setup — kaart alleen bij een duidelijke lezing.",
        text: "@signal BTC",
      },
      "market-pulse": {
        title: "Marktpuls",
        description: "Stance, modelbias en nieuws — alleen analyse.",
        text: "Wat is Exurs stance en modelbias op BTC nu, en wat zegt de nieuwspuls? Houd het feitelijk en beknopt. Alleen analyse — geen tradekaart.",
      },
      "key-levels": {
        title: "Belangrijke levels",
        description: "Dichtstbijzijnde steun en weerstand die nu tellen.",
        text: "Kaart BTC’s belangrijkste steun en weerstand uit recente structuur en live prijs. Noem de dichtstbijzijnde levels en of de prijs drukt, afwijst of midden in de range zit. Alleen analyse — geen tradekaart.",
      },
    },
    emptySignedIn: "Begin met een prompt of vraag in gewone taal.",
    emptySignedOut: "Verken de chat. Log in wanneer je een echt antwoord wilt.",
    emptyGuestTrial:
      "Vraag Exur wat je wilt. Je krijgt 3 gratis berichten per week vóór inloggen.",
    fetchingContext: "Live marktcontext ophalen…",
    evaluatingSetup: "Setup toetsen aan live bewijs…",
    recentChats: "Recent",
    noSavedChats: "Nog geen opgeslagen chats.",
    pinnedChats: "Vastgezet",
    renameChat: "Hernoemen",
    renameChatLabel: "Chattitel",
    pinChat: "Chat vastzetten",
    unpinChat: "Losmaken",
    shareChat: "Delen",
    sharedChat: "Gekopieerd",
    deleteChat: "Verwijderen",
    chatOptions: "Chatopties",
    cancelRename: "Annuleren",
    saveRename: "Opslaan",
    effort: {
      label: "Antwoorddiepte",
      aria: "Antwoorddiepte: {mode}",
      instant: "Snel",
      instantHint: "Korte, snelle antwoorden",
      high: "Nadenken",
      highHint: "Diepere analyse, trager",
    },
    ...NEW_KEYS.nl,
  },
  pt: {
    news: "Notícias",
    home: "Início",
    market: "Mercado",
    workspace: "Espaço de trabalho",
    iris: "Exur",
    irisChat: "Chat Exur",
    copilotSignIn: "Co-piloto · entre para obter respostas",
    copilotGuestUnavailable:
      "Chat de convidado indisponível · entre para continuar",
    copilotGuestTry: "Convidado · 3 mensagens grátis esta semana",
    emptyGuestUnavailable:
      "O teste de convidado não está disponível agora. Entre para conversar com o Exur.",
    guestSendBlocked:
      "O chat de convidado não está disponível agora. Entre para continuar.",
    guestTrialExhaustedPrompt:
      "As suas mensagens grátis desta semana esgotaram-se. Entre para continuar a conversar com o Exur.",
    guestChatUpstreamUnreachable:
      "O Exur está temporariamente indisponível. Tente novamente em breve ou entre para continuar.",
    upgrade: "Upgrade",
    upgradeToPlus: "Upgrade para Plus",
    billing: "Faturação",
    logOut: "Sair",
    connecting: "Conectando…",
    signIn: "Entrar",
    continueWithGoogle: "Continuar com o Google",
    continueWithGoogleShort: "Continuar",
    agreeContinueWithGoogle: "Aceitar e continuar com o Google",
    secureSignInWithGoogle: "Entrada segura com o Google",
    loginConsentDescription:
      "Aceite os termos abaixo para entrar com segurança.",
    loginConsentDisclaimer:
      "Você deve ter 18+ e não estar em uma jurisdição sob sanções abrangentes. O Exur fornece análise apenas informativa — não é aconselhamento financeiro.",
    agreeTerms: "Concordo com os <link>Termos de Serviço</link>",
    agreePrivacy: "Concordo com a <link>Política de Privacidade</link>",
    cancel: "Cancelar",
    tryAgain: "Tentar de novo",
    chatHistory: "Histórico do chat",
    closeChatHistory: "Fechar histórico do chat",
    closeNews: "Fechar notícias",
    collapseChatHistory: "Recolher histórico do chat",
    expandChatHistory: "Expandir histórico do chat",
    historyDrawerSubtitle: "Co-piloto de mercado com IA",
    dockChat: "Fixar chat",
    fullScreenChat: "Chat em ecrã inteiro",
    newChat: "Novo chat",
    closeChat: "Fechar chat",
    backToChat: "Voltar ao chat",
    scrollToLatest: "Ir para as mensagens mais recentes",
    ethereum: "Ethereum",
    bitcoin: "Bitcoin",
    gold: "Ouro",
    primaryNav: "Principal",
    composerPlaceholder: "Pergunte ao Exur ou digite @ para ferramentas…",
    composerMobilePlaceholder: "Pergunte ao Exur",
    composerVoiceInput: "Entrada por voz",
    composerVoiceMode: "Modo de voz",
    mobileGreeting: "Em que posso ajudar, <highlight>{name}</highlight>?",
    mobileGreetingGuest: "Em que posso ajudar?",
    composerSignalMenu: "Pedir sinal",
    composerMentionMenu: "Ferramentas Exur",
    composerToolsMenu: "Ferramentas Exur",
    composerToolSignalLabel: "Sinal",
    composerToolSignalDesc: "Setup de trade para qualquer ativo",
    composerToolSignalPlaceholder: "ETH, BTC, SOL…",
    composerRemoveTool: "Remover ferramenta",
    composerHint:
      "O Exur fornece apenas informação de mercado, não aconselhamento financeiro",
    lowSignalUserReply:
      "Não percebi bem. Pergunte sobre ETH ou BTC, notícias de mercado, ou descreva o setup que quer que o Exur verifique.",
    signalCardTitle: "Sinal de trade",
    signalCardEntry: "Entrada",
    signalCardStopLoss: "Stop loss",
    signalCardTakeProfit: "Take profit",
    signalCardLeverage: "Alavancagem",
    signalCardSize: "Tamanho",
    signalCardRisk: "Risco",
    signalCardRewardRisk: "R:R",
    signalCardTimeHorizon: "Horizonte temporal",
    signalCardThesisHeading: "Tese — porquê este setup",
    signalCardDisclaimer:
      "O Exur fornece apenas informação de mercado, não aconselhamento financeiro.",
    samplePromptsLabel: "Sugestões",
    samplePrompts: {
      usePrompt: "Usar prompt: {title}",
      "btc-signal": {
        title: "Sinal de trade BTC",
        description:
          "Peça um setup ao vivo — cartão só quando a leitura for clara.",
        text: "@signal BTC",
      },
      "market-pulse": {
        title: "Pulso do mercado",
        description: "Posição, viés do modelo e notícias — só análise.",
        text: "Qual é a posição e o viés do modelo do Exur sobre BTC agora, e o que diz o pulso das notícias? Seja factual e conciso. Só análise — sem cartão de trade.",
      },
      "key-levels": {
        title: "Níveis-chave",
        description: "Suporte e resistência mais próximos que importam agora.",
        text: "Mapeie o suporte e a resistência-chave do BTC a partir da estrutura recente e do preço ao vivo. Indique os níveis mais próximos e se o preço está a pressionar, a rejeitar ou a meio do intervalo. Só análise — sem cartão de trade.",
      },
    },
    emptySignedIn: "Comece com um prompt ou pergunte em linguagem natural.",
    emptySignedOut:
      "Explore o chat. Entre quando quiser uma resposta real.",
    emptyGuestTrial:
      "Pergunte o que quiser ao Exur. Tem 3 mensagens grátis por semana antes de entrar.",
    fetchingContext: "A obter contexto de mercado ao vivo…",
    evaluatingSetup: "A avaliar o setup face a evidência ao vivo…",
    recentChats: "Recentes",
    noSavedChats: "Ainda sem chats guardados.",
    pinnedChats: "Fixados",
    renameChat: "Renomear",
    renameChatLabel: "Título do chat",
    pinChat: "Fixar chat",
    unpinChat: "Desafixar",
    shareChat: "Partilhar",
    sharedChat: "Copiado",
    deleteChat: "Eliminar",
    chatOptions: "Opções do chat",
    cancelRename: "Cancelar",
    saveRename: "Guardar",
    effort: {
      label: "Profundidade da resposta",
      aria: "Profundidade da resposta: {mode}",
      instant: "Rápido",
      instantHint: "Respostas curtas e rápidas",
      high: "Pensar",
      highHint: "Análise mais profunda, mais lenta",
    },
    ...NEW_KEYS.pt,
  },
  es: {
    news: "Noticias",
    home: "Inicio",
    market: "Mercado",
    workspace: "Espacio de trabajo",
    iris: "Exur",
    irisChat: "Chat de Exur",
    copilotSignIn: "Co-piloto · inicia sesión para respuestas",
    copilotGuestUnavailable:
      "Chat de invitado no disponible · inicia sesión para continuar",
    copilotGuestTry: "Invitado · 3 mensajes gratis esta semana",
    emptyGuestUnavailable:
      "La prueba de invitado no está disponible ahora. Inicia sesión para chatear con Exur.",
    guestSendBlocked:
      "El chat de invitado no está disponible ahora. Inicia sesión para continuar.",
    guestTrialExhaustedPrompt:
      "Se agotaron tus mensajes gratis de esta semana. Inicia sesión para seguir chateando con Exur.",
    guestChatUpstreamUnreachable:
      "Exur no está disponible temporalmente. Inténtalo en un momento o inicia sesión para continuar.",
    upgrade: "Mejorar plan",
    upgradeToPlus: "Pasar a Plus",
    billing: "Facturación",
    logOut: "Cerrar sesión",
    connecting: "Conectando…",
    signIn: "Iniciar sesión",
    continueWithGoogle: "Continuar con Google",
    continueWithGoogleShort: "Continuar",
    agreeContinueWithGoogle: "Aceptar y continuar con Google",
    secureSignInWithGoogle: "Inicio de sesión seguro con Google",
    loginConsentDescription:
      "Acepta los términos abajo para iniciar sesión de forma segura.",
    loginConsentDisclaimer:
      "Debes tener 18+ y no estar en una jurisdicción bajo sanciones integrales. Exur ofrece análisis solo informativo — no es asesoramiento financiero.",
    agreeTerms: "Acepto los <link>Términos de Servicio</link>",
    agreePrivacy: "Acepto la <link>Política de Privacidad</link>",
    cancel: "Cancelar",
    tryAgain: "Intentar de nuevo",
    chatHistory: "Historial del chat",
    closeChatHistory: "Cerrar historial del chat",
    closeNews: "Cerrar noticias",
    collapseChatHistory: "Contraer historial del chat",
    expandChatHistory: "Expandir historial del chat",
    historyDrawerSubtitle: "Co-piloto de mercado con IA",
    dockChat: "Fijar chat",
    fullScreenChat: "Chat a pantalla completa",
    newChat: "Nuevo chat",
    closeChat: "Cerrar chat",
    backToChat: "Volver al chat",
    scrollToLatest: "Ir a los mensajes más recientes",
    ethereum: "Ethereum",
    bitcoin: "Bitcoin",
    gold: "Oro",
    primaryNav: "Principal",
    composerPlaceholder: "Pregunta a Exur o escribe @ para herramientas…",
    composerMobilePlaceholder: "Pregunta a Exur",
    composerVoiceInput: "Entrada por voz",
    composerVoiceMode: "Modo de voz",
    mobileGreeting: "¿En qué puedo ayudarte, <highlight>{name}</highlight>?",
    mobileGreetingGuest: "¿En qué puedo ayudarte?",
    composerSignalMenu: "Pedir señal",
    composerMentionMenu: "Herramientas de Exur",
    composerToolsMenu: "Herramientas de Exur",
    composerToolSignalLabel: "Señal",
    composerToolSignalDesc: "Setup de trade para cualquier activo",
    composerToolSignalPlaceholder: "ETH, BTC, SOL…",
    composerRemoveTool: "Quitar herramienta",
    composerHint:
      "Exur ofrece solo información de mercado, no asesoramiento financiero",
    lowSignalUserReply:
      "No lo entendí del todo. Pregunta por ETH o BTC, noticias del mercado, o describe el setup que quieres que Exur revise.",
    signalCardTitle: "Señal de trade",
    signalCardEntry: "Entrada",
    signalCardStopLoss: "Stop loss",
    signalCardTakeProfit: "Take profit",
    signalCardLeverage: "Apalancamiento",
    signalCardSize: "Tamaño",
    signalCardRisk: "Riesgo",
    signalCardRewardRisk: "R:R",
    signalCardTimeHorizon: "Horizonte temporal",
    signalCardThesisHeading: "Tesis — por qué este setup",
    signalCardDisclaimer:
      "Exur ofrece solo información de mercado, no asesoramiento financiero.",
    samplePromptsLabel: "Sugerencias",
    samplePrompts: {
      usePrompt: "Usar prompt: {title}",
      "btc-signal": {
        title: "Señal de trade BTC",
        description:
          "Pide un setup en vivo — tarjeta solo si la lectura es clara.",
        text: "@signal BTC",
      },
      "market-pulse": {
        title: "Pulso del mercado",
        description: "Postura, sesgo del modelo y noticias — solo análisis.",
        text: "¿Cuál es la postura y el sesgo del modelo de Exur sobre BTC ahora, y qué dice el pulso de noticias? Sé factual y conciso. Solo análisis — sin tarjeta de trade.",
      },
      "key-levels": {
        title: "Niveles clave",
        description: "Soporte y resistencia más cercanos que importan ahora.",
        text: "Mapea el soporte y la resistencia clave de BTC a partir de la estructura reciente y el precio en vivo. Señala los niveles más cercanos y si el precio está presionando, rechazando o a mitad de rango. Solo análisis — sin tarjeta de trade.",
      },
    },
    emptySignedIn: "Empieza con un prompt o pregunta en lenguaje natural.",
    emptySignedOut:
      "Explora el chat. Inicia sesión cuando quieras una respuesta real.",
    emptyGuestTrial:
      "Pregunta lo que quieras a Exur. Tienes 3 mensajes gratis por semana antes de iniciar sesión.",
    fetchingContext: "Obteniendo contexto de mercado en vivo…",
    evaluatingSetup: "Evaluando el setup frente a evidencia en vivo…",
    recentChats: "Recientes",
    noSavedChats: "Aún no hay chats guardados.",
    pinnedChats: "Fijados",
    renameChat: "Renombrar",
    renameChatLabel: "Título del chat",
    pinChat: "Fijar chat",
    unpinChat: "Desfijar",
    shareChat: "Compartir",
    sharedChat: "Copiado",
    deleteChat: "Eliminar",
    chatOptions: "Opciones del chat",
    cancelRename: "Cancelar",
    saveRename: "Guardar",
    effort: {
      label: "Profundidad de respuesta",
      aria: "Profundidad de respuesta: {mode}",
      instant: "Rápido",
      instantHint: "Respuestas cortas y rápidas",
      high: "Pensar",
      highHint: "Análisis más profundo, más lento",
    },
    ...NEW_KEYS.es,
  },
  ru: {
    news: "Новости",
    home: "Главная",
    market: "Рынок",
    workspace: "Рабочее пространство",
    iris: "Exur",
    irisChat: "Чат Exur",
    copilotSignIn: "Ко-пилот · войдите для ответов",
    copilotGuestUnavailable:
      "Гостевой чат недоступен · войдите, чтобы продолжить",
    copilotGuestTry: "Гость · 3 бесплатных сообщения на этой неделе",
    emptyGuestUnavailable:
      "Гостевой пробный доступ сейчас недоступен. Войдите, чтобы общаться с Exur.",
    guestSendBlocked:
      "Гостевой чат сейчас недоступен. Войдите, чтобы продолжить.",
    guestTrialExhaustedPrompt:
      "Бесплатные сообщения на этой неделе закончились. Войдите, чтобы продолжить общение с Exur.",
    guestChatUpstreamUnreachable:
      "Exur временно недоступен. Попробуйте чуть позже или войдите, чтобы продолжить.",
    upgrade: "Улучшить план",
    upgradeToPlus: "Перейти на Plus",
    billing: "Оплата",
    logOut: "Выйти",
    connecting: "Подключение…",
    signIn: "Войти",
    continueWithGoogle: "Продолжить с Google",
    continueWithGoogleShort: "Продолжить",
    agreeContinueWithGoogle: "Согласиться и продолжить с Google",
    secureSignInWithGoogle: "Безопасный вход через Google",
    loginConsentDescription:
      "Примите условия ниже, чтобы безопасно войти.",
    loginConsentDisclaimer:
      "Вам должно быть 18+, и вы не должны находиться в юрисдикции под комплексными санкциями. Exur даёт аналитику только для информации — это не финансовая рекомендация.",
    agreeTerms: "Я соглашаюсь с <link>Условиями использования</link>",
    agreePrivacy: "Я соглашаюсь с <link>Политикой конфиденциальности</link>",
    cancel: "Отмена",
    tryAgain: "Повторить",
    chatHistory: "История чатов",
    closeChatHistory: "Закрыть историю чатов",
    closeNews: "Закрыть новости",
    collapseChatHistory: "Свернуть историю чатов",
    expandChatHistory: "Развернуть историю чатов",
    historyDrawerSubtitle: "ИИ-ко-пилот по рынку",
    dockChat: "Закрепить чат",
    fullScreenChat: "Чат на весь экран",
    newChat: "Новый чат",
    closeChat: "Закрыть чат",
    backToChat: "Назад к чату",
    scrollToLatest: "К последним сообщениям",
    ethereum: "Ethereum",
    bitcoin: "Bitcoin",
    gold: "Золото",
    primaryNav: "Основное",
    composerPlaceholder: "Спросите Exur или введите @ для инструментов…",
    composerMobilePlaceholder: "Спросите Exur",
    composerVoiceInput: "Голосовой ввод",
    composerVoiceMode: "Голосовой режим",
    mobileGreeting: "Чем помочь, <highlight>{name}</highlight>?",
    mobileGreetingGuest: "Чем помочь?",
    composerSignalMenu: "Запросить сигнал",
    composerMentionMenu: "Инструменты Exur",
    composerToolsMenu: "Инструменты Exur",
    composerToolSignalLabel: "Сигнал",
    composerToolSignalDesc: "Торговый сетап по любому активу",
    composerToolSignalPlaceholder: "ETH, BTC, SOL…",
    composerRemoveTool: "Убрать инструмент",
    composerHint:
      "Exur даёт только рыночную информацию, не финансовую рекомендацию",
    lowSignalUserReply:
      "Не совсем понял. Спросите про ETH или BTC, рыночные новости или опишите сетап, который должен проверить Exur.",
    signalCardTitle: "Торговый сигнал",
    signalCardEntry: "Вход",
    signalCardStopLoss: "Стоп-лосс",
    signalCardTakeProfit: "Тейк-профит",
    signalCardLeverage: "Плечо",
    signalCardSize: "Размер",
    signalCardRisk: "Риск",
    signalCardRewardRisk: "R:R",
    signalCardTimeHorizon: "Горизонт",
    signalCardThesisHeading: "Тезис — почему этот сетап",
    signalCardDisclaimer:
      "Exur даёт только рыночную информацию, не финансовую рекомендацию.",
    samplePromptsLabel: "Старты",
    samplePrompts: {
      usePrompt: "Использовать подсказку: {title}",
      "btc-signal": {
        title: "Торговый сигнал BTC",
        description:
          "Запросите живой сетап — карточка только при ясном чтении.",
        text: "@signal BTC",
      },
      "market-pulse": {
        title: "Пульс рынка",
        description: "Позиция, bias модели и новости — только анализ.",
        text: "Какова позиция и bias модели Exur по BTC сейчас и что говорит новостной пульс? Коротко и по фактам. Только анализ — без торговой карточки.",
      },
      "key-levels": {
        title: "Ключевые уровни",
        description: "Ближайшие поддержка и сопротивление, которые важны сейчас.",
        text: "Отметь ключевые поддержку и сопротивление BTC по недавней структуре и живому цене. Укажи ближайшие уровни и давит ли цена, отвергает их или находится в середине диапазона. Только анализ — без торговой карточки.",
      },
    },
    emptySignedIn: "Начните с подсказки или спросите обычным языком.",
    emptySignedOut:
      "Изучите чат. Войдите, когда понадобится настоящий ответ.",
    emptyGuestTrial:
      "Спросите Exur что угодно. 3 бесплатных сообщения в неделю до входа.",
    fetchingContext: "Загрузка живого рыночного контекста…",
    evaluatingSetup: "Проверка сетапа по живым данным…",
    recentChats: "Недавние",
    noSavedChats: "Сохранённых чатов пока нет.",
    pinnedChats: "Закреплённые",
    renameChat: "Переименовать",
    renameChatLabel: "Название чата",
    pinChat: "Закрепить чат",
    unpinChat: "Открепить",
    shareChat: "Поделиться",
    sharedChat: "Скопировано",
    deleteChat: "Удалить",
    chatOptions: "Параметры чата",
    cancelRename: "Отмена",
    saveRename: "Сохранить",
    effort: {
      label: "Глубина ответа",
      aria: "Глубина ответа: {mode}",
      instant: "Быстро",
      instantHint: "Короткие быстрые ответы",
      high: "Размышление",
      highHint: "Более глубокий анализ, медленнее",
    },
    ...NEW_KEYS.ru,
  },
  tr: {
    news: "Haberler",
    home: "Ana sayfa",
    market: "Piyasa",
    workspace: "Çalışma alanı",
    iris: "Exur",
    irisChat: "Exur sohbeti",
    copilotSignIn: "Co-pilot · yanıt için giriş yapın",
    copilotGuestUnavailable:
      "Misafir sohbeti yok · devam etmek için giriş yapın",
    copilotGuestTry: "Misafir · bu hafta 3 ücretsiz mesaj",
    emptyGuestUnavailable:
      "Misafir denemesi şu an kullanılamıyor. Exur ile sohbet için giriş yapın.",
    guestSendBlocked:
      "Misafir sohbeti şu an kullanılamıyor. Devam etmek için giriş yapın.",
    guestTrialExhaustedPrompt:
      "Bu haftaki ücretsiz mesajlarınız bitti. Exur ile sohbete devam etmek için giriş yapın.",
    guestChatUpstreamUnreachable:
      "Exur geçici olarak kullanılamıyor. Biraz sonra deneyin veya devam etmek için giriş yapın.",
    upgrade: "Yükselt",
    upgradeToPlus: "Plus’a yükselt",
    billing: "Faturalama",
    logOut: "Çıkış yap",
    connecting: "Bağlanıyor…",
    signIn: "Giriş yap",
    continueWithGoogle: "Google ile devam et",
    continueWithGoogleShort: "Devam et",
    agreeContinueWithGoogle: "Kabul et ve Google ile devam et",
    secureSignInWithGoogle: "Google ile güvenli giriş",
    loginConsentDescription:
      "Güvenli giriş için aşağıdaki şartları kabul edin.",
    loginConsentDisclaimer:
      "18+ olmalısınız ve kapsamlı yaptırımlı bir yargı bölgesinde olmamalısınız. Exur yalnızca bilgilendirme amaçlı analiz sunar — finansal tavsiye değildir.",
    agreeTerms: "<link>Hizmet Şartları</link>’nı kabul ediyorum",
    agreePrivacy: "<link>Gizlilik Politikası</link>’nı kabul ediyorum",
    cancel: "İptal",
    tryAgain: "Tekrar dene",
    chatHistory: "Sohbet geçmişi",
    closeChatHistory: "Sohbet geçmişini kapat",
    closeNews: "Haberleri kapat",
    collapseChatHistory: "Sohbet geçmişini daralt",
    expandChatHistory: "Sohbet geçmişini genişlet",
    historyDrawerSubtitle: "Yapay zekâ piyasa co-pilot’u",
    dockChat: "Sohbeti sabitle",
    fullScreenChat: "Tam ekran sohbet",
    newChat: "Yeni sohbet",
    closeChat: "Sohbeti kapat",
    backToChat: "Sohbete dön",
    scrollToLatest: "En son mesajlara git",
    ethereum: "Ethereum",
    bitcoin: "Bitcoin",
    gold: "Altın",
    primaryNav: "Birincil",
    composerPlaceholder: "Exur’a sorun veya araçlar için @ yazın…",
    composerMobilePlaceholder: "Exur’a sorun",
    composerVoiceInput: "Sesli giriş",
    composerVoiceMode: "Sesli mod",
    mobileGreeting: "Nasıl yardımcı olabilirim, <highlight>{name}</highlight>?",
    mobileGreetingGuest: "Nasıl yardımcı olabilirim?",
    composerSignalMenu: "Sinyal iste",
    composerMentionMenu: "Exur araçları",
    composerToolsMenu: "Exur araçları",
    composerToolSignalLabel: "Sinyal",
    composerToolSignalDesc: "Her varlık için işlem kurulumu",
    composerToolSignalPlaceholder: "ETH, BTC, SOL…",
    composerRemoveTool: "Aracı kaldır",
    composerHint:
      "Exur yalnızca piyasa bilgisi sunar, finansal tavsiye değildir",
    lowSignalUserReply:
      "Tam anlayamadım. ETH veya BTC, piyasa haberleri sorun ya da Exur’un kontrol etmesini istediğiniz kurulumu anlatın.",
    signalCardTitle: "İşlem sinyali",
    signalCardEntry: "Giriş",
    signalCardStopLoss: "Stop loss",
    signalCardTakeProfit: "Take profit",
    signalCardLeverage: "Kaldıraç",
    signalCardSize: "Boyut",
    signalCardRisk: "Risk",
    signalCardRewardRisk: "R:R",
    signalCardTimeHorizon: "Zaman ufku",
    signalCardThesisHeading: "Tez — bu kurulum neden",
    signalCardDisclaimer:
      "Exur yalnızca piyasa bilgisi sunar, finansal tavsiye değildir.",
    samplePromptsLabel: "Başlangıçlar",
    samplePrompts: {
      usePrompt: "İstemi kullan: {title}",
      "btc-signal": {
        title: "BTC işlem sinyali",
        description:
          "Canlı kurulum isteyin — kart yalnızca net okuma olduğunda.",
        text: "@signal BTC",
      },
      "market-pulse": {
        title: "Piyasa nabzı",
        description: "Duruş, model yanlılığı ve haberler — yalnızca analiz.",
        text: "Exur’un şu an BTC’deki duruşu ve model yanlılığı nedir, haber nabzı ne diyor? Kısa ve olgusal tutun. Yalnızca analiz — işlem kartı yok.",
      },
      "key-levels": {
        title: "Önemli seviyeler",
        description: "Şu an önemli en yakın destek ve direnç.",
        text: "BTC’nin yakın yapı ve canlı fiyattan ana destek ve direncini çıkar. En yakın seviyeleri ve fiyatın baskı mı yaptığı, reddettiği mi yoksa aralık ortasında mı olduğunu belirt. Yalnızca analiz — işlem kartı yok.",
      },
    },
    emptySignedIn: "Bir istemle başlayın veya doğal dilde sorun.",
    emptySignedOut:
      "Sohbeti keşfedin. Gerçek bir yanıt istediğinizde giriş yapın.",
    emptyGuestTrial:
      "Exur’a istediğinizi sorun. Girişten önce haftada 3 ücretsiz mesajınız var.",
    fetchingContext: "Canlı piyasa bağlamı alınıyor…",
    evaluatingSetup: "Kurulum canlı kanıta göre değerlendiriliyor…",
    recentChats: "Son",
    noSavedChats: "Henüz kayıtlı sohbet yok.",
    pinnedChats: "Sabitlenenler",
    renameChat: "Yeniden adlandır",
    renameChatLabel: "Sohbet başlığı",
    pinChat: "Sohbeti sabitle",
    unpinChat: "Sabitlemeyi kaldır",
    shareChat: "Paylaş",
    sharedChat: "Kopyalandı",
    deleteChat: "Sil",
    chatOptions: "Sohbet seçenekleri",
    cancelRename: "İptal",
    saveRename: "Kaydet",
    effort: {
      label: "Yanıt derinliği",
      aria: "Yanıt derinliği: {mode}",
      instant: "Hızlı",
      instantHint: "Kısa, hızlı yanıtlar",
      high: "Düşünme",
      highHint: "Daha derin analiz, daha yavaş",
    },
    ...NEW_KEYS.tr,
  },
}

function assertPlaceholders(locale, workspace) {
  const en = JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf8")
  ).workspace
  const enFlat = flattenLeaves(en)
  const locFlat = Object.fromEntries(
    flattenLeaves(workspace).map((k) => [k, true])
  )
  const placeholderRe = /\{[a-zA-Z_]+\}|<highlight>|<link>/g
  const issues = []
  for (const key of enFlat) {
    if (!locFlat[key]) continue
    const enVal = key.split(".").reduce((o, p) => o?.[p], en)
    const locVal = key.split(".").reduce((o, p) => o?.[p], workspace)
    if (typeof enVal !== "string" || typeof locVal !== "string") continue
    const enPh = [...(enVal.match(placeholderRe) || [])].sort().join(",")
    const locPh = [...(locVal.match(placeholderRe) || [])].sort().join(",")
    if (enPh !== locPh) {
      issues.push(`${locale} ${key}: expected [${enPh}] got [${locPh}]`)
    }
  }
  return issues
}

function assertStructureCoverage(locale, workspace, enWorkspace) {
  const missing = flattenLeaves(enWorkspace).filter((k) => {
    const parts = k.split(".")
    let cur = workspace
    for (const p of parts) {
      if (!cur || typeof cur !== "object" || !(p in cur)) return true
      cur = cur[p]
    }
    return false
  })
  return missing
}

function main() {
  const enPath = path.join(MESSAGES_DIR, "en.json")
  const enRoot = JSON.parse(fs.readFileSync(enPath, "utf8"))
  if (!isPlainObject(enRoot.workspace) || !isPlainObject(enRoot.common)) {
    throw new Error("messages/en.json must contain workspace and common objects")
  }

  // Ensure en has the new keys (source of truth grows here first).
  const enAddedNew = deepMergeMissing(enRoot.workspace, NEW_KEYS.en)
  fs.writeFileSync(enPath, `${JSON.stringify(enRoot, null, 2)}\n`, "utf8")

  /** @type {Record<string, { workspace: string[], common: string[] }>} */
  const summary = {}

  for (const locale of ALL_LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
    const root = JSON.parse(fs.readFileSync(filePath, "utf8"))
    if (!isPlainObject(root.workspace)) root.workspace = {}
    if (!isPlainObject(root.common)) root.common = {}

    const workspaceAdded = []
    const commonAdded = []

    if (SPARSE_LOCALES.includes(locale)) {
      workspaceAdded.push(
        ...deepMergeMissing(root.workspace, WORKSPACE_FILL[locale])
      )
      // Ensure new keys are present even if somehow skipped
      workspaceAdded.push(...deepMergeMissing(root.workspace, NEW_KEYS[locale]))
      commonAdded.push(...deepMergeMissing(root.common, COMMON_FILL[locale]))
    } else {
      // en already written above; ar/fa get new keys only
      if (locale === "en") {
        workspaceAdded.push(...enAddedNew)
      } else {
        workspaceAdded.push(...deepMergeMissing(root.workspace, NEW_KEYS[locale]))
      }
    }

    // Deduplicate added paths
    const uniqWs = [...new Set(workspaceAdded)]
    const uniqCommon = [...new Set(commonAdded)]

    // Validate against updated en structure
    const enWs = JSON.parse(fs.readFileSync(enPath, "utf8")).workspace
    const missing = assertStructureCoverage(locale, root.workspace, enWs)
    if (missing.length) {
      throw new Error(
        `${locale}: missing workspace keys after fill:\n  ${missing.join("\n  ")}`
      )
    }
    const phIssues = assertPlaceholders(locale, root.workspace)
    if (phIssues.length) {
      throw new Error(
        `${locale}: placeholder mismatch:\n  ${phIssues.join("\n  ")}`
      )
    }

    // Sample-prompt guard: fa/ar keep native signal text (not @signal)
    if (locale === "fa" || locale === "ar") {
      const text = root.workspace?.samplePrompts?.["btc-signal"]?.text
      if (typeof text === "string" && text.includes("@signal")) {
        throw new Error(`${locale}: btc-signal text should not use @signal`)
      }
    }
    if (["nl", "pt", "es", "ru", "tr"].includes(locale)) {
      const text = root.workspace?.samplePrompts?.["btc-signal"]?.text
      if (text !== "@signal BTC") {
        throw new Error(
          `${locale}: expected samplePrompts.btc-signal.text = "@signal BTC", got ${JSON.stringify(text)}`
        )
      }
    }

    // common fill keys present for sparse
    if (SPARSE_LOCALES.includes(locale)) {
      for (const k of COMMON_FILL_KEYS) {
        if (!(k in root.common)) {
          throw new Error(`${locale}: missing common.${k}`)
        }
      }
    }

    fs.writeFileSync(filePath, `${JSON.stringify(root, null, 2)}\n`, "utf8")
    summary[locale] = { workspace: uniqWs, common: uniqCommon }
  }

  console.log("fill-chat-i18n: done\n")
  for (const locale of ALL_LOCALES) {
    const { workspace, common } = summary[locale]
    const file = JSON.parse(
      fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), "utf8")
    )
    const newKeyLeaves = flattenLeaves(NEW_KEYS[locale])
    const presentNew = newKeyLeaves.filter((k) => {
      const parts = k.split(".")
      let cur = file.workspace
      for (const p of parts) {
        if (!cur || typeof cur !== "object" || !(p in cur)) return false
        cur = cur[p]
      }
      return true
    })
    console.log(
      `${locale}: +${workspace.length} workspace added, +${common.length} common added · ${flattenLeaves(file.workspace).length} workspace leaves · new keys ${presentNew.length}/${newKeyLeaves.length}`
    )
    if (workspace.length) {
      const preview = workspace.slice(0, 12)
      console.log(
        `  added workspace: ${preview.join(", ")}${workspace.length > 12 ? `, …(+${workspace.length - 12})` : ""}`
      )
    }
    if (common.length) {
      console.log(`  added common: ${common.join(", ")}`)
    }
  }
}

main()
