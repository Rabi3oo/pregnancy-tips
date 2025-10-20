// Utilities
function formatDate(date) {
  try {
    return new Intl.DateTimeFormat("ar", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString("ar");
  }
}

function setCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function daysBetween(start, end) {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Build tips 1..280
function buildTips() {
  const arr = new Array(281).fill("");
  const examples = {
    1: "اليوم 1: هذا يوم البداية—أدخلي تاريخ البداية ليُحسب كل شيء تلقائيًا.",
    2: "اليوم 2: اهتمي بالترطيب وقللي المنبهات بعد استشارة الطبيبة.",
    3: "اليوم 3: دوّني نومك ومزاجك؛ هذه الملاحظات مفيدة لاحقًا.",
    7: "اليوم 7: امشي يوميًا 10–20 دقيقة قدر المستطاع.",
    14: "اليوم 14: حمض الفوليك مهم في المراحل الأولى—استشيري طبيبتك.",
    28: "اليوم 28: إن تأخر الموعد وظهر الاشتباه، اختبري وتابعي طبيًا.",
    70: "اليوم 70: وجبات صغيرة متفرقة قد تخفف الغثيان.",
    100:"اليوم 100: إطالات لطيفة ودعم أسفل الظهر يفيدان.",
    140:"اليوم 140: راقبي زيادة الوزن الصحية حسب إرشادات الطبيبة.",
    200:"اليوم 200: حضّري أسئلة لزيارة المتابعة القادمة.",
    250:"اليوم 250: راجعي خطة الولادة وترتيبات الوصول للمستشفى.",
    280:"اليوم 280: تهانينا! كوني على تواصل مستمر مع طبيبتك."
  };
  for (let i = 1; i <= 280; i++) {
    arr[i] = examples[i] || `اليوم ${i}: نصيحة افتراضية — يمكن استبدالها لاحقًا بنصيحة دقيقة لهذا اليوم.`;
  }
  return arr;
}
const TIPS = buildTips();

// Elements
const elToday = document.getElementById("today-date");
const elUID = document.getElementById("uid");
const elModeStart = document.getElementById("mode-start");
const elModeWeek = document.getElementById("mode-week");
const btnModeStart = document.getElementById("btn-mode-start");
const btnModeWeek = document.getElementById("btn-mode-week");
const elStartDate = document.getElementById("start-date");
const elStartSaved = document.getElementById("start-saved");
const elComputedStart = document.getElementById("computed-start");
const elWeekInput = document.getElementById("week-input");
const btnReset = document.getElementById("btn-reset");
const elDayNumber = document.getElementById("day-number");
const elWeekNumber = document.getElementById("week-number");
const elDayInWeek = document.getElementById("day-in-week");
const elTipText = document.getElementById("tip-text");
const elNote = document.getElementById("note");
const btnCopy = document.getElementById("btn-copy");
const btnTop = document.getElementById("btn-top");

const today = new Date();
elToday.textContent = formatDate(today);

// UID cookie
let uid = getCookie("preg_uid");
if (!uid) {
  uid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  setCookie("preg_uid", uid);
}
elUID.textContent = uid.slice(0,8) + "…";

// Load saved
let state = { mode: "start", startDateStr: "", weekInput: "" };
try {
  const saved = JSON.parse(localStorage.getItem("preg_data") || "{}");
  state = { ...state, ...saved };
} catch(e){}

function saveState(){
  localStorage.setItem("preg_data", JSON.stringify(state));
}

// Apply state
function applyStateToUI(){
  // Mode
  if (state.mode === "start") {
    elModeStart.style.display = "";
    elModeWeek.style.display = "none";
    btnModeStart.classList.add("active");
    btnModeWeek.classList.remove("active");
  } else {
    elModeStart.style.display = "none";
    elModeWeek.style.display = "";
    btnModeStart.classList.remove("active");
    btnModeWeek.classList.add("active");
  }

  elStartDate.value = state.startDateStr || "";
  elWeekInput.value = state.weekInput || "";

  computeAndRender();
}

function computeAndRender(){
  let start = null;

  if (state.mode === "start" && state.startDateStr) {
    const parts = state.startDateStr.split("-").map(Number);
    if (parts.length === 3) start = new Date(parts[0], parts[1]-1, parts[2]);
  } else if (state.mode === "week" && state.weekInput) {
    const w = parseInt(state.weekInput, 10);
    if (!isNaN(w) && w >= 1 && w <= 40) {
      const daysOffset = (w - 1) * 7;
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      d.setDate(d.getDate() - daysOffset);
      start = d;
    }
  }

  if (start) {
    elComputedStart.textContent = formatDate(start);
  } else {
    elComputedStart.textContent = "—";
  }

  if (!start) {
    elDayNumber.textContent = "—";
    elWeekNumber.textContent = "—";
    elDayInWeek.textContent = "";
    elTipText.textContent = "من فضلك أدخلي تاريخ بداية الحمل أو الأسبوع الحالي لعرض نصيحة اليوم.";
    elNote.style.display = "none";
    return;
  }

  const diffDays = daysBetween(start, today) + 1; // day 1 is start date
  const clamped = clamp(diffDays, 1, 280);
  const week = Math.ceil(clamped / 7);
  const dayOfWeek = ((clamped - 1) % 7) + 1;

  elDayNumber.textContent = clamped;
  elWeekNumber.textContent = week;
  elDayInWeek.textContent = `(اليوم ${dayOfWeek} من الأسبوع)`;
  elTipText.textContent = TIPS[clamped] || "لا توجد نصيحة لليوم المحدد.";
  elNote.style.display = "block";
}

// Handlers
btnModeStart.addEventListener("click", () => {
  state.mode = "start";
  saveState();
  applyStateToUI();
});
btnModeWeek.addEventListener("click", () => {
  state.mode = "week";
  saveState();
  applyStateToUI();
});
elStartDate.addEventListener("change", (e) => {
  state.startDateStr = e.target.value;
  saveState();
  elStartSaved.style.display = state.startDateStr ? "" : "none";
  computeAndRender();
});
elWeekInput.addEventListener("input", (e) => {
  state.weekInput = e.target.value;
  saveState();
  computeAndRender();
});
btnReset.addEventListener("click", () => {
  localStorage.removeItem("preg_data");
  state = { mode: "start", startDateStr: "", weekInput: "" };
  saveState();
  applyStateToUI();
});

btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert("تم نسخ رابط الصفحة");
  } catch (e) {
    alert("تعذّر النسخ تلقائيًا. انسخ الرابط من شريط العنوان.");
  }
});
btnTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Initialize
applyStateToUI();
