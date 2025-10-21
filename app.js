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

// Robust date parsing (supports valueAsDate, YYYY-MM-DD, DD/MM/YYYY)
function parseDateInput(el) {
  if (el && el.valueAsDate instanceof Date && !isNaN(el.valueAsDate)) {
    return el.valueAsDate;
  }
  const v = (el && el.value) ? el.value.trim() : "";
  if (!v) return null;
  // yyyy-mm-dd
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // dd/mm/yyyy
  m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  // mm-dd-yyyy (fallback)
  m = v.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return null;
}

// === TIPS ARRAY (reused) ===
const TIPS = (() => { const arr = new Array(281).fill(""); for (let i=1;i<=280;i++){ arr[i]=`اليوم ${i}: نصيحة.` } return arr;})();

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
const elTipPlaceholder = document.getElementById("tip-placeholder");
const btnShow = document.getElementById("btn-show");
const btnCopyTip = document.getElementById("btn-copy-tip");

const today = new Date();
elToday.textContent = formatDate(today);

// UID cookie
let uid = getCookie("preg_uid");
if (!uid) { uid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2); setCookie("preg_uid", uid); }
if (elUID) elUID.textContent = uid.slice(0,8) + "…";

// Load saved
let state = { mode: "start", startDateStr: "", weekInput: "" };
try { const saved = JSON.parse(localStorage.getItem("preg_data") || "{}"); state = { ...state, ...saved }; } catch(e){}

function saveState(){ localStorage.setItem("preg_data", JSON.stringify(state)); }
function normalizeYYYYMMDD(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }

function applyStateToUI(){
  if (state.mode === "start"){
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
  computeStatusOnly();
}

function computeFromInputs(){
  let start = null;
  if (state.mode === "start"){
    if (state.startDateStr) { const m = state.startDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (m) start = new Date(Number(m[1]), Number(m[2])-1, Number(m[3])); }
    if (!start) { const d = parseDateInput(elStartDate); if (d) { start = d; state.startDateStr = normalizeYYYYMMDD(d); saveState(); elStartSaved.style.display = ""; } }
  } else {
    const w = parseInt(state.weekInput, 10);
    if (!isNaN(w) && w >=1 && w<=40) { const d=new Date(today.getFullYear(), today.getMonth(), today.getDate()); d.setDate(d.getDate() - (w-1)*7); start=d; }
  }
  return start;
}

function computeStatusOnly(){
  const start = computeFromInputs();
  if (start){ elComputedStart.textContent = formatDate(start); } else { elComputedStart.textContent = "—"; }
  if (!start){ elDayNumber.textContent="—"; elWeekNumber.textContent="—"; elDayInWeek.textContent=""; elTipText.style.display="none"; elTipPlaceholder.style.display=""; btnCopyTip.disabled = true; return; }
  const diffDays = daysBetween(start, today)+1;
  const clamped = clamp(diffDays,1,280);
  const week = Math.ceil(clamped/7);
  const dayOfWeek = ((clamped-1)%7)+1;
  elDayNumber.textContent = clamped;
  elWeekNumber.textContent = week;
  elDayInWeek.textContent = `(اليوم ${dayOfWeek} من الأسبوع)`;
}

function showTodayTip(){
  const start = computeFromInputs();
  if (!start) { alert("من فضلك أدخلي تاريخ بداية الحمل أو الأسبوع الحالي أولًا."); return; }
  const diffDays = daysBetween(start, today)+1;
  const clamped = clamp(diffDays,1,280);
  const tip = TIPS[clamped] || "لا توجد نصيحة لهذا اليوم.";
  elTipText.textContent = tip;
  elTipPlaceholder.style.display = "none";
  elTipText.style.display = "";
  btnCopyTip.disabled = false;
}

btnModeStart.addEventListener("click", () => { state.mode="start"; saveState(); applyStateToUI(); });
btnModeWeek.addEventListener("click", () => { state.mode="week"; saveState(); applyStateToUI(); });
elStartDate.addEventListener("change", () => { const d=parseDateInput(elStartDate); if(d){ state.startDateStr=normalizeYYYYMMDD(d); saveState(); elStartSaved.style.display=""; computeStatusOnly(); } });
elStartDate.addEventListener("input", () => { const d=parseDateInput(elStartDate); if(d){ state.startDateStr=normalizeYYYYMMDD(d); saveState(); } });
elWeekInput.addEventListener("input", e => { state.weekInput=e.target.value; saveState(); computeStatusOnly(); });
document.getElementById("btn-show").addEventListener("click", showTodayTip);
document.getElementById("btn-copy-tip").addEventListener("click", async () => {
  if (elTipText.style.display === "none" || !elTipText.textContent.trim()) { alert("اعرضي النصيحة أولًا بالضغط على زر 'إظهار نصيحة اليوم'."); return; }
  const siteName = "جمل تحفيزية يومية للحامل";
  const link = window.location.href;
  const text = `${elTipText.textContent}\n\n— من موقع “${siteName}”\n${link}`;
  try { await navigator.clipboard.writeText(text); alert("تم نسخ النصيحة مع اسم الموقع والرابط"); }
  catch(e) { alert("تعذّر النسخ تلقائيًا. انسخي يدويًا لو سمحتِ."); }
});
btnReset.addEventListener("click", () => { localStorage.removeItem("preg_data"); state={mode:"start", startDateStr:"", weekInput:""}; saveState(); applyStateToUI(); elTipText.style.display="none"; elTipPlaceholder.style.display=""; btnCopyTip.disabled=true; });

document.addEventListener("DOMContentLoaded", applyStateToUI);
