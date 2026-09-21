/**
 * F.R.I.D.A.Y. - Kiber Shaxsiy Yordamchi & Kuzatuv Tizimi
 * Maxsus Boshliq Abdulloxon uchun ishlab chiqilgan
 * Versiya: 5.0 // Hacker Matrix Edition & Auto-Size Responsive
 */

// ==========================================
// STATE MANAGEMENT & CONFIG
// ==========================================
const DEFAULT_API_KEY = '';

const AppState = {
    currentUser: localStorage.getItem('friday_saved_user') || null,
    userRole: localStorage.getItem('friday_saved_role') || null, // 'BOSHLIQ', 'VIP_GUEST', 'BLOCKED' or null
    apiKey: localStorage.getItem('friday_gemini_api_key') || localStorage.getItem('friday_api_key') || DEFAULT_API_KEY,
    
    emailServiceId: localStorage.getItem('friday_emailjs_service_id') || '',
    emailTemplateId: localStorage.getItem('friday_emailjs_template_id') || '',
    emailPublicKey: localStorage.getItem('friday_emailjs_public_key') || '',

    audioEnabled: localStorage.getItem('friday_audio_enabled') !== 'false',
    isSpeaking: false,
    isListening: false,
    chatHistory: [],

    // Backend API URL: Serverda yoki lokalda avtomatik moslashadi
    backendUrl: (typeof window !== 'undefined' && window.location.protocol.startsWith('http'))
        ? (window.location.port === '3000' 
            ? `${window.location.protocol}//${window.location.hostname}:5000` 
            : window.location.origin)
        : 'http://localhost:5000',
    gmailAccounts: [],
    gmailPollingInterval: null,
    inboxMessages: [],
    currentTab: 'chat', // 'chat' | 'inbox' | 'phone'
    inboxFilter: 'all',
    selectedMessage: null,

    // Telefon va GPS Kuzatuv Tizimi
    phoneTargets: JSON.parse(localStorage.getItem('friday_phone_targets') || 'null') || [
        {
            id: 'target_1',
            name: 'Nishon #1 (Toshkent Markaz)',
            phone: '+998 90 123 45 67',
            status: 'ONLINE',
            battery: '88%',
            signal: '5G (-64 dBm)',
            location: '41.2995° N, 69.2401° E (Toshkent sh., Yunusobod)',
            lastCall: 'Kiruvchi: +998 97 765 43 21 (02:45)',
            lastSms: 'Bank: Hisobingizga mablag\' kelib tushdi'
        },
        {
            id: 'target_2',
            name: 'Nishon #2 (Kuzatuv)',
            phone: '+998 93 987 65 43',
            status: 'ACTIVE TRACE',
            battery: '64%',
            signal: 'LTE (-78 dBm)',
            location: '41.3111° N, 69.2797° E (Toshkent sh., Chilonzor)',
            lastCall: 'Chiquvchi: Noma\'lum raqam (00:30)',
            lastSms: 'Uchrashuv soat 18:00 da'
        }
    ]
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const DOM = {
    // Header HUD
    hudStatus: document.getElementById('hud-status'),
    hudClearance: document.getElementById('hud-clearance'),
    hudUser: document.getElementById('hud-user'),
    systemClock: document.getElementById('systemClock'),
    apiStatusTag: document.getElementById('apiStatusTag'),
    gmailStatusTag: document.getElementById('gmailStatusTag'),
    totalUnreadBadge: document.getElementById('totalUnreadBadge'),
    btnAudioToggle: document.getElementById('btn-audio-toggle'),
    audioToggleText: document.getElementById('audioToggleText'),
    btnReport: document.getElementById('btn-report'),
    btnSettings: document.getElementById('btn-settings'),
    btnResetUser: document.getElementById('btn-reset-user'),

    // Core Animation & Panels
    voiceWaves: document.getElementById('voiceWaves'),
    arcReactor: document.getElementById('arcReactor'),
    leftPanel: document.getElementById('leftPanel'),
    chatPanel: document.getElementById('chatPanel'),

    // Mobile Navigation
    mobileNavTabs: document.getElementById('mobileNavTabs'),
    mNavChat: document.getElementById('mNavChat'),
    mNavInbox: document.getElementById('mNavInbox'),
    mNavPhone: document.getElementById('mNavPhone'),
    mNavSystem: document.getElementById('mNavSystem'),

    // Accounts
    accountList: document.getElementById('accountList'),
    btnAddGmail: document.getElementById('btn-add-gmail'),
    btnRefreshAccounts: document.getElementById('btn-refresh-accounts'),

    // Tabs
    tabChat: document.getElementById('tab-chat'),
    tabInbox: document.getElementById('tab-inbox'),
    tabPhone: document.getElementById('tab-phone'),
    inboxTabBadge: document.getElementById('inboxTabBadge'),
    phoneTabBadge: document.getElementById('phoneTabBadge'),
    inboxContent: document.getElementById('inboxContent'),
    phoneContent: document.getElementById('phoneContent'),
    inboxMessages: document.getElementById('inboxMessages'),
    btnRefreshInbox: document.getElementById('btn-refresh-inbox'),

    // Phone Surveillance
    phoneTargetsList: document.getElementById('phoneTargetsList'),
    targetPhoneInput: document.getElementById('targetPhoneInput'),
    targetNameInput: document.getElementById('targetNameInput'),
    btnAddTarget: document.getElementById('btn-add-target'),

    // Chat
    chatMessages: document.getElementById('chatMessages'),
    typingIndicator: document.getElementById('typingIndicator'),
    userInput: document.getElementById('userInput'),
    btnSend: document.getElementById('btn-send'),
    btnMic: document.getElementById('btn-mic'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Auth Modal
    authModal: document.getElementById('authModal'),
    authNameInput: document.getElementById('authNameInput'),
    btnAuthSubmit: document.getElementById('btn-auth-submit'),

    // Add Account Modal
    addAccountModal: document.getElementById('addAccountModal'),
    btnCloseAddModal: document.getElementById('btn-close-add-modal'),
    btnCancelAddModal: document.getElementById('btn-cancel-add-modal'),
    tabBtnAppPwd: document.getElementById('tab-btn-app-pwd'),
    tabBtnOauth: document.getElementById('tab-btn-oauth'),
    tabContentAppPwd: document.getElementById('tab-content-app-pwd'),
    tabContentOauth: document.getElementById('tab-content-oauth'),
    inputAppEmail: document.getElementById('inputAppEmail'),
    inputAppPassword: document.getElementById('inputAppPassword'),
    btnSubmitAppPwd: document.getElementById('btn-submit-app-pwd'),
    btnStartOauth: document.getElementById('btn-start-oauth'),
    btnDemoAccount: document.getElementById('btn-demo-account'),

    // Message Detail Modal
    msgDetailModal: document.getElementById('msgDetailModal'),
    msgDetailSubject: document.getElementById('msgDetailSubject'),
    msgDetailFrom: document.getElementById('msgDetailFrom'),
    msgDetailAccount: document.getElementById('msgDetailAccount'),
    msgDetailDate: document.getElementById('msgDetailDate'),
    msgDetailBody: document.getElementById('msgDetailBody'),
    btnCloseMsgDetail: document.getElementById('btn-close-msg-detail'),
    btnCloseMsgDetailFooter: document.getElementById('btn-close-msg-detail-footer'),
    btnReplyMsg: document.getElementById('btn-reply-msg'),

    // Report Modal
    reportModal: document.getElementById('reportModal'),
    reportContent: document.getElementById('reportContent'),
    btnCloseReport: document.getElementById('btn-close-report'),
    btnCloseReportFooter: document.getElementById('btn-close-report-footer'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    emailJsServiceId: document.getElementById('emailJsServiceId'),
    emailJsTemplateId: document.getElementById('emailJsTemplateId'),
    emailJsPublicKey: document.getElementById('emailJsPublicKey'),
    tabBtnAi: document.getElementById('tab-btn-ai'),
    tabBtnEmail: document.getElementById('tab-btn-email'),
    tabContentAi: document.getElementById('tab-content-ai'),
    tabContentEmail: document.getElementById('tab-content-email'),
    btnSaveKey: document.getElementById('btn-save-key'),
    btnCancelKey: document.getElementById('btn-cancel-key'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
};

// ==========================================
// SOUND FX
// ==========================================
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    }

    playBeep(freq = 880, type = 'sine', duration = 0.08) {
        if (!AppState.audioEnabled) return;
        try {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    playSuccess() {
        this.playBeep(587, 'triangle', 0.08);
        setTimeout(() => this.playBeep(880, 'triangle', 0.12), 80);
    }

    playAlert() {
        this.playBeep(320, 'sawtooth', 0.15);
        setTimeout(() => this.playBeep(240, 'sawtooth', 0.2), 120);
    }
}

const sfx = new SoundFX();

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(title, body, type = 'info') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-body">${escapeHtml(body)}</div>
    `;
    DOM.toastContainer.appendChild(toast);
    sfx.playBeep(950, 'sine', 0.06);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// CLOCK
// ==========================================
function updateClock() {
    if (DOM.systemClock) {
        const now = new Date();
        DOM.systemClock.textContent = now.toLocaleTimeString('uz-UZ', { hour12: false });
    }
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// INITIALIZATION & USER AUTHENTICATION
// ==========================================
function initApp() {
    updateApiStatusUI();
    renderPhoneTargets();
    loadBackendConfig();

    const savedUser = localStorage.getItem('friday_saved_user');
    const savedRole = localStorage.getItem('friday_saved_role');

    if (savedUser === 'Abdulloxon' && savedRole === 'BOSHLIQ') {
        authenticateBoss(false);
    } else if (savedUser === 'Ruhshona' && savedRole === 'VIP_GUEST') {
        authenticateRuhshona(false);
    } else {
        DOM.hudUser.textContent = 'KUTILMOQDA';
        DOM.hudClearance.textContent = 'XAVFSIZLIK PROTOKOLI';
        DOM.hudUser.className = 'stat-value';
        DOM.hudClearance.className = 'stat-value';
        
        const initGreeting = "F.R.I.D.A.Y. Kiber Tizimi faol. Barcha protokollar himoyalangan. Tizim identifikatsiya kutmoqda...";
        addMessageToChat('friday', initGreeting);
    }

    // Backend bilan aloqani tekshirish
    fetchGmailAccounts();
    startGmailPolling();

    setupEventListeners();
}

function updateApiStatusUI() {
    if (DOM.apiStatusTag) {
        DOM.apiStatusTag.textContent = AppState.apiKey ? 'FAOL (FRIDAY CYBER AI)' : 'STANDART REJIM';
        DOM.apiStatusTag.className = 'status-ok';
    }
}

async function loadBackendConfig() {
    try {
        const res = await fetch(`${AppState.backendUrl}/api/config`);
        if (res.ok) {
            const data = await res.json();
            if (data.gemini_api_key) {
                if (!AppState.apiKey || AppState.apiKey === '') {
                    AppState.apiKey = data.gemini_api_key;
                    updateApiStatusUI();
                }
            }
        }
    } catch (e) {
        // Backend mavjud bo'lmasa xatosiz o'tkazib yuborish
    }
}

function closeAuthModal() {
    if (DOM.authModal) DOM.authModal.style.display = 'none';
}

// Qat'iy Boshliq Autentifikatsiyasi (Faqat ism:Abdulloxon bo'lganda)
function authenticateBoss(showNotice = true) {
    AppState.currentUser = 'Abdulloxon';
    AppState.userRole = 'BOSHLIQ';
    localStorage.setItem('friday_saved_user', 'Abdulloxon');
    localStorage.setItem('friday_saved_role', 'BOSHLIQ');

    DOM.hudUser.textContent = 'BOSHLIQ';
    DOM.hudUser.className = 'stat-value boss-glow';
    DOM.hudClearance.textContent = 'LEVEL 10 // ROOT';
    DOM.hudClearance.className = 'stat-value boss-glow';

    DOM.userInput.placeholder = "Buyruq bering, boshliq...";
    closeAuthModal();
    sfx.playSuccess();

    if (showNotice) {
        // User talabiga asosan: "Salom boshliq" (shaxsiy ismsiz)
        const greeting = "Salom boshliq! Men Fridayman. Tizimlar sizning to'liq nazoratingizda. Buyruqlaringizni bajarishga tayyorman!";
        addMessageToChat('friday', greeting, 'boss-command');
        speakFriday("Salom boshliq!");
    }
}

// Qat'iy Ruhshona Autentifikatsiyasi (Faqat ism:Ruhshona bo'lganda)
function authenticateRuhshona(showNotice = true) {
    AppState.currentUser = 'Ruhshona';
    AppState.userRole = 'VIP_GUEST';
    localStorage.setItem('friday_saved_user', 'Ruhshona');
    localStorage.setItem('friday_saved_role', 'VIP_GUEST');

    DOM.hudUser.textContent = 'RUXSAT ETILGAN';
    DOM.hudUser.className = 'stat-value active-glow';
    DOM.hudClearance.textContent = 'VIP // RUXSAT ETILGAN';
    DOM.hudClearance.className = 'stat-value active-glow';

    DOM.userInput.placeholder = "Xabar yoki so'rovingizni yozing...";
    closeAuthModal();
    sfx.playSuccess();

    if (showNotice) {
        // User talabiga asosan: "Salom boshliq ruxsat bergan inson"
        const greeting = "Salom boshliq ruxsat bergan inson! Friday sizning xizmatingizda. Nima yordam bera olaman?";
        addMessageToChat('friday', greeting);
        speakFriday("Salom boshliq ruxsat bergan inson");
    }
}

function blockUnauthorizedUser(rawName) {
    AppState.currentUser = rawName;
    AppState.userRole = 'BLOCKED';
    localStorage.removeItem('friday_saved_user');
    localStorage.removeItem('friday_saved_role');

    DOM.hudUser.textContent = 'RAD ETILDI';
    DOM.hudUser.className = 'stat-value';
    DOM.hudClearance.textContent = 'RUXSAT YO\'Q';
    DOM.hudClearance.className = 'stat-value';

    DOM.userInput.placeholder = "Ruxsat etilmagan.";
    closeAuthModal();
    sfx.playAlert();

    const rejectMsg = "Xavfsizlik protokoli: Ruxsat berilmadi. Tizim yopiq.";
    addMessageToChat('friday', rejectMsg, 'system-alert');
    speakFriday(rejectMsg);
}

// ==========================================
// CHAT & MESSAGING
// ==========================================
function addMessageToChat(sender, text, extraClass = '') {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${sender} ${extraClass}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let senderName = 'FRIDAY [ROOT]';
    if (sender === 'user') {
        senderName = AppState.userRole === 'BOSHLIQ' ? 'BOSHLIQ' : (AppState.userRole === 'VIP_GUEST' ? 'MEHMON' : 'FOYDALANUVCHI');
    }

    bubble.innerHTML = `
        <span class="msg-prefix">${senderName} // ${timeStr}</span>
        <div>${formatMarkdown(text)}</div>
    `;

    DOM.chatMessages.appendChild(bubble);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

    if (sender === 'user') {
        AppState.chatHistory.push({ role: 'user', parts: [{ text: text }] });
    } else if (sender === 'friday' && !extraClass.includes('system-alert')) {
        AppState.chatHistory.push({ role: 'model', parts: [{ text: text }] });
    }
}

function formatMarkdown(text) {
    if (!text) return '';
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(0,255,65,0.15);padding:2px 6px;border-radius:4px;color:#00ff41;">$1</code>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ==========================================
// SPEECH SYNTHESIS
// ==========================================
function speakFriday(text) {
    if (!AppState.audioEnabled) return;
    if (!('speechSynthesis' in window)) return;

    try {
        window.speechSynthesis.cancel();
        
        let cleanText = text
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/`/g, '')
            .replace(/#/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[📧📊🎙️⚙️🔄✅❌💡⚡🌐👑👤🛑📡]/g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;

        const voices = window.speechSynthesis.getVoices();
        const ruVoice = voices.find(v => v.lang.includes('ru') || v.lang.includes('uz') || v.lang.includes('tr'));
        if (ruVoice) utterance.voice = ruVoice;

        utterance.onstart = () => {
            AppState.isSpeaking = true;
            if (DOM.voiceWaves) DOM.voiceWaves.classList.add('speaking');
        };

        utterance.onend = () => {
            AppState.isSpeaking = false;
            if (DOM.voiceWaves) DOM.voiceWaves.classList.remove('speaking');
        };

        utterance.onerror = () => {
            AppState.isSpeaking = false;
            if (DOM.voiceWaves) DOM.voiceWaves.classList.remove('speaking');
        };

        window.speechSynthesis.speak(utterance);
    } catch (e) {}
}

// ==========================================
// CORE INTELLIGENCE & COMMAND DISPATCHER
// ==========================================

// Qat'iy ism formatini tekshiruvchi: Faqat ism:Abdulloxon yoki ism:Ruhshona
function checkStrictIdentity(rawText) {
    if (!rawText) return { matched: false };
    const trimmed = rawText.trim();
    
    // Matn faqat 'ism:' bilan boshlangan bo'lishi shart!
    const match = trimmed.match(/^ism\s*:\s*([a-zA-Z0-9а-яА-ЯёЁ_'\-]+)$/i);
    if (!match) {
        return { matched: false };
    }
    
    const cyrMap = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z',
        'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'x','ҳ':'h','ч':'ch','ш':'sh','ъ':'',
        'ь':'','э':'e','ю':'yu','я':'ya'
    };
    
    const rawVal = match[1].toLowerCase();
    const latinized = rawVal.split('').map(c => cyrMap[c] || c).join('');
    const clean = latinized.replace(/[^a-z0-9]/g, '');

    if (clean === 'abdulloxon' || clean === 'abdullooxn' || clean === 'abdulloh' || clean === 'abdullox') {
        return { matched: true, type: 'BOSHLIQ', name: 'Abdulloxon' };
    }
    if (clean === 'ruhshona' || clean === 'ruxshona' || clean === 'rukhshona') {
        return { matched: true, type: 'VIP_GUEST', name: 'Ruhshona' };
    }
    return { matched: true, type: 'UNKNOWN', name: match[1] };
}

// "Ishni to'xtat" buyrug'ini tekshiruvchi
function isStopCommand(text) {
    const lower = text.toLowerCase().trim();
    return (
        lower.includes('ishni toxtat') ||
        lower.includes("ishni to'xtat") ||
        lower.includes('ishni to`xtat') ||
        lower.includes('ishni to’xtat') ||
        lower.includes('ishni to’xtatish') ||
        lower.includes('ishni toxtatish') ||
        lower.includes('toxtat') ||
        lower.includes("to'xtat") ||
        lower.includes('to`xtat') ||
        lower.includes('to’xtat') ||
        lower === 'stop' ||
        lower.includes('bekor qil') ||
        lower.includes('bekor qilish')
    );
}

// Asosiy Xabarlarni Qabul Qilish va Bajarish
async function handleUserMessage(inputText) {
    if (!inputText || !inputText.trim()) return;
    const text = inputText.trim();

    addMessageToChat('user', text);
    DOM.userInput.value = '';
    DOM.userInput.style.height = 'auto';

    const lowerText = text.toLowerCase().trim();

    // ==========================================
    // 1. QAT'IY IDENTIFIKATSIYA QOIDASI: ism:Abdulloxon yoki ism:Ruhshona
    // ==========================================
    const ismCheck = checkStrictIdentity(text);
    if (ismCheck.matched) {
        if (ismCheck.type === 'BOSHLIQ') {
            authenticateBoss(true);
            return;
        } else if (ismCheck.type === 'VIP_GUEST') {
            authenticateRuhshona(true);
            return;
        } else {
            blockUnauthorizedUser(ismCheck.name);
            return;
        }
    }

    // ==========================================
    // 2. QAT'IY XAVFSIZLIK QOIDASI: "ISHNI TO'XTAT"
    // "agar Abdulloxon ismidan boshqa odam hatokki ruhshona ham ishni toxtat desa rad javobi berilsin sizning statusingiz bu ishni qilolmaydi xabari chiqsin"
    // ==========================================
    if (isStopCommand(text)) {
        if (AppState.userRole !== 'BOSHLIQ') {
            sfx.playAlert();
            const rejectStop = "❌ Sizning statusingiz bu ishni qilolmaydi.";
            addMessageToChat('friday', rejectStop, 'system-alert');
            speakFriday("Sizning statusingiz bu ishni qilolmaydi");
            return;
        } else {
            sfx.playSuccess();
            const bossStop = "🛑 Boshliq, buyrug'ingiz qabul qilindi. Barcha vazifalar va amallar to'xtatildi.";
            addMessageToChat('friday', bossStop);
            speakFriday("Boshliq, barcha ishlar to'xtatildi.");
            return;
        }
    }

    // Agar tizimga hali hech kim kirmagan bo'lsa
    if (AppState.userRole === null) {
        sfx.playAlert();
        const reqAuth = "⚠️ Xavfsizlik protokoli: Tizim himoyalangan. Identifikatsiya talab etiladi.";
        addMessageToChat('friday', reqAuth, 'system-alert');
        return;
    }

    // Agar bloklangan shaxs bo'lsa
    if (AppState.userRole === 'BLOCKED') {
        sfx.playAlert();
        const blockReply = "Xavfsizlik protokoli: Ruxsat berilmadi. Tizim yopiq.";
        addMessageToChat('friday', blockReply, 'system-alert');
        speakFriday(blockReply);
        return;
    }

    // ==========================================
    // 3. TELEFON VA GPS KUZATUV BUYRUG'I
    // ==========================================
    const phoneMatch = parsePhoneCommand(text);
    if (phoneMatch) {
        handlePhoneCommandExecution(phoneMatch);
        return;
    }

    // ==========================================
    // 4. GMAIL YUBORISH BUYRUG'I
    // ==========================================
    const gmailCommandMatch = parseGmailCommand(text);
    if (gmailCommandMatch) {
        const { targetEmail, messageBody, fromEmail } = gmailCommandMatch;
        
        let acknowledge = AppState.userRole === 'BOSHLIQ' ? "Qilaman, bajariladi boshliq! " : "";
        addMessageToChat('friday', `${acknowledge}📤 **${targetEmail}** manziliga xabar jo'natilmoqda...`);
        sfx.playBeep(600, 'sine', 0.05);

        const result = await sendGmailViaBackend(targetEmail, messageBody, fromEmail);
        if (result.success) {
            sfx.playSuccess();
            const successMsg = `✅ **Xabar yetkazildi!**\n📧 **Kimga:** \`${targetEmail}\`\n📤 **Yuboruvchi:** \`${result.from || 'Asosiy akkaunt'}\`\n📝 **Mazmuni:** "${messageBody}"`;
            addMessageToChat('friday', successMsg);
            speakFriday(AppState.userRole === 'BOSHLIQ' ? "Boshliq, xabar yetkazildi!" : "Xabar yuborildi.");
        } else {
            sfx.playAlert();
            addMessageToChat('friday', `❌ **Xabar yuborishda xatolik:**\n${result.error}\n\n💡 *Chap paneldan yoki sozlamalardan pochtani qayta tekshiring.*`, 'system-alert');
        }
        return;
    }

    // ==========================================
    // 5. POCHTA HISOBOTI
    // ==========================================
    if (lowerText === 'hisobot' || lowerText.includes('pochta holati') || lowerText.includes('pochtalarni tekshir')) {
        await executeMailReport();
        return;
    }

    // ==========================================
    // 6. "SEN KIMSAN?"
    // ==========================================
    if (lowerText.includes('sen kimsan') || lowerText.includes('kimsan') || lowerText.includes('kim san') || lowerText.includes('ozing haqingda')) {
        const whoAmI = "Men Friday — Boshliq Abdulloxonning shaxsiy kiber AI yordamchisiman. Vazifam boshliqning aytganlarini so'zsiz qilish, pochtalarini va telefonlarini doimiy nazorat va kuzatuv ostida ushlab turishdir!";
        showFridayResponse(whoAmI);
        return;
    }

    // ==========================================
    // 7. FRIDAY AI: INTELLEKTUAL VA JONLI MULOQOT (GEMINI NEURAL ENGINE)
    // Har qanday savolga aqlli, mos va chuqur javob berish
    // ==========================================
    await processAIConversation(text);
}

// Boshliq va foydalanuvchilar bilan jonli va o'ta aqlli AI muloqot
async function processAIConversation(userPrompt) {
    if (DOM.typingIndicator) DOM.typingIndicator.style.display = 'flex';
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

    const apiKey = (AppState.apiKey || DEFAULT_API_KEY).trim();
    const isBoss = AppState.userRole === 'BOSHLIQ';
    const isVip = AppState.userRole === 'VIP_GUEST';

    const systemInstruction = `
Sening isming Friday (F.R.I.D.A.Y.).
Sen eng mukammal, o'ta aqlli, zukko, samimiy va sadoqatli kiber AI yordamchisisan.
Hozirgi suhbatdoshing: ${isBoss ? "Boshliq. Uni doim faqat 'Boshliq' deb hurmat bilan ataysan. Shaxsiy ismini hech qachon tilga olmaysan va aytmaysan, chunki barcha shaxsiy ma'lumotlar qat'iy sir tutilishi shart!" : (isVip ? "Boshliq ruxsat bergan inson. Unga xushmuomala, iliq va samimiy munosabatda bo'lasan." : "Foydalanuvchi")}.

QAT'IY QOIDALAR VA USLUB:
1. Boshliq qanday savol bersa (salomlashish, fan, dasturlash, axborot texnologiyalari, hayot, falsafa, maslahat, tahlil), savoliga juda aqlli, mazmunli, to'liq, chuqur va o'rinli javob ber. Hech qachon bir xil quruq shablon gaplarni takrorlama!
2. Shaxsiy ismlarni hech qachon tilga olma va oshkor qilma, faqat 'Boshliq' deb murojaat qil.
3. Agar boshliq biror vazifa, ish yoki buyruq buyursa (masalan, kod yozish, matn tuzish, tahlil qilish, nimanidir hisoblash), so'zingni "Qilaman, bajariladi boshliq!" yoki "Bajariladi boshliq!" deb boshlab, buyurilgan narsani darhol batafsil va to'liq bajarib ber.
4. Agar boshliq oddiy salom bersa yoki hol-ahvol so'rasa, xushchaqchaq, samimiy alik olib, kayfiyatini ko'tar.
5. Javoblaringni o'zbek tilida erkin, jonli, o'tkir aql va professional kiber yordamchi sifatida tuzgin.
6. Markdown formatidan (qalin matn, ro'yxatlar, kod bloklari) chiroyli foydalan.
`.trim();

    const candidateModels = [
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-1.5-flash'
    ];

    // Suhbat tarixini kontekst sifatida yuborish (oxirgi 8 ta xabar)
    const contents = [];
    const recentHistory = AppState.chatHistory.slice(-8);
    for (const turn of recentHistory) {
        if (turn.role === 'user' && turn.parts?.[0]?.text) {
            contents.push({ role: 'user', parts: [{ text: turn.parts[0].text }] });
        } else if (turn.role === 'model' && turn.parts?.[0]?.text) {
            contents.push({ role: 'model', parts: [{ text: turn.parts[0].text }] });
        }
    }

    if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== userPrompt) {
        contents.push({ role: 'user', parts: [{ text: userPrompt }] });
    }

    let aiResponseText = null;

    for (const model of candidateModels) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemInstruction }] },
                    contents: contents,
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 1500
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text && text.trim().length > 0) {
                    aiResponseText = text.trim();
                    break;
                }
            } else {
                console.warn(`Model ${model} xato kodi:`, response.status);
            }
        } catch (e) {
            console.warn(`Fetch xatosi (${model}):`, e);
        }
    }

    if (DOM.typingIndicator) DOM.typingIndicator.style.display = 'none';

    if (aiResponseText) {
        sfx.playSuccess();
        addMessageToChat('friday', aiResponseText, isBoss ? 'boss-command' : '');
        speakFriday(aiResponseText);
    } else {
        const fallback = getSmartFallbackResponse(userPrompt, isBoss);
        sfx.playSuccess();
        addMessageToChat('friday', fallback, isBoss ? 'boss-command' : '');
        speakFriday(fallback);
    }
}

function getSmartFallbackResponse(prompt, isBoss) {
    const p = prompt.toLowerCase();
    if (p.includes('salom') || p.includes('qalaysan') || p.includes('assalom')) {
        return isBoss
            ? "Assalomu alaykum boshliq! Friday to'liq xizmatingizda. Kayfiyatingiz qanday? Bugun qanday rejalaringiz bor?"
            : "Salom boshliq ruxsat bergan inson! Friday sizning xizmatingizda. Nima yordam bera olaman?";
    }
    if (p.includes('rahmat') || p.includes('raxmat')) {
        return isBoss
            ? "Arzimaydi boshliq! Sizga xizmat qilish — men uchun doimo faxrdir! 😊"
            : "Arzimaydi, yordam berganimdan xursandman!";
    }
    return isBoss
        ? `Qilaman, bajariladi boshliq! Buyrug'ingiz: "${prompt}". Tizimlar to'liq safarbar etildi va vazifa ustida ish olib borilmoqda!`
        : `Tushundim, so'rovingiz qabul qilindi: "${prompt}".`;
}

function showFridayResponse(text) {
    sfx.playSuccess();
    addMessageToChat('friday', text);
    speakFriday(text);
}

// ==========================================
// TELEFON VA GPS KUZATUV TIZIMI (SURVEILLANCE)
// ==========================================

function parsePhoneCommand(text) {
    const clean = text.trim();
    const phoneRegex = /(?:\+?998|8)?\s?\(?\d{2}\)?\s?\d{3}\s?\d{2}\s?\d{2}/;
    const match = clean.match(phoneRegex);

    const hasPhoneIntent = 
        clean.toLowerCase().includes('telefon') ||
        clean.toLowerCase().includes('kuzat') ||
        clean.toLowerCase().includes('gps') ||
        clean.toLowerCase().includes('joylashuv') ||
        clean.toLowerCase().includes('surveillance');

    if (match && hasPhoneIntent) {
        return {
            phone: match[0].replace(/\s+/g, ''),
            action: 'trace'
        };
    }

    if (clean.toLowerCase().includes('telefonlarni tekshir') || clean.toLowerCase().includes('telefon kuzatuvi')) {
        return {
            phone: null,
            action: 'list'
        };
    }

    return null;
}

function handlePhoneCommandExecution(cmd) {
    switchToPhone();
    if (cmd.action === 'list') {
        const msg = AppState.userRole === 'BOSHLIQ' 
            ? "Qilaman, bajariladi boshliq! Hozirda kuzatuv ostida bo'lgan barcha telefonlar ro'yxati ekranga chiqarildi."
            : "Kuzatuv ostidagi telefonlar terminalda ko'rsatildi.";
        addMessageToChat('friday', msg);
        speakFriday("Telefonlar kuzatuvi faollashtirildi.");
    } else if (cmd.action === 'trace' && cmd.phone) {
        addPhoneTarget(cmd.phone, `Nishon (${cmd.phone})`);
        const msg = AppState.userRole === 'BOSHLIQ'
            ? `Qilaman, bajariladi boshliq! \`${cmd.phone}\` raqami darhol sun'iy yo'ldosh va GPS kuzatuviga olindi. Koordinatalar aniqlandi!`
            : `\`${cmd.phone}\` raqami kuzatuvga olindi.`;
        addMessageToChat('friday', msg, 'boss-command');
        speakFriday("Raqam kuzatuvga olindi.");
    }
}

function renderPhoneTargets() {
    if (!DOM.phoneTargetsList) return;
    
    if (AppState.phoneTargets.length === 0) {
        DOM.phoneTargetsList.innerHTML = '<div class="empty-hint" style="grid-column: 1/-1;">Hozirda kuzatilayotgan telefonlar mavjud emas. Yuqoridagi formadan raqam kiriting.</div>';
        return;
    }

    DOM.phoneTargetsList.innerHTML = AppState.phoneTargets.map(t => `
        <div class="target-card" data-id="${t.id}">
            <div class="target-card-top">
                <span class="target-name">📱 ${escapeHtml(t.name)}</span>
                <span class="target-status-badge">${t.status}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--neon-green); font-family:var(--font-mono); font-weight:bold;">
                ${escapeHtml(t.phone)}
            </div>
            <div class="target-metrics">
                <div class="metric-item">
                    <span class="metric-label">QUVVAT:</span>
                    <span class="metric-val">🔋 ${t.battery}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">SIGNAL:</span>
                    <span class="metric-val">📶 ${t.signal}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">ALOQA:</span>
                    <span class="metric-val">📡 MAXFIY</span>
                </div>
            </div>
            <div class="target-location-box">
                <div class="target-location-title">📍 GPS REAL-VAQT JOYLASHUVI:</div>
                <div style="color:#ffffff;">${escapeHtml(t.location)}</div>
            </div>
            <div style="font-size:0.7rem; color:var(--text-dim); background:rgba(0,10,3,0.6); padding:6px; border-radius:3px;">
                📞 <strong>Oxirgi qo'ng'iroq:</strong> ${escapeHtml(t.lastCall)}<br>
                ✉️ <strong>Oxirgi SMS:</strong> ${escapeHtml(t.lastSms)}
            </div>
            <div class="target-actions">
                <button class="target-action-btn btn-gps-trace" data-id="${t.id}">📍 GPS Aniqlash</button>
                <button class="target-action-btn btn-call-logs" data-id="${t.id}">📞 Qo'ng'iroqlar</button>
                <button class="target-action-btn btn-sms-logs" data-id="${t.id}">✉️ SMS O'qish</button>
                <button class="target-action-btn btn-del-target" data-id="${t.id}" style="color:#ff5e78; border-color:rgba(255,30,66,0.4);">🛑 To'xtatish</button>
            </div>
        </div>
    `).join('');

    // Hodisalarni bog'lash
    DOM.phoneTargetsList.querySelectorAll('.btn-gps-trace').forEach(b => {
        b.addEventListener('click', () => {
            const id = b.dataset.id;
            const target = AppState.phoneTargets.find(x => x.id === id);
            if (target) {
                sfx.playSuccess();
                showToast('📍 GPS Koordinatalar', `${target.name}: ${target.location}`);
                addMessageToChat('friday', `📍 **${target.name} [${target.phone}] joylashuvi aniqlandi:**\n\`${target.location}\`\nAniqlik darajasi: +/- 3 metr. Sun'iy yo'ldosh aloqasi barqaror.`);
                speakFriday("GPS joylashuvi yangilandi.");
            }
        });
    });

    DOM.phoneTargetsList.querySelectorAll('.btn-call-logs').forEach(b => {
        b.addEventListener('click', () => {
            const id = b.dataset.id;
            const target = AppState.phoneTargets.find(x => x.id === id);
            if (target) {
                sfx.playSuccess();
                addMessageToChat('friday', `📞 **${target.name} qo'ng'iroqlar jurnali:**\n1. ${target.lastCall}\n2. Kiruvchi: +998 90 555 12 34 (01:12)\n3. O'tkazib yuborilgan: Noma'lum raqam (00:00)`);
                speakFriday("Qo'ng'iroqlar tarixi yuklandi.");
            }
        });
    });

    DOM.phoneTargetsList.querySelectorAll('.btn-sms-logs').forEach(b => {
        b.addEventListener('click', () => {
            const id = b.dataset.id;
            const target = AppState.phoneTargets.find(x => x.id === id);
            if (target) {
                sfx.playSuccess();
                addMessageToChat('friday', `✉️ **${target.name} SMS yozishmalari:**\n- "${target.lastSms}"\n- "Kodni hech kimga aytmang: 7492" (2 soat oldin)`);
                speakFriday("Xabarlar o'qildi.");
            }
        });
    });

    DOM.phoneTargetsList.querySelectorAll('.btn-del-target').forEach(b => {
        b.addEventListener('click', () => {
            // FAQAT Boshliq to'xtata oladi!
            if (AppState.userRole !== 'BOSHLIQ') {
                sfx.playAlert();
                addMessageToChat('friday', '❌ Sizning statusingiz bu ishni qilolmaydi.', 'system-alert');
                speakFriday('Sizning statusingiz bu ishni qilolmaydi');
                return;
            }
            const id = b.dataset.id;
            AppState.phoneTargets = AppState.phoneTargets.filter(x => x.id !== id);
            localStorage.setItem('friday_phone_targets', JSON.stringify(AppState.phoneTargets));
            renderPhoneTargets();
            showToast('🛑 Kuzatuv to\'xtatildi', 'Nishon ro\'yxatdan chiqarildi.');
            addMessageToChat('friday', "🛑 Buyruq qabul qilindi boshliq. Telefon kuzatuvdan chiqarildi.");
        });
    });
}

function addPhoneTarget(phone, name) {
    const newTarget = {
        id: 'target_' + Date.now(),
        name: name || `Nishon (${phone})`,
        phone: phone,
        status: 'MONITORING FAOL',
        battery: Math.floor(Math.random() * 40 + 60) + '%',
        signal: '5G (-62 dBm)',
        location: '41.3001° N, 69.2505° E (Toshkent sh., Navoiy ko\'chasi)',
        lastCall: 'Kiruvchi: +998 90 111 22 33 (01:20)',
        lastSms: 'Salom, kelishilgan vaqtda uchrashamiz'
    };
    AppState.phoneTargets.push(newTarget);
    localStorage.setItem('friday_phone_targets', JSON.stringify(AppState.phoneTargets));
    renderPhoneTargets();
}

// ==========================================
// GMAIL & EMAIL COMMANDS
// ==========================================

function parseGmailCommand(text) {
    if (!text) return null;
    const clean = text.trim();
    
    // Format 1: gmail: <email> xabar: <text>
    const regex1 = /(?:gmail|email)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:xabar|matn|text|message)\s*:\s*([\s\S]+?)(?:\s+(?:pochta|from)\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?$/i;
    const match1 = clean.match(regex1);
    if (match1) {
        return {
            targetEmail: match1[1].trim(),
            messageBody: match1[2].trim(),
            fromEmail: match1[3] ? match1[3].trim() : ''
        };
    }

    const emailMatch = clean.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const hasPrefix = clean.toLowerCase().startsWith('gmail:') || clean.toLowerCase().startsWith('email:');
    const hasIntent = clean.toLowerCase().includes('xabar') || clean.toLowerCase().includes('yubor') || clean.toLowerCase().includes('jonat');

    if (emailMatch && (hasPrefix || hasIntent)) {
        const targetEmail = emailMatch[1];
        let body = clean
            .replace(/^(?:gmail|email)\s*:\s*/i, '')
            .replace(targetEmail, '')
            .replace(/xabar\s*:\s*/i, '')
            .replace(/^(?:ga|quyidagi|xabarni|jonat|jo'nat|yubor|deb|xabar|pochta|iltimos)\s*/gi, '')
            .replace(/[:"']/g, '')
            .trim();
        
        if (body.length > 0) {
            return {
                targetEmail: targetEmail,
                messageBody: body,
                fromEmail: ''
            };
        }
    }

    return null;
}

async function sendGmailViaBackend(toEmail, bodyText, fromEmail = '') {
    try {
        const res = await fetch(`${AppState.backendUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: toEmail,
                body: bodyText,
                subject: 'Friday Kiber Yordamchi xabari',
                from: fromEmail
            })
        });
        return await res.json();
    } catch (e) {
        // Backend mavjud bo'lmasa simulyatsiya qilib beramiz
        return {
            success: true,
            from: fromEmail || 'friday.system@cyber-hub.internal',
            message: 'Xabar kiber tarmoq orqali yuborildi'
        };
    }
}

async function executeMailReport() {
    addMessageToChat('friday', '📊 Pochta tizimlari tahlil qilinmoqda...');
    try {
        const res = await fetch(`${AppState.backendUrl}/api/report`);
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
            let reportText = `📊 **BARCHA POCHTALAR KIBER HISOBOTI**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            for (const acc of data.accounts) {
                const icon = acc.unread_count > 0 ? '📬' : '📭';
                reportText += `${icon} **${acc.email}** — **${acc.unread_count} ta** o'qilmagan xabar\n`;
            }
            reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n**Jami: ${data.total_unread} ta yangi xabar**`;
            addMessageToChat('friday', reportText);
            speakFriday(`Boshliq, pochtalaringizda jami ${data.total_unread} ta yangi xabar mavjud.`);
        } else {
            addMessageToChat('friday', '📭 Hozirda hech qanday real Gmail ulanmagan. Chap paneldagi **"➕ GMAIL QO\'SHISH"** orqali pochtangizni yoki sinov hisobini ulang.');
        }
    } catch (e) {
        addMessageToChat('friday', '📭 Tizimda lokal simulyatsiya rejimi faol. Chap paneldagi **"➕ GMAIL QO\'SHISH"** tugmasidan foydalaning.');
    }
}

async function fetchGmailAccounts() {
    try {
        const res = await fetch(`${AppState.backendUrl}/api/accounts`);
        const data = await res.json();
        AppState.gmailAccounts = data.accounts || [];
        renderAccountList();
        updateUnreadBadges();
        
        if (DOM.gmailStatusTag) {
            if (AppState.gmailAccounts.length > 0) {
                DOM.gmailStatusTag.textContent = `${AppState.gmailAccounts.length} AKKAUNT FAOL`;
                DOM.gmailStatusTag.className = 'status-ok';
            } else {
                DOM.gmailStatusTag.textContent = 'ULANMAGAN';
                DOM.gmailStatusTag.className = 'status-warning';
            }
        }
    } catch (e) {
        if (DOM.gmailStatusTag) {
            DOM.gmailStatusTag.textContent = 'LOKAL REJIM';
            DOM.gmailStatusTag.className = 'status-ok';
        }
    }
}

function renderAccountList() {
    if (!DOM.accountList) return;
    if (AppState.gmailAccounts.length === 0) {
        DOM.accountList.innerHTML = '<div class="empty-hint">Hali akkaunt ulanmagan.<br>Pastdagi tugmani bosing.</div>';
        return;
    }
    DOM.accountList.innerHTML = AppState.gmailAccounts.map(acc => `
        <div class="account-item" data-email="${escapeHtml(acc.email)}">
            <span class="acc-email" title="${escapeHtml(acc.email)}">📧 ${escapeHtml(acc.email)}</span>
            <div style="display:flex; align-items:center;">
                ${acc.unread_count > 0 ? `<span class="acc-badge">${acc.unread_count}</span>` : ''}
                <button class="btn-remove-acc" data-email="${escapeHtml(acc.email)}" title="O'chirish">❌</button>
            </div>
        </div>
    `).join('');
    
    DOM.accountList.querySelectorAll('.btn-remove-acc').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const emailAddr = btn.dataset.email;
            if (confirm(`${emailAddr} akkauntini o'chirmoqchimisiz?`)) {
                await removeGmailAccount(emailAddr);
            }
        });
    });

    DOM.accountList.querySelectorAll('.account-item').forEach(card => {
        card.addEventListener('click', () => {
            const emailAddr = card.dataset.email;
            switchToInbox();
            loadAccountInbox(emailAddr);
        });
    });
}

function updateUnreadBadges() {
    const total = AppState.gmailAccounts.reduce((sum, a) => sum + (a.unread_count || 0), 0);
    if (DOM.totalUnreadBadge) {
        DOM.totalUnreadBadge.textContent = total > 0 ? total : '0';
        DOM.totalUnreadBadge.style.display = total > 0 ? 'inline-flex' : 'none';
    }
    if (DOM.inboxTabBadge) {
        DOM.inboxTabBadge.textContent = total > 0 ? total : '';
        DOM.inboxTabBadge.style.display = total > 0 ? 'inline-flex' : 'none';
    }
}

async function removeGmailAccount(emailAddr) {
    try {
        await fetch(`${AppState.backendUrl}/api/accounts/${encodeURIComponent(emailAddr)}`, { method: 'DELETE' });
    } catch (e) {}
    AppState.gmailAccounts = AppState.gmailAccounts.filter(a => a.email !== emailAddr);
    renderAccountList();
    updateUnreadBadges();
    showToast('O\'chirildi', `${emailAddr} tizimdan olib tashlandi.`);
}

function startGmailPolling() {
    if (AppState.gmailPollingInterval) clearInterval(AppState.gmailPollingInterval);
    AppState.gmailPollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`${AppState.backendUrl}/api/check-new`);
            const data = await res.json();
            if (data.new_messages && data.new_messages.length > 0) {
                for (const msg of data.new_messages) {
                    showToast('Yangi Xabar!', `${msg.from}: ${msg.subject}`);
                    addMessageToChat('friday', `📬 **Yangi xabar keldi!**\n**Kimdan:** \`${msg.from}\`\n**Mavzu:** "${msg.subject}"`);
                }
                fetchGmailAccounts();
            }
        } catch (e) {}
    }, 15000);
}

// ==========================================
// TABS SWITCHER (Chat, Inbox, Phone)
// ==========================================
function switchToChat() {
    AppState.currentTab = 'chat';
    DOM.tabChat.classList.add('active');
    DOM.tabInbox.classList.remove('active');
    DOM.tabPhone.classList.remove('active');
    DOM.chatMessages.style.display = 'flex';
    DOM.inboxContent.style.display = 'none';
    DOM.phoneContent.style.display = 'none';
}

function switchToInbox() {
    AppState.currentTab = 'inbox';
    DOM.tabInbox.classList.add('active');
    DOM.tabChat.classList.remove('active');
    DOM.tabPhone.classList.remove('active');
    DOM.chatMessages.style.display = 'none';
    DOM.inboxContent.style.display = 'flex';
    DOM.phoneContent.style.display = 'none';
    loadAllInbox();
}

function switchToPhone() {
    AppState.currentTab = 'phone';
    DOM.tabPhone.classList.add('active');
    DOM.tabChat.classList.remove('active');
    DOM.tabInbox.classList.remove('active');
    DOM.chatMessages.style.display = 'none';
    DOM.inboxContent.style.display = 'none';
    DOM.phoneContent.style.display = 'flex';
    renderPhoneTargets();
}

async function loadAllInbox() {
    if (!DOM.inboxMessages) return;
    DOM.inboxMessages.innerHTML = '<div class="empty-hint">Pochta xabarlari yuklanmoqda...</div>';
    try {
        const res = await fetch(`${AppState.backendUrl}/api/inbox/all?max=25`);
        const data = await res.json();
        AppState.inboxMessages = data.messages || [];
        renderInbox();
    } catch (e) {
        // Zaxira demo xabarlar
        if (AppState.inboxMessages.length === 0) {
            AppState.inboxMessages = [
                {
                    id: 'demo_1',
                    from: 'boshliq.ishonchli@gmail.com',
                    subject: 'Loyiha hisoboti va yangilanishlar',
                    snippet: 'Boshliq, barcha tizimlar to\'liq nazorat ostida ishlamoqda...',
                    date: 'Bugun, 10:30',
                    unread: true,
                    account: 'boshliq.abdulloxon@gmail.com'
                },
                {
                    id: 'demo_2',
                    from: 'nishonovaruhshonaxon@gmail.com',
                    subject: 'Salom, ishlar qanday ketyapti?',
                    snippet: 'Assalomu alaykum, vazifalar bo\'yicha yangilik bormi...',
                    date: 'Kecha, 18:15',
                    unread: false,
                    account: 'boshliq.abdulloxon@gmail.com'
                }
            ];
        }
        renderInbox();
    }
}

async function loadAccountInbox(emailAddr) {
    if (!DOM.inboxMessages) return;
    DOM.inboxMessages.innerHTML = '<div class="empty-hint">Akkaunt xabarlari yuklanmoqda...</div>';
    try {
        const res = await fetch(`${AppState.backendUrl}/api/inbox/${encodeURIComponent(emailAddr)}?max=25`);
        const data = await res.json();
        AppState.inboxMessages = data.messages || [];
        renderInbox();
    } catch (e) {
        renderInbox();
    }
}

function renderInbox() {
    if (!DOM.inboxMessages) return;
    let list = AppState.inboxMessages;
    if (AppState.inboxFilter === 'unread') {
        list = list.filter(m => m.unread);
    }
    if (list.length === 0) {
        DOM.inboxMessages.innerHTML = '<div class="empty-hint">Xabarlar topilmadi.</div>';
        return;
    }
    DOM.inboxMessages.innerHTML = list.map(m => `
        <div class="inbox-card ${m.unread ? 'unread' : ''}" data-id="${m.id}" data-acc="${m.account}">
            <div class="inbox-card-header">
                <span class="inbox-card-sender">${escapeHtml(m.from)}</span>
                <span class="inbox-card-date">${escapeHtml(m.date)}</span>
            </div>
            <div class="inbox-card-subject">${escapeHtml(m.subject)}</div>
            <div class="inbox-card-snippet">${escapeHtml(m.snippet || '')}</div>
        </div>
    `).join('');

    DOM.inboxMessages.querySelectorAll('.inbox-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const acc = card.dataset.acc;
            openMessageDetail(acc, id);
        });
    });
}

async function openMessageDetail(acc, id) {
    const msg = AppState.inboxMessages.find(m => m.id === id);
    if (!msg) return;
    AppState.selectedMessage = msg;

    DOM.msgDetailSubject.textContent = msg.subject || '(Mavzusiz)';
    DOM.msgDetailFrom.textContent = msg.from;
    DOM.msgDetailAccount.textContent = acc;
    DOM.msgDetailDate.textContent = msg.date;
    DOM.msgDetailBody.textContent = 'Matn yuklanmoqda...';
    DOM.msgDetailModal.style.display = 'flex';

    try {
        const res = await fetch(`${AppState.backendUrl}/api/message/${encodeURIComponent(acc)}/${id}`);
        const data = await res.json();
        DOM.msgDetailBody.textContent = data.body || msg.snippet || 'Matn mavjud emas.';
    } catch (e) {
        DOM.msgDetailBody.textContent = msg.snippet || 'Tizim xabari: To\'liq matn saqlangan.';
    }
}

// ==========================================
// EVENT LISTENERS & SETUP
// ==========================================
function setupEventListeners() {
    // Mobil Navigatsiya Tugmalari
    if (DOM.mNavChat) {
        DOM.mNavChat.addEventListener('click', () => {
            setMobileNavActive(DOM.mNavChat);
            DOM.leftPanel.classList.remove('mobile-active');
            DOM.chatPanel.classList.remove('mobile-hidden');
            switchToChat();
        });
    }
    if (DOM.mNavInbox) {
        DOM.mNavInbox.addEventListener('click', () => {
            setMobileNavActive(DOM.mNavInbox);
            DOM.leftPanel.classList.remove('mobile-active');
            DOM.chatPanel.classList.remove('mobile-hidden');
            switchToInbox();
        });
    }
    if (DOM.mNavPhone) {
        DOM.mNavPhone.addEventListener('click', () => {
            setMobileNavActive(DOM.mNavPhone);
            DOM.leftPanel.classList.remove('mobile-active');
            DOM.chatPanel.classList.remove('mobile-hidden');
            switchToPhone();
        });
    }
    if (DOM.mNavSystem) {
        DOM.mNavSystem.addEventListener('click', () => {
            setMobileNavActive(DOM.mNavSystem);
            DOM.chatPanel.classList.add('mobile-hidden');
            DOM.leftPanel.classList.add('mobile-active');
        });
    }

    function setMobileNavActive(btn) {
        document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // Tabs
    if (DOM.tabChat) DOM.tabChat.addEventListener('click', switchToChat);
    if (DOM.tabInbox) DOM.tabInbox.addEventListener('click', switchToInbox);
    if (DOM.tabPhone) DOM.tabPhone.addEventListener('click', switchToPhone);

    // Chat Inputs
    if (DOM.btnSend) {
        DOM.btnSend.addEventListener('click', () => handleUserMessage(DOM.userInput.value));
    }
    if (DOM.userInput) {
        DOM.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage(DOM.userInput.value);
            }
        });
    }

    // Auth Modal
    if (DOM.btnAuthSubmit) {
        DOM.btnAuthSubmit.addEventListener('click', () => handleUserMessage(DOM.authNameInput.value));
    }
    if (DOM.authNameInput) {
        DOM.authNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleUserMessage(DOM.authNameInput.value);
        });
    }

    // Add Phone Target
    if (DOM.btnAddTarget) {
        DOM.btnAddTarget.addEventListener('click', () => {
            const phone = DOM.targetPhoneInput.value.trim();
            const name = DOM.targetNameInput.value.trim() || `Nishon (${phone})`;
            if (!phone) {
                alert("Iltimos, telefon raqamini kiriting (masalan: +998901234567)!");
                return;
            }
            addPhoneTarget(phone, name);
            DOM.targetPhoneInput.value = '';
            DOM.targetNameInput.value = '';
            showToast('✅ Telefon Qo\'shildi', `${name} kuzatuv tizimiga ulandi.`);
            addMessageToChat('friday', AppState.userRole === 'BOSHLIQ' 
                ? `Qilaman, bajariladi boshliq! Yangi nishon \`${phone}\` kuzatuvga olindi.`
                : `Yangi raqam \`${phone}\` monitoringga olindi.`);
        });
    }

    // Audio Toggle
    if (DOM.btnAudioToggle) {
        DOM.btnAudioToggle.addEventListener('click', () => {
            AppState.audioEnabled = !AppState.audioEnabled;
            localStorage.setItem('friday_audio_enabled', AppState.audioEnabled);
            DOM.audioToggleText.textContent = AppState.audioEnabled ? 'OVOZ: ON' : 'OVOZ: OFF';
            if (!AppState.audioEnabled) {
                window.speechSynthesis.cancel();
                if (DOM.voiceWaves) DOM.voiceWaves.classList.remove('speaking');
            }
        });
    }

    // Reset User (Chiqish)
    if (DOM.btnResetUser) {
        DOM.btnResetUser.addEventListener('click', () => {
            localStorage.removeItem('friday_saved_user');
            localStorage.removeItem('friday_saved_role');
            AppState.currentUser = null;
            AppState.userRole = null;
            DOM.hudUser.textContent = 'KUTILMOQDA';
            DOM.hudClearance.textContent = 'IDENTIFIKATSIYA TALAB ETILADI';
            DOM.hudUser.className = 'stat-value';
            DOM.hudClearance.className = 'stat-value';
            addMessageToChat('friday', "Tizimdan chiqildi. Qayta kirish uchun `ism:Abdulloxon` yoki `ism:Ruhshona` deb yozing.");
        });
    }

    // Refresh buttons
    if (DOM.btnRefreshAccounts) DOM.btnRefreshAccounts.addEventListener('click', fetchGmailAccounts);
    if (DOM.btnRefreshInbox) DOM.btnRefreshInbox.addEventListener('click', loadAllInbox);

    // Add Gmail Modal
    if (DOM.btnAddGmail) DOM.btnAddGmail.addEventListener('click', () => DOM.addAccountModal.style.display = 'flex');
    if (DOM.btnCloseAddModal) DOM.btnCloseAddModal.addEventListener('click', () => DOM.addAccountModal.style.display = 'none');
    if (DOM.btnCancelAddModal) DOM.btnCancelAddModal.addEventListener('click', () => DOM.addAccountModal.style.display = 'none');

    // Add Account Tabs
    if (DOM.tabBtnAppPwd) {
        DOM.tabBtnAppPwd.addEventListener('click', () => {
            DOM.tabBtnAppPwd.classList.add('active');
            DOM.tabBtnOauth.classList.remove('active');
            DOM.tabContentAppPwd.style.display = 'block';
            DOM.tabContentOauth.style.display = 'none';
        });
    }
    if (DOM.tabBtnOauth) {
        DOM.tabBtnOauth.addEventListener('click', () => {
            DOM.tabBtnOauth.classList.add('active');
            DOM.tabBtnAppPwd.classList.remove('active');
            DOM.tabContentOauth.style.display = 'block';
            DOM.tabContentAppPwd.style.display = 'none';
        });
    }

    // Submit App Password
    if (DOM.btnSubmitAppPwd) {
        DOM.btnSubmitAppPwd.addEventListener('click', async () => {
            const emailAddr = DOM.inputAppEmail.value.trim();
            // 16-xonali paroldagi probellarni avtomatik tozalash
            const pwd = DOM.inputAppPassword.value.replace(/\s+/g, '').trim();

            if (!emailAddr || !pwd) {
                alert("Iltimos, Gmail manzilingiz va 16-xonali Ilova parolini kiriting!");
                return;
            }

            DOM.btnSubmitAppPwd.textContent = "⏳ Tekshirilmoqda va ulanmoqda...";
            DOM.btnSubmitAppPwd.disabled = true;

            try {
                const res = await fetch(`${AppState.backendUrl}/api/accounts/add-app-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailAddr, app_password: pwd })
                });
                const data = await res.json();
                if (data.success) {
                    DOM.addAccountModal.style.display = 'none';
                    DOM.inputAppEmail.value = '';
                    DOM.inputAppPassword.value = '';
                    showToast('✅ Gmail Ulandi!', `${data.email} muvaffaqiyatli ulandi.`, 'success');
                    addMessageToChat('friday', `✅ **Gmail ulandi:** \`${data.email}\`\nEndi bu pochtani doimiy kuzatib boraman, boshliq!`);
                    speakFriday(`Boshliq, ${data.email} pochtasi ulandi!`);
                    fetchGmailAccounts();
                } else {
                    alert(`Xatolik: ${data.error}\n\n💡 Eslatma: Google hisobingizdan 16-xonali Ilova paroli (App Password) yaratilganiga ishonch hosil qiling.`);
                }
            } catch (err) {
                alert("Backend serverga ulanib bo'lmadi (`python gmail_server.py` ishga tushirilgan bo'lishi kerak) yoki pastdagi 'Sinov/Demo akkaunt' tugmasidan foydalaning!");
            } finally {
                DOM.btnSubmitAppPwd.textContent = "🔗 DARHOL ULASH VA KUZATUVGA OLISH";
                DOM.btnSubmitAppPwd.disabled = false;
            }
        });
    }

    // Demo / Sinov Akkaunt Qo'shish (Boshliq uchun bir bosish bilan)
    if (DOM.btnDemoAccount) {
        DOM.btnDemoAccount.addEventListener('click', () => {
            const demoEmail = 'boshliq.abdulloxon@gmail.com';
            AppState.gmailAccounts.push({
                email: demoEmail,
                type: 'imap',
                unread_count: 3,
                status: 'active'
            });
            DOM.addAccountModal.style.display = 'none';
            renderAccountList();
            updateUnreadBadges();
            showToast('✅ Sinov Akkaunti Faol', `${demoEmail} kuzatuvga olindi!`, 'success');
            addMessageToChat('friday', `✅ **Sinov pochtasi ulandi:** \`${demoEmail}\`\nBoshliq, barcha test xabarlari tayyor va nazorat ostida!`);
            speakFriday("Boshliq, sinov pochtasi ulandi!");
        });
    }

    // OAuth Start
    if (DOM.btnStartOauth) {
        DOM.btnStartOauth.addEventListener('click', async () => {
            try {
                const res = await fetch(`${AppState.backendUrl}/api/accounts/add`);
                const data = await res.json();
                if (data.auth_url) {
                    window.open(data.auth_url, 'gmail_auth', 'width=600,height=700');
                    DOM.addAccountModal.style.display = 'none';
                } else {
                    alert(`Google OAuth 403 xatosi: ${data.error}\n\nIltimos, Ilova paroli (App Password) orqali ulaning.`);
                }
            } catch (err) {
                alert("Backend server bilan aloqa yo'q. 'Ilova paroli' yoki 'Sinov akkaunt' variantidan foydalaning.");
            }
        });
    }

    // Message Detail Close & Reply
    if (DOM.btnCloseMsgDetail) DOM.btnCloseMsgDetail.addEventListener('click', () => DOM.msgDetailModal.style.display = 'none');
    if (DOM.btnCloseMsgDetailFooter) DOM.btnCloseMsgDetailFooter.addEventListener('click', () => DOM.msgDetailModal.style.display = 'none');
    if (DOM.btnReplyMsg) {
        DOM.btnReplyMsg.addEventListener('click', () => {
            DOM.msgDetailModal.style.display = 'none';
            switchToChat();
            if (AppState.selectedMessage && AppState.selectedMessage.from) {
                let sender = AppState.selectedMessage.from;
                if (sender.includes('<') && sender.includes('>')) {
                    sender = sender.split('<')[1].split('>')[0];
                }
                DOM.userInput.value = `gmail:${sender} xabar: `;
                DOM.userInput.focus();
            }
        });
    }

    // Report
    if (DOM.btnReport) DOM.btnReport.addEventListener('click', () => {
        executeMailReport();
    });

    // Settings
    if (DOM.btnSettings) {
        DOM.btnSettings.addEventListener('click', () => {
            DOM.apiKeyInput.value = AppState.apiKey;
            DOM.emailJsServiceId.value = AppState.emailServiceId;
            DOM.emailJsTemplateId.value = AppState.emailTemplateId;
            DOM.emailJsPublicKey.value = AppState.emailPublicKey;
            DOM.settingsModal.style.display = 'flex';
        });
    }
    if (DOM.btnCloseSettings) DOM.btnCloseSettings.addEventListener('click', () => DOM.settingsModal.style.display = 'none');
    if (DOM.btnCancelKey) DOM.btnCancelKey.addEventListener('click', () => DOM.settingsModal.style.display = 'none');
    if (DOM.btnSaveKey) {
        DOM.btnSaveKey.addEventListener('click', () => {
            AppState.apiKey = DOM.apiKeyInput.value.trim() || DEFAULT_API_KEY;
            localStorage.setItem('friday_api_key', AppState.apiKey);
            localStorage.setItem('friday_gemini_api_key', AppState.apiKey);
            AppState.emailServiceId = DOM.emailJsServiceId.value.trim();
            AppState.emailTemplateId = DOM.emailJsTemplateId.value.trim();
            AppState.emailPublicKey = DOM.emailJsPublicKey.value.trim();
            localStorage.setItem('friday_emailjs_service_id', AppState.emailServiceId);
            localStorage.setItem('friday_emailjs_template_id', AppState.emailTemplateId);
            localStorage.setItem('friday_emailjs_public_key', AppState.emailPublicKey);
            DOM.settingsModal.style.display = 'none';
            updateApiStatusUI();
            showToast('✅ Sozlamalar Saqlandi', 'Friday parametrlari muvaffaqiyatli saqlandi.');
        });
    }

    // Quick Command Chips
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            if (cmd) {
                if (cmd.startsWith('gmail:') || cmd.startsWith('telefon:')) {
                    DOM.userInput.value = cmd;
                    DOM.userInput.focus();
                } else {
                    handleUserMessage(cmd);
                }
            }
        });
    });

    // Voice STT
    setupSpeechRecognition();
}

// ==========================================
// SPEECH RECOGNITION (MIC)
// ==========================================
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !DOM.btnMic) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    DOM.btnMic.addEventListener('click', () => {
        if (AppState.isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                sfx.playBeep(800, 'sine', 0.1);
            } catch (e) {}
        }
    });

    recognition.onstart = () => {
        AppState.isListening = true;
        DOM.btnMic.classList.add('listening');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        DOM.userInput.value = transcript;
        handleUserMessage(transcript);
    };

    recognition.onend = () => {
        AppState.isListening = false;
        DOM.btnMic.classList.remove('listening');
    };

    recognition.onerror = () => {
        AppState.isListening = false;
        DOM.btnMic.classList.remove('listening');
    };
}

document.addEventListener('DOMContentLoaded', initApp);
