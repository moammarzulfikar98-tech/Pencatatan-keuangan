/* =========================================================
   CATATAN KEUANGAN — CORE APPLICATION CONTROLLER
   Integrated with Supabase Backend & Editorial Mobile Neo-Banking Design
   ========================================================= */

let currentUser = null;
let authMode = "login";
let reminderPayId = null;
let currentProgressGoalId = null;
let activeView = "home";
let speedDialOpen = false;
let activeWalletIndex = 0;
let carouselDidDrag = false;
let analyticsMode = "expense";
let selectedWeekIndex = 0;

const WALLET_CARDS = [
    { id: 'ALL', title: 'Semua Akun', subtitle: 'Total Likuiditas & Aset', number: '•••• 8842', styleClass: 'card-all', icon: 'layers' },
    { id: 'BCA', title: 'BCA Tahapan', subtitle: 'Rekening Operasional', number: '•••• 4109', styleClass: 'card-bca', icon: 'landmark' },
    { id: 'SeaBank', title: 'SeaBank', subtitle: 'Tabungan Harian 3.75%', number: '•••• 7731', styleClass: 'card-seabank', icon: 'sparkles' },
    { id: 'Bibit', title: 'Bibit Portofolio', subtitle: 'Reksadana & SBN', number: '•••• 9024', styleClass: 'card-bibit', icon: 'trending-up' },
    { id: 'E-Wallet', title: 'E-Wallet & QRIS', subtitle: 'GoPay • OVO • Dana', number: '•••• 5518', styleClass: 'card-ewallet', icon: 'qr-code' },
    { id: 'Tunai', title: 'Dompet Tunai', subtitle: 'Uang Fisik Harian', number: 'CASH IDR', styleClass: 'card-tunai', icon: 'banknote' },
];

/* ==================== 1. TOAST & NOTIFICATION SYSTEM ==================== */

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    const text = document.getElementById("toast-text");
    const badge = document.getElementById("toast-badge");
    const toastMsg = document.getElementById("toast-msg");
    if (!toast) {
        alert(msg);
        return;
    }
    if (toastMsg) toastMsg.textContent = msg;
    if (text) text.textContent = msg;
    if (badge) {
        badge.className = `w-6 h-6 rounded-full ${type === "error" ? "bg-crimson" : type === "warning" ? "bg-amberwarm" : "bg-jade"} flex items-center justify-center shrink-0`;
        badge.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-triangle' : 'check'}" class="w-3.5 h-3.5 text-white"></i>`;
    }
    if (window.lucide) lucide.createIcons();

    toast.classList.remove("opacity-0", "-translate-y-3");
    toast.classList.add("opacity-100", "translate-y-0");

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.classList.add("opacity-0", "-translate-y-3");
        toast.classList.remove("opacity-100", "translate-y-0");
    }, 2800);
}
window.showToast = showToast;

/* ==================== 2. SUPABASE AUTHENTICATION ==================== */

function toggleAuthMode() {
    authMode = authMode === "login" ? "signup" : "login";
    const errBox = document.getElementById("authError");
    if (errBox) errBox.textContent = "";

    if (authMode === "signup") {
        document.getElementById("authSubtitle").textContent = "Buat akun baru";
        document.getElementById("authSubmitBtn").innerHTML = `<span>Daftar</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        document.getElementById("authToggleText").textContent = "Sudah punya akun?";
        document.getElementById("authToggleLink").textContent = "Masuk";
    } else {
        document.getElementById("authSubtitle").textContent = "Masuk ke akunmu";
        document.getElementById("authSubmitBtn").innerHTML = `<span>Masuk</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        document.getElementById("authToggleText").textContent = "Belum punya akun?";
        document.getElementById("authToggleLink").textContent = "Daftar";
    }
    if (window.lucide) lucide.createIcons();
}

async function authSubmit() {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errBox = document.getElementById("authError");
    if (errBox) errBox.textContent = "";

    if (!email || !password) {
        if (errBox) errBox.textContent = "Isi email dan password.";
        return;
    }

    if (authMode === "signup") {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            if (errBox) errBox.textContent = error.message;
            return;
        }
        if (!data.session) {
            showToast("Cek email kamu untuk konfirmasi akun, lalu login.", "warning");
            toggleAuthMode();
            return;
        }
    } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (errBox) errBox.textContent = "Email atau password salah.";
            return;
        }
    }

    document.getElementById("authEmail").value = "";
    document.getElementById("authPassword").value = "";
}

async function authSignOut() {
    await supabaseClient.auth.signOut();
    showToast("Berhasil keluar akun", "success");
}

async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthState(session);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthState(session);
    });
}

function handleAuthState(session) {
    if (session && session.user) {
        currentUser = session.user;
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("appScreen").style.display = "block";

        const name = currentUser.email.split("@")[0];
        const initial = name.slice(0, 2).toUpperCase();
        const initEl = document.getElementById("userInitial");
        if (initEl) initEl.textContent = initial;

        const emailEl = document.getElementById("settingsEmailVal");
        if (emailEl) emailEl.textContent = currentUser.email;

        const hour = new Date().getHours();
        const timeGreet = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
        const greetEl = document.getElementById("homeGreetTitle");
        if (greetEl) greetEl.textContent = `${timeGreet}, ${name}`;

        updateCurrentDateHeader();
        loadData();
    } else {
        currentUser = null;
        document.getElementById("appScreen").style.display = "none";
        document.getElementById("authScreen").style.display = "flex";
    }
}

function updateCurrentDateHeader() {
    const dateLabel = document.getElementById("currentDateLabel");
    if (!dateLabel) return;
    const now = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    dateLabel.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

window.toggleAuthMode = toggleAuthMode;
window.authSubmit = authSubmit;
window.authSignOut = authSignOut;

/* ==================== 3. FORMATTING & BALANCE ==================== */

function formatRupiah(n, mask = false) {
    if (mask) return "Rp •••••••";
    return "Rp " + Math.round(Number(n) || 0).toLocaleString("id-ID");
}

function shortRp(val) {
    const n = Number(val) || 0;
    if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1).replace('.', ',') + 'jt';
    if (n >= 1000) return 'Rp ' + Math.round(n / 1000) + 'rb';
    return 'Rp ' + n;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

function accountBalance(acc) {
    let bal = 0;
    transactions.forEach(t => {
        if (t.account !== acc) return;
        bal += t.type === "income" ? t.amount : -t.amount;
    });
    return bal;
}

function togglePrivacy() {
    privacyMode = !privacyMode;
    const eyeIcon = document.getElementById("privacyEyeIcon");
    if (eyeIcon) {
        eyeIcon.setAttribute("data-lucide", privacyMode ? "eye-off" : "eye");
    }
    render();
    if (window.lucide) lucide.createIcons();
    showToast(privacyMode ? "Saldo disembunyikan" : "Saldo ditampilkan", "success");
}
window.togglePrivacy = togglePrivacy;

/* ==================== 4. DATA SYNCHRONIZATION WITH SUPABASE ==================== */

async function loadData() {
    if (!currentUser) return;

    // 1. Transactions
    const { data: txData, error: txError } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("transaction_date", { ascending: false });

    if (txError) {
        console.error("Tx Error:", txError);
    } else {
        transactions = (txData || []).map(item => ({
            id: item.id,
            type: item.type,
            desc: item.description,
            amount: Number(item.amount),
            account: item.account,
            category: item.category,
            date: item.transaction_date
        }));
    }

    // 2. Budgets
    const { data: budgetData, error: budgetError } = await supabaseClient
        .from("budgets")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (budgetError) console.error("Budget Error:", budgetError);
    else budgets = budgetData || [];

    // 3. Goals
    const { data: goalData, error: goalError } = await supabaseClient
        .from("goals")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (goalError) console.error("Goal Error:", goalError);
    else goals = goalData || [];

    // 4. Gift tracker
    const { data: giftData, error: giftError } = await supabaseClient
        .from("gift_tracker")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("event_date", { ascending: true });

    if (giftError) console.error("Gift Error:", giftError);
    else giftItems = giftData || [];

    // 5. Payment reminders
    const { data: reminderData, error: reminderError } = await supabaseClient
        .from("payment_reminders")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("due_date", { ascending: true });

    if (reminderError) {
        console.error("Reminder Error:", reminderError);
    } else {
        reminders = reminderData || [];
        await processRecurringReminders();
    }

    render();
}

/* ==================== 5. NAVIGATION CONTROLLER ==================== */

const PAGE_CONFIG = {
    home: { title: "Beranda", subtitle: "" },
    history: {
        title: "Riwayat Transaksi",
        subtitle: "Filter jenis, akun & kategori",
        actionBtn: `<button onclick="openModalExpense()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Catat</button>`
    },
    insight: { title: "Laporan & Analitik", subtitle: "Tren mingguan & arus kas bulanan" },
    account: {
        title: "Dompet & Rekening",
        subtitle: "5 Akun aktif terhubung",
        actionBtn: `<button onclick="openTransfer()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i> Transfer</button>`
    },
    budget: {
        title: "Budget Bulanan",
        subtitle: "Kendalikan batas pengeluaran kategori",
        actionBtn: `<button onclick="openBudgetModal()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Budget</button>`
    },
    goals: {
        title: "Goals Tabungan",
        subtitle: "Target tabungan & impian",
        actionBtn: `<button onclick="openGoalModal()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Goal</button>`
    },
    gift: {
        title: "🎁 Gift Tracker",
        subtitle: "Rencana kado & hari spesial",
        actionBtn: `<button onclick="openGiftModal()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Gift</button>`
    },
    reminder: {
        title: "🔔 Reminder Tagihan",
        subtitle: "Countdown cicilan, hutang & tagihan",
        actionBtn: `<button onclick="openReminderModal()" class="min-h-[36px] px-3.5 rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center gap-1 active:scale-95 transition shadow-sm"><i data-lucide="plus" class="w-3.5 h-3.5"></i> Reminder</button>`
    },
    archive: { title: "Archive Bulanan", subtitle: "Rekap riwayat per bulan" },
    settings: { title: "Pengaturan", subtitle: "Profil akun & preferensi tema" }
};

const VIEW_ALIASES = {
    transactions: "history",
    insights: "insight",
    accounts: "account",
    gifts: "gift",
    reminders: "reminder"
};

function goPage(name) {
    closeSpeedDial();
    const resolvedName = VIEW_ALIASES[name] || name;
    activeView = resolvedName;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + resolvedName);
    if (targetPage) targetPage.classList.add('active');

    // Bottom Navigation styling
    const bottomNavMap = {
        home: "navHome",
        history: "navHistory2",
        insight: "navInsight",
        account: "navAccount"
    };

    ['navHome', 'navHistory2', 'navInsight', 'navAccount'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const isMatch = bottomNavMap[resolvedName] === id;
        btn.className = `nav-btn flex flex-col items-center justify-center min-h-[48px] gap-1 transition ${
            isMatch ? 'text-bordeaux dark:text-[#F3A6B8]' : 'text-[#73685E] dark:text-[#9E9389]'
        }`;
        const span = btn.querySelector('span');
        if (span) span.className = `text-[10px] ${isMatch ? 'font-extrabold' : 'font-semibold'}`;
    });

    // Desktop Navigation buttons
    document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
        const tab = btn.getAttribute('data-tab');
        if (tab === resolvedName) {
            btn.className = "desktop-nav-btn px-3 py-1.5 rounded-xl font-extrabold text-bordeaux dark:text-[#F3A6B8] bg-bordeaux-soft dark:bg-bordeaux/30 transition";
        } else {
            btn.className = "desktop-nav-btn px-3 py-1.5 rounded-xl font-semibold text-[#73685E] dark:text-[#9E9389] hover:text-bordeaux transition";
        }
    });

    // Header switching
    const homeHeader = document.getElementById('header-home-mode');
    const subHeader = document.getElementById('header-subpage-mode');
    if (resolvedName === 'home') {
        if (homeHeader) homeHeader.classList.remove('hidden');
        if (subHeader) subHeader.classList.add('hidden');
    } else {
        if (homeHeader) homeHeader.classList.add('hidden');
        if (subHeader) {
            subHeader.classList.remove('hidden');
            const cfg = PAGE_CONFIG[resolvedName] || { title: "Menu", subtitle: "" };
            const titleEl = document.getElementById('subpage-title');
            const subEl = document.getElementById('subpage-subtitle');
            const slotEl = document.getElementById('subpage-action-slot');
            if (titleEl) titleEl.textContent = cfg.title;
            if (subEl) subEl.textContent = cfg.subtitle;
            if (slotEl) slotEl.innerHTML = cfg.actionBtn || "";
        }
    }

    const scrollContainer = document.getElementById('main-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    render();
    if (window.lucide) lucide.createIcons();
}
window.goPage = goPage;
window.navigateTo = goPage;

/* ==================== 6. SPEED DIAL CONTROLLER ==================== */

function toggleSpeedDial() {
    speedDialOpen = !speedDialOpen;
    const overlay = document.getElementById('speed-dial-overlay');
    const fabIcon = document.getElementById('fab-plus-icon');
    if (overlay) {
        if (speedDialOpen) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    if (fabIcon) {
        fabIcon.style.transform = speedDialOpen ? 'rotate(45deg)' : 'rotate(0deg)';
    }
}
window.toggleSpeedDial = toggleSpeedDial;

function closeSpeedDial() {
    if (!speedDialOpen) return;
    speedDialOpen = false;
    const overlay = document.getElementById('speed-dial-overlay');
    const fabIcon = document.getElementById('fab-plus-icon');
    if (overlay) overlay.classList.add('hidden');
    if (fabIcon) fabIcon.style.transform = 'rotate(0deg)';
}
window.closeSpeedDial = closeSpeedDial;

/* ==================== 7. FAST-TAP QUICK TEMPLATES ==================== */

async function quickTemplateTx(desc, amount, category, account) {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabaseClient.from('transactions').insert([{
        user_id: currentUser.id,
        type: 'expense',
        description: desc,
        amount: Number(amount),
        account: account,
        category: category,
        transaction_date: today
    }]);

    if (error) {
        showToast(error.message, 'error');
        return;
    }
    showToast(`Tercatat: ${desc} (-${formatRupiah(amount)})`, 'success');
    await loadData();
}
window.quickTemplateTx = quickTemplateTx;

/* ==================== 8. MODAL & BOTTOM SHEET CONTROLLERS ==================== */

function openModal() {
    openModalExpense();
}
function openModalExpense(prefillAccount = "Tunai") {
    document.getElementById('modalTitle').textContent = 'Tambah Pengeluaran';
    document.getElementById('editId').value = '';
    document.getElementById('txForm').reset();
    document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('accountInput').value = prefillAccount;
    setType('expense');
    document.getElementById('modalOverlay').classList.add('active');
    if (window.lucide) lucide.createIcons();
}
function openModalIncome(prefillAccount = "BCA") {
    document.getElementById('modalTitle').textContent = 'Tambah Pemasukan';
    document.getElementById('editId').value = '';
    document.getElementById('txForm').reset();
    document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('accountInput').value = prefillAccount;
    setType('income');
    document.getElementById('modalOverlay').classList.add('active');
    if (window.lucide) lucide.createIcons();
}
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function openTransfer(prefillFrom = "BCA") {
    const modal = document.getElementById("transferModal");
    if (modal) {
        modal.classList.add("active");
        document.getElementById("transferFrom").value = prefillFrom;
        document.getElementById("transferDate").value = new Date().toISOString().split("T")[0];
    }
}
function closeTransfer() {
    const modal = document.getElementById("transferModal");
    if (modal) modal.classList.remove("active");
}

function openBudgetModal() {
    document.getElementById("budgetModal").classList.add("active");
    document.getElementById("budgetMonth").value = new Date().toISOString().slice(0, 7);
}
function closeBudgetModal() {
    document.getElementById("budgetModal").classList.remove("active");
}

function openGoalModal() {
    document.getElementById("goalModal").classList.add("active");
    document.getElementById("goalDate").value = new Date().toISOString().split("T")[0];
}
function closeGoalModal() {
    document.getElementById("goalModal").classList.remove("active");
}

function openGoalDepositModal(preId = '', mode = 'deposit') {
    if (goals.length === 0) {
        openGoalModal();
        return;
    }

    const modal = document.getElementById("goalProgressModal");
    if (!modal) return;

    const selectedGoal = goals.find(g => String(g.id) === String(preId)) || goals[0];
    currentProgressGoalId = selectedGoal.id;

    // Set mode
    setGoalModalMode(mode);

    // Populate Goal dropdown
    const goalSelect = document.getElementById("goalProgressSelect");
    if (goalSelect) {
        goalSelect.innerHTML = goals.map(g => `<option value="${g.id}" ${String(g.id) === String(selectedGoal.id) ? 'selected' : ''}>${escapeHtml(g.category || '🎯')} ${escapeHtml(g.name)}</option>`).join("");
    }

    // Populate account dropdown
    const accSelect = document.getElementById("goalProgressAccount");
    if (accSelect) {
        accSelect.innerHTML = ACCOUNTS.map(a => `<option value="${a}" ${a === selectedGoal.account ? 'selected' : ''}>${a} (${shortRp(accountBalance(a))})</option>`).join("");
    }

    const amtInput = document.getElementById("goalProgressAmount");
    if (amtInput) amtInput.value = 250000;

    updateGoalModalPreview();

    modal.classList.add("active");
    if (window.lucide) lucide.createIcons();
}

function setGoalModalMode(mode) {
    const modeInput = document.getElementById("ga-mode");
    if (modeInput) modeInput.value = mode;

    const tabDep = document.getElementById("gm-tab-deposit");
    const tabWit = document.getElementById("gm-tab-withdraw");
    const btn = document.getElementById("ga-submit-btn");
    const lbl = document.getElementById("ga-acc-label");

    if (tabDep) {
        tabDep.className = `min-h-[38px] rounded-xl text-xs font-extrabold transition ${mode === 'deposit' ? 'bg-jade text-white shadow-xs' : 'text-[#73685E]'}`;
    }
    if (tabWit) {
        tabWit.className = `min-h-[38px] rounded-xl text-xs font-extrabold transition ${mode === 'withdraw' ? 'bg-crimson text-white shadow-xs' : 'text-[#73685E]'}`;
    }
    if (lbl) {
        lbl.textContent = mode === 'deposit' ? 'Sumber Dana' : 'Tujuan Cairkan';
    }
    if (btn) {
        btn.className = `w-full min-h-[48px] rounded-2xl ${mode === 'deposit' ? 'bg-jade' : 'bg-crimson'} text-white font-extrabold text-xs shadow-card-3d active:scale-[0.98] transition`;
        btn.textContent = mode === 'deposit' ? 'Konfirmasi Setor Tabungan' : 'Konfirmasi Tarik Dana';
    }

    updateGoalModalPreview();
}

function updateGoalModalPreview() {
    const goalSelect = document.getElementById("goalProgressSelect");
    const id = goalSelect ? goalSelect.value : currentProgressGoalId;
    const modeInput = document.getElementById("ga-mode");
    const mode = modeInput ? modeInput.value : 'deposit';
    const amtInput = document.getElementById("goalProgressAmount");
    const amt = Math.max(0, Number(amtInput ? amtInput.value : 0));
    const goal = goals.find(g => String(g.id) === String(id));
    const box = document.getElementById("ga-preview-card");
    if (!goal || !box) return;

    const curSaved = goal.saved_amount || 0;
    const target = goal.target_amount || 1;
    const curPct = target > 0 ? Math.min(100, Math.round((curSaved / target) * 100)) : 0;
    const nextVal = mode === 'deposit' ? curSaved + amt : Math.max(0, curSaved - amt);
    const nextPct = target > 0 ? Math.min(100, Math.round((nextVal / target) * 100)) : 0;
    const remAfter = Math.max(0, target - nextVal);

    box.innerHTML = `
        <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-[#73685E] dark:text-[#9E9389]">Progres Target</span>
            <span class="font-money font-extrabold ${mode === 'deposit' ? 'text-jade' : 'text-crimson'}">
                ${curPct}% → ${nextPct}%
            </span>
        </div>
        <div class="relative w-full h-3 rounded-full bg-linen-muted dark:bg-obsidian-elevated overflow-hidden">
            ${mode === 'deposit'
                ? `<div class="absolute inset-y-0 left-0 bg-emerald-300 dark:bg-emerald-700/70 rounded-full transition-all duration-300" style="width:${nextPct}%"></div>
                   <div class="absolute inset-y-0 left-0 bg-jade rounded-full transition-all duration-300" style="width:${curPct}%"></div>`
                : `<div class="absolute inset-y-0 left-0 bg-rose-300 dark:bg-rose-900/60 rounded-full transition-all duration-300" style="width:${curPct}%"></div>
                   <div class="absolute inset-y-0 left-0 bg-jade rounded-full transition-all duration-300" style="width:${nextPct}%"></div>`
            }
        </div>
        <div class="flex items-center justify-between font-money text-[11px]">
            <span class="font-bold">${formatRupiah(nextVal)} / ${shortRp(target)}</span>
            <span class="text-[#73685E] dark:text-[#9E9389]">${remAfter === 0 ? '🎉 Target Tercapai!' : `Kurang ${shortRp(remAfter)}`}</span>
        </div>
    `;
}

function applyGoalPreset(preset) {
    const goalSelect = document.getElementById("goalProgressSelect");
    const id = goalSelect ? goalSelect.value : currentProgressGoalId;
    const goal = goals.find(g => String(g.id) === String(id));
    if (!goal) return;
    const curSaved = goal.saved_amount || 0;
    const target = goal.target_amount || 1;
    const rem = Math.max(0, target - curSaved);
    let val = 100000;
    if (preset === '100k') val = 100000;
    if (preset === '25pct') val = Math.max(10000, Math.round(rem * 0.25));
    if (preset === '50pct') val = Math.max(10000, Math.round(rem * 0.5));
    if (preset === 'full') val = Math.max(1000, rem);

    const amtInput = document.getElementById("goalProgressAmount");
    if (amtInput) amtInput.value = val;
    updateGoalModalPreview();
}

function openGoalProgressModal(id, savedAmount) {
    openGoalDepositModal(id, 'deposit');
}

function closeGoalProgressModal() {
    document.getElementById("goalProgressModal").classList.remove("active");
}

function openQuickSavings() {
    openGoalDepositModal('', 'deposit');
}
function closeQuickSavings() {
    closeGoalProgressModal();
}

function openGiftModal() {
    document.getElementById("giftModal").classList.add("active");
    document.getElementById("giftEventDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("giftName").value = "";
    document.getElementById("giftAmount").value = "";
    document.getElementById("giftNote").value = "";
}
function closeGiftModal() {
    document.getElementById("giftModal").classList.remove("active");
}

function openReminderModal() {
    document.getElementById("reminderModal").classList.add("active");
    document.getElementById("reminderTitle").value = "";
    document.getElementById("reminderAmount").value = "";
    document.getElementById("reminderMonthly").value = "";
    document.getElementById("reminderDueDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("reminderNote").value = "";
}
function closeReminderModal() {
    document.getElementById("reminderModal").classList.remove("active");
}

function openPayReminderModal(id) {
    reminderPayId = id;
    const r = reminders.find(x => String(x.id) === String(id));
    if (!r) return;

    const modal = document.getElementById("reminderPayModal");
    if (!modal) return;

    const remainingMonths = r.tenor_bulan > 0 ? Math.max(1, r.tenor_bulan - Math.floor((r.paid_amount || 0) / (r.monthly_amount || 1))) : 1;
    const totalObligation = r.total_amount ? Math.max(0, r.total_amount - (r.paid_amount || 0)) : (r.monthly_amount || 0) * remainingMonths;
    const defaultAmount = r.monthly_amount > 0 ? r.monthly_amount : totalObligation;

    // Set subtitle
    const sub = document.getElementById("rpay-subtitle");
    if (sub) sub.textContent = `Jatuh tempo ${r.due_date || '-'}`;

    // Populate summary card
    const sumCard = document.getElementById("rpay-summary-card");
    if (sumCard) {
        const cicilanKe = r.monthly_amount > 0 ? Math.floor((r.paid_amount || 0) / r.monthly_amount) + 1 : 1;
        sumCard.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-bordeaux text-white">${escapeHtml(r.category || 'Tagihan')}</span>
                <span class="font-money text-[11px] font-bold text-bordeaux dark:text-[#F3A6B8]">
                    ${r.tenor_bulan > 0 ? `Cicilan ke-${cicilanKe} dari ${r.tenor_bulan}` : 'Tagihan Bulanan'}
                </span>
            </div>
            <h4 class="text-sm font-extrabold text-charcoal dark:text-white mt-1">🔔 ${escapeHtml(r.title)}</h4>
            <div class="flex items-center justify-between pt-1.5 border-t border-bordeaux/15 font-money text-xs">
                <span class="text-[#73685E] dark:text-[#9E9389]">Total Sisa Kewajiban</span>
                <span class="font-extrabold text-charcoal dark:text-white">${formatRupiah(totalObligation)}</span>
            </div>
        `;
    }

    // Populate presets
    const presetsBox = document.getElementById("rpay-presets");
    if (presetsBox) {
        if (r.tenor_bulan > 0 && r.monthly_amount > 0) {
            presetsBox.style.display = "grid";
            presetsBox.innerHTML = `
                <button type="button" onclick="setReminderPreset(${r.monthly_amount}, 1)" class="py-2 rounded-xl bg-linen dark:bg-obsidian-elevated border border-linen-border dark:border-obsidian-border font-money text-[10px] font-extrabold hover:border-bordeaux transition active:scale-95">1x Cicilan</button>
                <button type="button" onclick="setReminderPreset(${r.monthly_amount * Math.min(2, remainingMonths)}, ${Math.min(2, remainingMonths)})" class="py-2 rounded-xl bg-linen dark:bg-obsidian-elevated border border-linen-border dark:border-obsidian-border font-money text-[10px] font-extrabold hover:border-bordeaux transition active:scale-95">2x Cicilan</button>
                <button type="button" onclick="setReminderPreset(${totalObligation}, ${remainingMonths})" class="py-2 rounded-xl bg-jade-soft dark:bg-jade/25 text-jade dark:text-[#6EE7B7] font-money text-[10px] font-extrabold transition active:scale-95">Lunasi Semua</button>
            `;
        } else {
            presetsBox.style.display = "none";
        }
    }

    // Populate source accounts
    const accSelect = document.getElementById("reminderPayAccount");
    if (accSelect) {
        accSelect.innerHTML = ACCOUNTS.map(a => `<option value="${a}">${a} (${shortRp(accountBalance(a))})</option>`).join("");
    }

    const amtInput = document.getElementById("reminderPayAmount");
    if (amtInput) amtInput.value = defaultAmount;

    const monthsInput = document.getElementById("rpay-months");
    if (monthsInput) monthsInput.value = 1;

    updateReminderPayPreview();

    modal.classList.add("active");
    if (window.lucide) lucide.createIcons();
}

function updateReminderPayPreview() {
    const r = reminders.find(x => String(x.id) === String(reminderPayId));
    const box = document.getElementById("rpay-live-preview");
    if (!r || !box) return;

    const accSelect = document.getElementById("reminderPayAccount");
    const amtInput = document.getElementById("reminderPayAmount");
    const acc = accSelect ? accSelect.value : "BCA";
    const amt = Math.max(0, Number(amtInput ? amtInput.value : 0));

    const curBal = accountBalance(acc);
    const afterBal = curBal - amt;

    const remainingMonths = r.tenor_bulan > 0 ? Math.max(1, r.tenor_bulan - Math.floor((r.paid_amount || 0) / (r.monthly_amount || 1))) : 1;
    const totalObligation = r.total_amount ? Math.max(0, r.total_amount - (r.paid_amount || 0)) : (r.monthly_amount || 0) * remainingMonths;
    const afterDebt = Math.max(0, totalObligation - amt);

    box.innerHTML = `
        <div class="flex justify-between items-center text-xs">
            <span class="text-[#73685E] dark:text-[#9E9389]">Saldo ${acc} Setelah Bayar</span>
            <span class="font-money font-extrabold ${afterBal < 0 ? 'text-crimson' : 'text-charcoal dark:text-white'}">${formatRupiah(afterBal)}</span>
        </div>
        <div class="flex justify-between items-center text-xs">
            <span class="text-[#73685E] dark:text-[#9E9389]">Sisa Kewajiban</span>
            <span class="font-money font-extrabold ${afterDebt === 0 ? 'text-jade' : 'text-charcoal dark:text-white'}">${afterDebt === 0 ? 'LUNAS 🎉' : formatRupiah(afterDebt)}</span>
        </div>
    `;
}

function setReminderPreset(amount, months) {
    const amtInput = document.getElementById("reminderPayAmount");
    const monthsInput = document.getElementById("rpay-months");
    if (amtInput) amtInput.value = amount;
    if (monthsInput) monthsInput.value = months;
    updateReminderPayPreview();
}

function openReminderPayModal(id) {
    openPayReminderModal(id);
}
function closeReminderPayModal() {
    document.getElementById("reminderPayModal").classList.remove("active");
}

function openArtaTip() {
    let totalBal = 0;
    transactions.forEach(t => {
        totalBal += t.type === "income" ? t.amount : -t.amount;
    });
    const txtEl = document.getElementById("artaModalText");
    if (txtEl) {
        txtEl.innerHTML = `
            <p>Total saldo gabungan di 5 akunmu saat ini adalah <strong class="font-money">${formatRupiah(totalBal)}</strong>.</p>
            <p>Kamu memiliki <strong>${reminders.length} reminder aktif</strong> dan <strong>${goals.length} target tabungan (Goals)</strong> yang sedang berjalan.</p>
            <p>Kendalikan pengeluaran dengan memanfaatkan anggaran bulanan agar keuanganmu tetap aman terkendali! ✨</p>
        `;
    }
    const modal = document.getElementById("artaModal");
    if (modal) modal.classList.add("active");
}
function closeArtaTip() {
    const modal = document.getElementById("artaModal");
    if (modal) modal.classList.remove("active");
}

window.openModal = openModal;
window.openModalExpense = openModalExpense;
window.openModalIncome = openModalIncome;
window.closeModal = closeModal;
window.openTransfer = openTransfer;
window.closeTransfer = closeTransfer;
window.openBudgetModal = openBudgetModal;
window.closeBudgetModal = closeBudgetModal;
window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.openGoalDepositModal = openGoalDepositModal;
window.setGoalModalMode = setGoalModalMode;
window.updateGoalModalPreview = updateGoalModalPreview;
window.applyGoalPreset = applyGoalPreset;
window.openGoalProgressModal = openGoalProgressModal;
window.closeGoalProgressModal = closeGoalProgressModal;
window.openQuickSavings = openQuickSavings;
window.closeQuickSavings = closeQuickSavings;
window.openGiftModal = openGiftModal;
window.closeGiftModal = closeGiftModal;
window.openReminderModal = openReminderModal;
window.closeReminderModal = closeReminderModal;
window.openPayReminderModal = openPayReminderModal;
window.updateReminderPayPreview = updateReminderPayPreview;
window.setReminderPreset = setReminderPreset;
window.openReminderPayModal = openReminderPayModal;
window.closeReminderPayModal = closeReminderPayModal;
window.openArtaTip = openArtaTip;
window.closeArtaTip = closeArtaTip;

/* ==================== 9. FORM SUBMISSIONS & TRANSACTION CRUD ==================== */

function setType(type) {
    currentType = type;
    const btnExpense = document.getElementById('btnExpense');
    const btnIncome = document.getElementById('btnIncome');

    if (btnExpense) {
        btnExpense.className = `type-tab p-2.5 rounded-xl border font-extrabold text-xs flex flex-col items-center gap-1 transition ${
            type === 'expense'
                ? 'border-crimson bg-crimson text-white shadow-sm'
                : 'border-linen-border dark:border-obsidian-border bg-linen dark:bg-obsidian-elevated text-[#73685E] dark:text-[#9E9389]'
        }`;
    }
    if (btnIncome) {
        btnIncome.className = `type-tab p-2.5 rounded-xl border font-extrabold text-xs flex flex-col items-center gap-1 transition ${
            type === 'income'
                ? 'border-jade bg-jade text-white shadow-sm'
                : 'border-linen-border dark:border-obsidian-border bg-linen dark:bg-obsidian-elevated text-[#73685E] dark:text-[#9E9389]'
        }`;
    }

    renderCategoryIcons(type);
}
window.setType = setType;

function renderCategoryIcons(type) {
    const grid = document.getElementById("categoryIconGrid");
    if (!grid) return;
    const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const currentInput = document.getElementById("categoryInput");
    const selected = currentInput ? currentInput.value : "";

    grid.innerHTML = list.map(cat => {
        const meta = CAT_META[cat] || { icon: "tag", color: "#6B1D2F", bg: "rgba(107, 29, 47, 0.1)" };
        const isAct = cat === selected;
        return `
        <button type="button" class="cat-icon-btn p-2 rounded-xl border ${
            isAct 
                ? 'border-bordeaux bg-bordeaux-soft dark:bg-bordeaux/30 text-bordeaux dark:text-[#F3A6B8]' 
                : 'border-linen-border dark:border-obsidian-border bg-linen dark:bg-obsidian-elevated text-[#73685E] dark:text-[#9E9389]'
        } flex flex-col items-center gap-1 transition active:scale-95" onclick="selectCategory('${cat}')">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background-color:${meta.bg}; color:${meta.color}">
                <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
            </div>
            <span class="text-[10px] font-bold truncate max-w-full">${cat}</span>
        </button>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}
window.renderCategoryIcons = renderCategoryIcons;

function selectCategory(cat) {
    const input = document.getElementById("categoryInput");
    if (input) input.value = cat;
    renderCategoryIcons(currentType);
}
window.selectCategory = selectCategory;

function bumpAmount(add) {
    const input = document.getElementById('amountInput');
    const current = parseFloat(input.value) || 0;
    input.value = current + add;
}
window.bumpAmount = bumpAmount;

window.editTx = function(id) {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    document.getElementById('modalTitle').textContent = 'Ubah Transaksi';
    document.getElementById('editId').value = t.id;
    document.getElementById('descInput').value = t.desc;
    document.getElementById('amountInput').value = t.amount;
    document.getElementById('accountInput').value = t.account;
    document.getElementById('categoryInput').value = t.category;
    document.getElementById('dateInput').value = t.date;
    setType(t.type);
    document.getElementById('modalOverlay').classList.add('active');
    if (window.lucide) lucide.createIcons();
};

window.deleteTx = async function(id) {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast("Transaksi berhasil dihapus", "success");
    await loadData();
};

async function saveTransfer() {
    const from = document.getElementById("transferFrom").value;
    const to = document.getElementById("transferTo").value;
    const amount = Number(document.getElementById("transferAmount").value);
    const date = document.getElementById("transferDate").value;

    if (!from || !to || !amount || !date) {
        showToast("Lengkapi semua data transfer.", "error");
        return;
    }

    if (from === to) {
        showToast("Akun asal dan tujuan tidak boleh sama.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from("transactions")
        .insert([
            {
                user_id: currentUser.id,
                type: "expense",
                description: `Transfer ke ${to}`,
                amount: amount,
                account: from,
                category: "Transfer",
                transaction_date: date
            },
            {
                user_id: currentUser.id,
                type: "income",
                description: `Transfer dari ${from}`,
                amount: amount,
                account: to,
                category: "Transfer",
                transaction_date: date
            }
        ]);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeTransfer();
    showToast(`Transfer ${formatRupiah(amount)} berhasil!`, "success");
    await loadData();
}
window.saveTransfer = saveTransfer;

async function saveBudget() {
    const category = document.getElementById("budgetCategory").value.trim();
    const amount = Number(document.getElementById("budgetAmount").value);
    const month = document.getElementById("budgetMonth").value;

    if (!category || !amount || !month) {
        showToast("Lengkapi semua data budget.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from("budgets")
        .insert([{
            user_id: currentUser.id,
            category: category,
            budget_limit: amount,
            period: month
        }]);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeBudgetModal();
    showToast("Budget berhasil dibuat!", "success");
    await loadData();
}
window.saveBudget = saveBudget;

async function deleteBudget(id) {
    if (!confirm("Hapus budget ini?")) return;
    const { error } = await supabaseClient
        .from("budgets")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast("Budget berhasil dihapus", "success");
    await loadData();
}
window.deleteBudget = deleteBudget;

async function saveGoal() {
    const name = document.getElementById("goalName").value.trim();
    const target = Number(document.getElementById("goalTarget").value);
    const account = document.getElementById("goalAccount").value;
    const category = document.getElementById("goalCategory").value;
    const date = document.getElementById("goalDate").value;

    if (!name || !target || !date) {
        showToast("Lengkapi semua data goal.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from("goals")
        .insert([{
            user_id: currentUser.id,
            name: name,
            target_amount: target,
            saved_amount: 0,
            account: account,
            category: category,
            target_date: date
        }]);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeGoalModal();
    showToast("Goal berhasil dibuat!", "success");
    await loadData();
}
window.saveGoal = saveGoal;

async function deleteGoal(id) {
    if (!confirm("Hapus goal tabungan ini?")) return;
    const { error } = await supabaseClient
        .from("goals")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast("Goal berhasil dihapus", "success");
    await loadData();
}
window.deleteGoal = deleteGoal;

async function saveGoalProgress() {
    const goalSelect = document.getElementById("goalProgressSelect");
    const id = goalSelect ? goalSelect.value : currentProgressGoalId;
    const modeInput = document.getElementById("ga-mode");
    const mode = modeInput ? modeInput.value : 'deposit';
    const accSelect = document.getElementById("goalProgressAccount");
    const acc = accSelect ? accSelect.value : "BCA";
    const amtInput = document.getElementById("goalProgressAmount");
    const amt = Number(amtInput ? amtInput.value : 0);

    if (!id || !amt || amt <= 0) {
        showToast("Masukkan nominal tabungan yang valid.", "error");
        return;
    }

    const goal = goals.find(g => String(g.id) === String(id));
    if (!goal) return;
    const today = new Date().toISOString().split("T")[0];

    if (mode === 'deposit') {
        if (accountBalance(acc) < amt) {
            showToast(`Saldo ${acc} tidak mencukupi untuk setor`, "error");
            return;
        }

        const newSaved = (goal.saved_amount || 0) + amt;
        const { error: goalError } = await supabaseClient
            .from("goals")
            .update({ saved_amount: newSaved })
            .eq("id", id);

        if (goalError) {
            showToast(goalError.message, "error");
            return;
        }

        await supabaseClient.from("transactions").insert([{
            user_id: currentUser.id,
            type: "expense",
            description: `Setor Goal: ${goal.name}`,
            amount: amt,
            account: acc,
            category: "Tabungan",
            transaction_date: today
        }]);

        closeGoalProgressModal();
        showToast(`Berhasil setor ${formatRupiah(amt)} ke ${goal.name}!`, "success");
    } else {
        if ((goal.saved_amount || 0) < amt) {
            showToast("Dana tabungan goal tidak mencukupi untuk ditarik", "error");
            return;
        }

        const newSaved = Math.max(0, (goal.saved_amount || 0) - amt);
        const { error: goalError } = await supabaseClient
            .from("goals")
            .update({ saved_amount: newSaved })
            .eq("id", id);

        if (goalError) {
            showToast(goalError.message, "error");
            return;
        }

        await supabaseClient.from("transactions").insert([{
            user_id: currentUser.id,
            type: "income",
            description: `Cairkan Goal: ${goal.name}`,
            amount: amt,
            account: acc,
            category: "Tabungan",
            transaction_date: today
        }]);

        closeGoalProgressModal();
        showToast(`Berhasil tarik ${formatRupiah(amt)} dari ${goal.name} ke ${acc}!`, "success");
    }

    await loadData();
}
window.saveGoalProgress = saveGoalProgress;

async function saveQuickSavings() {
    const goalId = document.getElementById("quickSavingsGoalSelect").value;
    const amount = Number(document.getElementById("quickSavingsAmount").value);

    if (!goalId || !amount || amount <= 0) {
        showToast("Pilih goal dan masukkan nominal.", "error");
        return;
    }

    const goal = goals.find(g => String(g.id) === String(goalId));
    if (!goal) return;

    const newSaved = (goal.saved_amount || 0) + amount;
    const { error } = await supabaseClient
        .from("goals")
        .update({ saved_amount: newSaved })
        .eq("id", goalId);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeQuickSavings();
    showToast(`Berhasil menabung ${formatRupiah(amount)}!`, "success");
    await loadData();
}
window.saveQuickSavings = saveQuickSavings;

async function saveGift() {
    const name = document.getElementById("giftName").value.trim();
    const amount = Number(document.getElementById("giftAmount").value);
    const category = document.getElementById("giftCategory").value;
    const eventDate = document.getElementById("giftEventDate").value;
    const status = document.getElementById("giftStatus").value;
    const note = document.getElementById("giftNote").value.trim();

    if (!name || !amount || !eventDate) {
        showToast("Lengkapi nama, nominal, dan tanggal event.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from("gift_tracker")
        .insert([{
            user_id: currentUser.id,
            gift_name: name,
            amount: amount,
            category: category,
            event_date: eventDate,
            status: status,
            note: note
        }]);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeGiftModal();
    showToast("Gift tracker berhasil disimpan!", "success");
    await loadData();
}
window.saveGift = saveGift;

async function toggleGiftStatus(id, currentStatus) {
    const nextStatus = currentStatus === "Sudah Dibeli" ? "Belum Dibeli" : "Sudah Dibeli";
    const { error } = await supabaseClient
        .from("gift_tracker")
        .update({ status: nextStatus })
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast(nextStatus === "Sudah Dibeli" ? "Gift ditandai sudah dibeli!" : "Status gift dikembalikan", "success");
    await loadData();
}
window.toggleGiftStatus = toggleGiftStatus;

async function deleteGift(id) {
    if (!confirm("Hapus rencana gift ini?")) return;
    const { error } = await supabaseClient
        .from("gift_tracker")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast("Gift berhasil dihapus", "success");
    await loadData();
}
window.deleteGift = deleteGift;

async function saveReminder() {
    const title = document.getElementById("reminderTitle").value.trim();
    const amount = document.getElementById("reminderAmount").value ? Number(document.getElementById("reminderAmount").value) : null;
    const monthly = document.getElementById("reminderMonthly").value ? Number(document.getElementById("reminderMonthly").value) : 0;
    const tenor = document.getElementById("reminderTenor").value ? Number(document.getElementById("reminderTenor").value) : null;
    const dueDate = document.getElementById("reminderDueDate").value;
    const category = document.getElementById("reminderCategory").value;
    const note = document.getElementById("reminderNote").value.trim();

    if (!title || !dueDate) {
        showToast("Lengkapi nama reminder dan tanggal jatuh tempo.", "error");
        return;
    }

    const { error } = await supabaseClient
        .from("payment_reminders")
        .insert([{
            user_id: currentUser.id,
            title: title,
            total_amount: amount,
            monthly_amount: monthly,
            tenor_bulan: tenor,
            due_date: dueDate,
            category: category,
            paid_amount: 0,
            note: note
        }]);

    if (error) {
        showToast(error.message, "error");
        return;
    }

    closeReminderModal();
    showToast("Reminder berhasil disimpan!", "success");
    await loadData();
}
window.saveReminder = saveReminder;

async function deleteReminder(id) {
    if (!confirm("Hapus reminder ini?")) return;
    const { error } = await supabaseClient
        .from("payment_reminders")
        .delete()
        .eq("id", id);

    if (error) {
        showToast(error.message, "error");
        return;
    }
    showToast("Reminder berhasil dihapus", "success");
    await loadData();
}
window.deleteReminder = deleteReminder;

async function submitReminderPay() {
    const amt = Number(document.getElementById("reminderPayAmount").value);
    const accSelect = document.getElementById("reminderPayAccount");
    const acc = accSelect ? accSelect.value : "BCA";

    if (!amt || amt <= 0) {
        showToast("Jumlah pembayaran tidak valid.", "error");
        return;
    }

    const r = reminders.find(x => String(x.id) === String(reminderPayId));
    if (!r) return;

    if (accountBalance(acc) < amt) {
        showToast(`Saldo ${acc} tidak mencukupi`, "error");
        return;
    }

    const newPaid = (r.paid_amount || 0) + amt;
    const today = new Date().toISOString().split("T")[0];

    const { error: remError } = await supabaseClient
        .from("payment_reminders")
        .update({ paid_amount: newPaid })
        .eq("id", reminderPayId);

    if (remError) {
        showToast(remError.message, "error");
        return;
    }

    await supabaseClient.from("transactions").insert([{
        user_id: currentUser.id,
        type: "expense",
        description: `Bayar ${r.title}`,
        amount: amt,
        account: acc,
        category: r.category || "Tagihan",
        transaction_date: today
    }]);

    const willComplete = (r.total_amount && newPaid >= r.total_amount) ||
        (r.tenor_bulan > 0 && r.monthly_amount > 0 && Math.floor(newPaid / r.monthly_amount) >= r.tenor_bulan);

    closeReminderPayModal();
    await loadData();

    if (willComplete) {
        showToast("Hutang ini sudah lunas semua! 🎉", "success");
    } else {
        showToast(`Pembayaran ${formatRupiah(amt)} tercatat via ${acc}!`, "success");
    }
}
window.submitReminderPay = submitReminderPay;

function reminderStatusOf(r) {
    const paid = r.paid_amount || 0;
    if (r.total_amount && paid >= r.total_amount) return "Lunas";
    const today = new Date().toISOString().split("T")[0];
    if (r.due_date && r.due_date < today) return "Terlambat";
    return "Aktif";
}

function getDaysCountdown(targetDateStr) {
    if (!targetDateStr) return { label: '-', urgent: false };
    const today = new Date().toISOString().split("T")[0];
    const t1 = new Date(today);
    const t2 = new Date(targetDateStr);
    const diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `Terlambat ${Math.abs(diff)}h`, urgent: true };
    if (diff === 0) return { label: 'Hari Ini', urgent: true };
    if (diff <= 3) return { label: `H-${diff}`, urgent: true };
    return { label: `H-${diff}`, urgent: false };
}

function addOneMonth(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d.toISOString().split("T")[0];
}

async function processRecurringReminders() {
    const today = new Date().toISOString().split("T")[0];
    const toRoll = reminders.filter(r =>
        r.monthly_amount > 0 &&
        !(r.total_amount && (r.paid_amount || 0) >= r.total_amount) &&
        r.due_date && r.due_date < today
    );

    if (toRoll.length === 0) return;

    for (const r of toRoll) {
        let nextDue = r.due_date;
        while (nextDue < today) {
            nextDue = addOneMonth(nextDue);
        }
        const { error } = await supabaseClient
            .from("payment_reminders")
            .update({ due_date: nextDue })
            .eq("id", r.id);

        if (!error) {
            r.due_date = nextDue;
        }
    }
}

function budgetSpent(period, category) {
    return transactions
        .filter(t =>
            t.type === "expense" &&
            t.date &&
            t.date.startsWith(period) &&
            (t.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()
        )
        .reduce((a, b) => a + b.amount, 0);
}

/* ==================== 10. CAROUSEL INTERACTION CONTROLLER ==================== */

function setupWalletCarousel() {
    const carousel = document.getElementById('wallet-carousel');
    if (!carousel || carousel._listenersAdded) return;
    carousel._listenersAdded = true;

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        carouselDidDrag = false;
        carousel.classList.add('is-dragging');
        startX = e.pageX - carousel.offsetLeft;
        scrollStart = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
        carousel.classList.remove('is-dragging');
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        carousel.classList.remove('is-dragging');
        setTimeout(() => { carouselDidDrag = false; }, 100);
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX);
        if (Math.abs(walk) > 6) {
            carouselDidDrag = true;
        }
        carousel.scrollLeft = scrollStart - walk;
    });
}

function handleWalletCarouselScroll() {
    const el = document.getElementById('wallet-carousel');
    if (!el) return;
    const slides = el.querySelectorAll('.wallet-slide');
    if (!slides.length) return;

    const centerPoint = el.scrollLeft + el.clientWidth / 2;
    let closestIdx = 0;
    let minDistance = Infinity;

    slides.forEach((slide, i) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(centerPoint - slideCenter);
        if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
        }
    });

    activeWalletIndex = closestIdx;
    updateWalletDots();
}
window.handleWalletCarouselScroll = handleWalletCarouselScroll;

function updateWalletDots() {
    const dotsEl = document.getElementById('wallet-dots');
    if (!dotsEl) return;
    WALLET_CARDS.forEach((_, i) => {
        const dot = document.getElementById(`wdot-${i}`);
        if (!dot) return;
        if (i === activeWalletIndex) {
            dot.className = "h-1.5 rounded-full transition-all duration-200 w-5 bg-bordeaux dark:bg-[#F3A6B8]";
        } else {
            dot.className = "h-1.5 rounded-full transition-all duration-200 w-1.5 bg-[#D4CBBF] dark:bg-obsidian-border";
        }
    });
}

function scrollToWalletCard(index) {
    const carousel = document.getElementById('wallet-carousel');
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.wallet-slide');
    if (!slides[index]) return;
    activeWalletIndex = index;
    slides[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    updateWalletDots();
}
window.scrollToWalletCard = scrollToWalletCard;

function stepWalletCarousel(dir) {
    const nextIdx = Math.max(0, Math.min(WALLET_CARDS.length - 1, activeWalletIndex + dir));
    scrollToWalletCard(nextIdx);
}
window.stepWalletCarousel = stepWalletCarousel;

/* ==================== 11. CORE UI RENDERER ==================== */

function render() {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);

    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
        if (t.date && t.date.startsWith(currentMonthPrefix)) {
            if (t.type === "income") monthIncome += t.amount;
            else monthExpense += t.amount;
        }
    });

    let totalSaldo = 0;
    transactions.forEach(t => {
        totalSaldo += t.type === "income" ? t.amount : -t.amount;
    });

    // 1. Render Swipeable Wallet Carousel
    const carousel = document.getElementById('wallet-carousel');
    if (carousel) {
        carousel.innerHTML = WALLET_CARDS.map((w, idx) => {
            const bal = w.id === 'ALL' ? totalSaldo : accountBalance(w.id);
            const targetAcc = w.id === 'ALL' ? 'BCA' : w.id;
            return `
            <div data-wallet-idx="${idx}" class="wallet-slide snap-center shrink-0 w-[85%] sm:w-[320px] ${w.styleClass} rounded-[28px] p-5 text-white shadow-card-3d relative overflow-hidden flex flex-col justify-between min-h-[192px] transition-transform duration-200">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-white/70">${w.subtitle}</span>
                        <h3 class="text-base font-extrabold mt-0.5">${w.title}</h3>
                    </div>
                    <div class="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                        <i data-lucide="${w.icon}" class="w-4 h-4 text-white"></i>
                    </div>
                </div>

                <div class="my-2">
                    <p class="font-money text-[24px] font-extrabold tracking-tight">${formatRupiah(bal, privacyMode)}</p>
                    ${w.id === 'ALL'
                        ? `<div class="flex items-center gap-3 mt-1.5 text-[11px] font-money">
                            <span class="text-emerald-300">↓ ${shortRp(monthIncome)}</span>
                            <span class="text-rose-300">↑ ${shortRp(monthExpense)}</span>
                           </div>`
                        : `<p class="font-money text-[11px] text-white/65 mt-1">${w.number}</p>`
                    }
                </div>

                <div class="flex items-center gap-2 pt-1">
                    <button type="button" onclick="if(!carouselDidDrag) openModalExpense('${targetAcc}')" class="flex-1 min-h-[36px] rounded-xl bg-white text-charcoal font-extrabold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i> Catat
                    </button>
                    <button type="button" onclick="if(!carouselDidDrag) openTransfer('${targetAcc}')" class="flex-1 min-h-[36px] rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition">
                        <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i> Transfer
                    </button>
                </div>
            </div>
            `;
        }).join('');

        const dotsEl = document.getElementById('wallet-dots');
        if (dotsEl) {
            dotsEl.innerHTML = WALLET_CARDS.map((_, i) => `
                <button type="button" aria-label="Pilih kartu ${i + 1}" onclick="scrollToWalletCard(${i})" id="wdot-${i}" class="h-1.5 rounded-full transition-all duration-200 ${i === activeWalletIndex ? 'w-5 bg-bordeaux dark:bg-[#F3A6B8]' : 'w-1.5 bg-[#D4CBBF] dark:bg-obsidian-border'}"></button>
            `).join('');
        }
        setupWalletCarousel();
    }

    // 2. Arta Safe-to-Spend Daily Calculator
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonthBudgets = budgets.filter(b => b.period === currentMonthPrefix);
    const totalBudget = currentMonthBudgets.reduce((a, b) => a + (b.budget_limit || 0), 0);
    const remainingBudget = Math.max(0, totalBudget - monthExpense);
    const safeDaily = remainingBudget > 0 ? Math.floor(remainingBudget / daysLeft) : 0;

    const daysInfo = document.getElementById('arta-days-info');
    if (daysInfo) daysInfo.textContent = `Sisa ${daysLeft} hari di ${monthNames[now.getMonth()]}`;

    const artaSafeEl = document.getElementById('arta-daily-safe-text');
    if (artaSafeEl) {
        artaSafeEl.textContent = privacyMode
            ? 'Aman belanja Rp ••••• / hari'
            : totalBudget > 0
                ? `Aman belanja ${formatRupiah(safeDaily)} / hari`
                : 'Belum ada budget bulanan aktif';
    }

    // 3. Feature Modules Badges on Home
    const budgetPct = totalBudget > 0 ? Math.round((monthExpense / totalBudget) * 100) : 0;
    const bPctEl = document.getElementById('home-budget-pct');
    if (bPctEl) {
        bPctEl.textContent = `${budgetPct}%`;
        bPctEl.className = `font-money text-[10px] font-bold ${budgetPct > 100 ? 'text-crimson' : budgetPct > 80 ? 'text-amberwarm' : 'text-jade'}`;
    }

    const gCountEl = document.getElementById('home-goals-count');
    if (gCountEl) gCountEl.textContent = `${goals.length}`;

    const rCountEl = document.getElementById('home-rem-count');
    if (rCountEl) rCountEl.textContent = `${reminders.length}`;

    const gfCountEl = document.getElementById('home-gift-count');
    if (gfCountEl) gfCountEl.textContent = `${giftItems.filter(g => g.status !== 'Sudah Dibeli').length}`;

    // 4. Due Soon Spotlight Widget
    const spotEl = document.getElementById('reminderDashCard');
    const activeReminders = reminders.filter(r => reminderStatusOf(r) !== "Lunas").sort((a,b) => (a.due_date || '').localeCompare(b.due_date || ''));
    if (spotEl) {
        if (activeReminders.length > 0) {
            const nextRem = activeReminders[0];
            const cd = getDaysCountdown(nextRem.due_date);
            spotEl.innerHTML = `
            <div class="bg-amberwarm-soft/75 dark:bg-amberwarm/15 border border-amberwarm/30 rounded-[24px] p-4 flex items-center justify-between gap-3 shadow-editorial">
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-md ${cd.urgent ? 'bg-crimson text-white' : 'bg-amberwarm text-white'} text-[10px] font-extrabold">${cd.label}</span>
                        <span class="text-[11px] font-bold text-amberwarm">Jatuh Tempo Terdekat</span>
                    </div>
                    <p class="text-xs font-extrabold truncate mt-1">🔔 ${escapeHtml(nextRem.title)}</p>
                    <p class="font-money text-xs font-extrabold text-crimson mt-0.5">${formatRupiah(nextRem.monthly_amount, privacyMode)}/bln</p>
                </div>
                <button onclick="openReminderPayModal('${nextRem.id}')" class="min-h-[40px] px-4 rounded-xl bg-bordeaux text-white text-xs font-extrabold shrink-0 active:scale-95 transition shadow-sm">
                    Lunasi
                </button>
            </div>
            `;
        } else {
            spotEl.innerHTML = `
            <div class="bg-linen-card dark:bg-obsidian-card border border-linen-border dark:border-obsidian-border rounded-[24px] p-4 text-center text-xs text-[#73685E] dark:text-[#9E9389]">
                Semua reminder sudah lunas / tidak ada tagihan aktif! 🎉
            </div>
            `;
        }
    }

    // Bell notification dot
    const bellDot = document.getElementById('topbar-bell-dot');
    if (bellDot) {
        bellDot.classList.toggle('hidden', activeReminders.length === 0);
    }

    // 5. Recent Transactions on Home
    const homeTxList = document.getElementById('txListHome');
    if (homeTxList) {
        const recent = transactions.slice(0, 4);
        if (recent.length === 0) {
            homeTxList.innerHTML = `<div class="bg-linen-card dark:bg-obsidian-card rounded-[22px] p-6 text-center text-xs text-[#73685E] dark:text-[#9E9389] border border-linen-border dark:border-obsidian-border">Belum ada catatan transaksi.</div>`;
        } else {
            homeTxList.innerHTML = recent.map(t => renderTxCardHTML(t)).join('');
        }
    }

    // 6. Dompet / Rekening Page
    const accTotalEl = document.getElementById('accTotalVal');
    if (accTotalEl) accTotalEl.textContent = formatRupiah(totalSaldo, privacyMode);

    const accGrid = document.getElementById('accGrid');
    if (accGrid) {
        accGrid.innerHTML = ACCOUNTS.map(acc => {
            const meta = ACC_META[acc] || { icon: "wallet", color: "#6B1D2F", bg: "rgba(107, 29, 47, 0.1)", cardClass: "card-bca", desc: "" };
            const bal = accountBalance(acc);
            const pct = totalSaldo > 0 ? Math.max(0, Math.round((bal / totalSaldo) * 100)) : 0;
            return `
            <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-4 border border-linen-border dark:border-obsidian-border shadow-editorial space-y-3 transition hover:border-bordeaux">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style="background-color:${meta.bg}; color:${meta.color}">
                            <i data-lucide="${meta.icon}" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="text-sm font-extrabold">${escapeHtml(acc)}</h4>
                            <p class="text-[11px] text-[#73685E] dark:text-[#9E9389]">${escapeHtml(meta.desc)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-money text-sm font-extrabold">${formatRupiah(bal, privacyMode)}</p>
                        <span class="font-money text-[10px] text-[#73685E] dark:text-[#9E9389]">${pct}% dari aset</span>
                    </div>
                </div>

                <div class="w-full h-1.5 rounded-full bg-linen dark:bg-obsidian-elevated overflow-hidden">
                    <div class="h-full rounded-full bg-bordeaux" style="width:${pct}%"></div>
                </div>

                <div class="flex items-center gap-2 pt-1 border-t border-linen-border/60 dark:border-obsidian-border/60">
                    <button onclick="openModalExpense('${acc}')" class="flex-1 min-h-[34px] rounded-xl bg-linen dark:bg-obsidian-elevated hover:bg-linen-muted text-xs font-bold transition flex items-center justify-center gap-1 text-charcoal dark:text-white">
                        <i data-lucide="plus" class="w-3.5 h-3.5 text-crimson"></i> Catat
                    </button>
                    <button onclick="openTransfer('${acc}')" class="flex-1 min-h-[34px] rounded-xl bg-linen dark:bg-obsidian-elevated hover:bg-linen-muted text-xs font-bold transition flex items-center justify-center gap-1 text-charcoal dark:text-white">
                        <i data-lucide="arrow-left-right" class="w-3.5 h-3.5 text-blue-600"></i> Transfer
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    // 7. Render Sub-modules
    renderTxList();
    renderInsights();
    renderBudget();
    renderGoal();
    renderGift();
    renderReminder();
    renderArchive();

    if (window.lucide) lucide.createIcons();
}

/* ==================== 12. COMPONENT RENDERERS ==================== */

function renderTxCardHTML(t, withActions = false) {
    const isInc = t.type === 'income';
    const isTrf = t.category === 'Transfer' || (t.desc && t.desc.toLowerCase().startsWith('transfer'));
    const meta = CAT_META[t.category] || { icon: 'tag', color: '#6B1D2F', bg: 'rgba(107, 29, 47, 0.1)' };
    const sign = isInc ? '+' : isTrf ? '⇄ ' : '-';
    const amountColor = isInc ? 'text-jade' : isTrf ? 'text-blue-600 dark:text-blue-400' : 'text-crimson';
    const dateFormatted = t.date ? new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '';

    return `
    <div class="bg-linen-card dark:bg-obsidian-card rounded-[22px] p-3.5 border border-linen-border dark:border-obsidian-border shadow-editorial flex items-center justify-between gap-3 transition hover:border-bordeaux">
        <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style="background-color:${meta.bg}; color:${meta.color}">
                <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
                <p class="text-xs font-extrabold truncate text-charcoal dark:text-white">${escapeHtml(t.desc || t.category)}</p>
                <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#73685E] dark:text-[#9E9389] truncate">
                    <span class="font-bold px-1.5 py-0.5 rounded-md bg-linen dark:bg-obsidian-elevated text-[10px]">${escapeHtml(t.account || '')}</span>
                    <span>•</span>
                    <span>${escapeHtml(t.category || '')}</span>
                    <span>•</span>
                    <span>${dateFormatted}</span>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
            <div class="font-money text-xs font-extrabold tabular-nums ${amountColor}">
                ${sign} ${formatRupiah(t.amount, privacyMode)}
            </div>
            ${withActions ? `
                <div class="flex items-center gap-0.5">
                    <button onclick="editTx(${t.id})" class="w-7 h-7 rounded-lg hover:bg-linen dark:hover:bg-obsidian-elevated text-[#73685E] hover:text-bordeaux flex items-center justify-center transition" title="Ubah">
                        <i data-lucide="pencil" class="w-3 h-3"></i>
                    </button>
                    <button onclick="deleteTx(${t.id})" class="w-7 h-7 rounded-lg hover:bg-crimson-soft text-[#73685E] hover:text-crimson flex items-center justify-center transition" title="Hapus">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    </div>
    `;
}

function renderTxList() {
    const container = document.getElementById("txListFull");
    if (!container) return;

    const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const fType = document.getElementById("filterType")?.value || "all";
    const sOrder = document.getElementById("sortOrder")?.value || "newest";
    const fAcc = document.getElementById("filterAccount")?.value || "all";
    const fCat = document.getElementById("filterCategory")?.value || "all";

    let filtered = transactions.filter(t => {
        if (fType !== "all") {
            if (fType === "transfer") {
                if (t.category !== "Transfer" && !(t.desc && t.desc.toLowerCase().startsWith("transfer"))) return false;
            } else if (t.type !== fType) {
                return false;
            }
        }
        if (fAcc !== "all" && t.account !== fAcc) return false;
        if (fCat !== "all" && (t.category || "").toLowerCase() !== fCat.toLowerCase()) return false;
        if (search) {
            const str = `${t.desc} ${t.category} ${t.account} ${t.amount}`.toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sOrder === "oldest") return (a.date || "").localeCompare(b.date || "");
        if (sOrder === "highest") return (b.amount || 0) - (a.amount || 0);
        return (b.date || "").localeCompare(a.date || "");
    });

    const badge = document.getElementById("txCountBadge");
    if (badge) badge.textContent = `${filtered.length} transaksi`;

    if (filtered.length === 0) {
        container.innerHTML = `<div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-8 text-center text-xs text-[#73685E] dark:text-[#9E9389] border border-linen-border dark:border-obsidian-border">Tidak ada transaksi yang sesuai filter.</div>`;
        return;
    }

    // Grouping by Date
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const groups = {};

    filtered.forEach(t => {
        const d = t.date || 'Lainnya';
        if (!groups[d]) groups[d] = [];
        groups[d].push(t);
    });

    container.innerHTML = Object.keys(groups).map(d => {
        let label = d;
        if (d === today) label = `Hari Ini • ${d}`;
        else if (d === yesterday) label = `Kemarin • ${d}`;
        else if (d !== 'Lainnya') {
            const dt = new Date(d);
            label = dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        }
        return `
        <div class="space-y-2">
            <h4 class="text-[11px] font-extrabold uppercase tracking-wider text-[#73685E] dark:text-[#9E9389] px-1">${escapeHtml(label)}</h4>
            <div class="space-y-2">
                ${groups[d].map(t => renderTxCardHTML(t, true)).join('')}
            </div>
        </div>
        `;
    }).join('');
}

function resetTxFilters() {
    const s = document.getElementById("searchInput");
    if (s) s.value = "";
    const fT = document.getElementById("filterType");
    if (fT) fT.value = "all";
    const sO = document.getElementById("sortOrder");
    if (sO) sO.value = "newest";
    const fA = document.getElementById("filterAccount");
    if (fA) fA.value = "all";
    const fC = document.getElementById("filterCategory");
    if (fC) fC.value = "all";
    renderTxList();
}
window.resetTxFilters = resetTxFilters;

/* ==================== 13. INSIGHTS & ANALYTICS ==================== */

function setAnalyticsMode(mode) {
    analyticsMode = mode;
    const btnExp = document.getElementById('seg-expense');
    const btnInc = document.getElementById('seg-income');
    if (btnExp && btnInc) {
        if (mode === 'expense') {
            btnExp.className = "min-h-[40px] rounded-xl bg-linen-card dark:bg-obsidian-card text-xs font-extrabold shadow-sm transition";
            btnInc.className = "min-h-[40px] rounded-xl text-xs font-bold text-[#73685E] dark:text-[#9E9389] transition";
        } else {
            btnInc.className = "min-h-[40px] rounded-xl bg-linen-card dark:bg-obsidian-card text-xs font-extrabold shadow-sm transition";
            btnExp.className = "min-h-[40px] rounded-xl text-xs font-bold text-[#73685E] dark:text-[#9E9389] transition";
        }
    }
    renderInsights();
    if (window.lucide) lucide.createIcons();
}
window.setAnalyticsMode = setAnalyticsMode;

function renderInsights() {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    let monthInc = 0;
    let monthExp = 0;

    const monthTxs = transactions.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
    monthTxs.forEach(t => {
        if (t.type === 'income') monthInc += t.amount;
        else monthExp += t.amount;
    });

    const netVal = monthInc - monthExp;
    const periodLabel = document.getElementById('an-period-label');
    if (periodLabel) periodLabel.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const insNet = document.getElementById('insNetVal');
    if (insNet) {
        insNet.textContent = analyticsMode === 'expense'
            ? formatRupiah(monthExp, privacyMode)
            : formatRupiah(monthInc, privacyMode);
    }

    const insInc = document.getElementById('insIncome');
    if (insInc) insInc.textContent = formatRupiah(monthInc, privacyMode);

    const insExp = document.getElementById('insExpense');
    if (insExp) insExp.textContent = formatRupiah(monthExp, privacyMode);

    const badge = document.getElementById('insSavingRateBadge');
    if (badge) {
        const rate = monthInc > 0 ? Math.max(0, Math.round((netVal / monthInc) * 100)) : 0;
        badge.textContent = `${rate}% Rasio Hemat`;
        badge.className = `font-money text-xs font-extrabold px-3 py-1 rounded-full ${rate >= 20 ? 'bg-jade-soft dark:bg-jade/25 text-jade dark:text-[#6EE7B7]' : 'bg-amberwarm-soft dark:bg-amberwarm/25 text-amberwarm'}`;
    }

    // Weekly Bars Calculation
    const weeks = [0, 0, 0, 0];
    monthTxs
        .filter(t => t.type === analyticsMode)
        .forEach(t => {
            const day = new Date(t.date).getDate();
            if (day <= 7) weeks[0] += t.amount;
            else if (day <= 14) weeks[1] += t.amount;
            else if (day <= 21) weeks[2] += t.amount;
            else weeks[3] += t.amount;
        });

    const maxWeek = Math.max(...weeks, 1);
    const barsContainer = document.getElementById('an-weekly-bars');
    if (barsContainer) {
        barsContainer.innerHTML = weeks.map((wVal, idx) => {
            const hPct = Math.max(12, Math.round((wVal / maxWeek) * 100));
            const isSel = idx === selectedWeekIndex;
            return `
            <div onclick="selectWeekBar(${idx}, ${wVal})" class="flex flex-col items-center gap-1.5 cursor-pointer group">
                <span class="font-money text-[10px] font-bold text-[#73685E] dark:text-[#9E9389]">${shortRp(wVal)}</span>
                <div class="w-full bg-linen dark:bg-obsidian-elevated rounded-xl h-20 flex items-end p-1">
                    <div class="w-full rounded-lg transition-all duration-300 ${isSel ? 'bg-bordeaux' : 'bg-[#D4CBBF] dark:bg-obsidian-border group-hover:bg-bordeaux/60'}" style="height:${hPct}%"></div>
                </div>
                <span class="text-[10px] font-extrabold ${isSel ? 'text-bordeaux dark:text-[#F3A6B8]' : 'text-[#73685E] dark:text-[#9E9389]'}">M${idx + 1}</span>
            </div>
            `;
        }).join('');
    }

    const weekInfo = document.getElementById('an-selected-week-info');
    if (weekInfo) {
        weekInfo.textContent = `Minggu ${selectedWeekIndex + 1}: ${formatRupiah(weeks[selectedWeekIndex], privacyMode)}`;
    }

    // Category Aggregation & Chart.js
    const catTotals = {};
    monthTxs
        .filter(t => t.type === analyticsMode)
        .forEach(t => {
            const cat = t.category || 'Lainnya';
            catTotals[cat] = (catTotals[cat] || 0) + t.amount;
        });

    const catEntries = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
    const labels = catEntries.map(c => c[0]);
    const values = catEntries.map(c => c[1]);
    const totalTarget = values.reduce((a, b) => a + b, 0);

    const donutLabel = document.getElementById('an-donut-label');
    if (donutLabel) {
        donutLabel.textContent = shortRp(totalTarget);
    }

    const chartColors = ["#6B1D2F", "#15803D", "#D97706", "#B91C1C", "#0284C7", "#7C3AED", "#DB2777", "#64748B"];
    const chartCanvas = document.getElementById("categoryChart");
    if (chartCanvas) {
        const ctx = chartCanvas.getContext("2d");
        if (categoryChart instanceof Chart) {
            categoryChart.destroy();
        }

        if (labels.length > 0) {
            categoryChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: chartColors.slice(0, labels.length),
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "72%",
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.label}: ${formatRupiah(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Legend items
    const legendContainer = document.getElementById('an-donut-legend');
    if (legendContainer) {
        legendContainer.innerHTML = catEntries.slice(0, 3).map(([cat, val], i) => `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 truncate">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${chartColors[i % chartColors.length]}"></span>
                    <span class="truncate font-bold">${escapeHtml(cat)}</span>
                </div>
                <span class="font-money font-extrabold shrink-0 ml-1">${totalTarget > 0 ? Math.round((val / totalTarget) * 100) : 0}%</span>
            </div>
        `).join('');
    }

    // Breakdown Bars
    const breakdown = document.getElementById('catBreakdown');
    if (breakdown) {
        if (catEntries.length === 0) {
            breakdown.innerHTML = `<div class="text-center py-6 text-xs text-[#73685E] dark:text-[#9E9389]">Belum ada ${analyticsMode === 'expense' ? 'pengeluaran' : 'pemasukan'} bulan ini.</div>`;
        } else {
            breakdown.innerHTML = catEntries.map(([cat, val], idx) => {
                const meta = CAT_META[cat] || { icon: "tag", color: "#6B1D2F", bg: "rgba(107, 29, 47, 0.1)" };
                const pct = totalTarget > 0 ? ((val / totalTarget) * 100).toFixed(1) : 0;
                const barColor = chartColors[idx % chartColors.length];
                return `
                <div class="space-y-1.5 py-1">
                    <div class="flex items-center justify-between text-xs font-semibold">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style="background-color:${meta.bg}; color:${meta.color}">
                                <i data-lucide="${meta.icon}" class="w-3.5 h-3.5"></i>
                            </div>
                            <span class="font-bold truncate">${escapeHtml(cat)}</span>
                        </div>
                        <div class="font-money shrink-0">
                            <span class="font-extrabold">${formatRupiah(val, privacyMode)}</span>
                            <span class="text-[#73685E] dark:text-[#9E9389] text-[11px] ml-1">(${pct}%)</span>
                        </div>
                    </div>
                    <div class="w-full h-2 rounded-full bg-linen dark:bg-obsidian-elevated overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-300" style="width:${pct}%; background-color:${barColor}"></div>
                    </div>
                </div>
                `;
            }).join('');
        }
    }
}

function selectWeekBar(idx, val) {
    selectedWeekIndex = idx;
    const weekInfo = document.getElementById('an-selected-week-info');
    if (weekInfo) {
        weekInfo.textContent = `Minggu ${idx + 1}: ${formatRupiah(val, privacyMode)}`;
    }
    renderInsights();
}
window.selectWeekBar = selectWeekBar;

/* ==================== 14. SUB-MODULE RENDERERS ==================== */

function renderBudget() {
    const wrap = document.getElementById("budgetList");
    if (!wrap) return;

    if (!budgets || budgets.length === 0) {
        wrap.innerHTML = `
        <div class="bg-linen-card dark:bg-obsidian-card rounded-[26px] p-8 text-center border border-linen-border dark:border-obsidian-border space-y-3 shadow-editorial">
            <div class="w-12 h-12 rounded-2xl bg-bordeaux-soft text-bordeaux flex items-center justify-center mx-auto text-xl">🎯</div>
            <h3 class="text-base font-extrabold">Belum ada Budget</h3>
            <p class="text-xs text-[#73685E] dark:text-[#9E9389] max-w-xs mx-auto">Tambahkan budget agar Arta membantu mengontrol batas pengeluaranmu.</p>
            <button class="min-h-[40px] px-4 rounded-xl bg-bordeaux text-white text-xs font-extrabold" onclick="openBudgetModal()">+ Tambah Budget</button>
        </div>`;
        return;
    }

    wrap.innerHTML = budgets.map(b => budgetCard(b)).join("");
}

function budgetCard(b) {
    const spent = budgetSpent(b.period, b.category);
    const percent = Math.min((spent / b.budget_limit) * 100, 100);
    const remain = Math.max(b.budget_limit - spent, 0);
    const overBudget = spent > b.budget_limit;
    const meta = CAT_META[b.category] || { icon: 'pie-chart', color: '#6B1D2F', bg: 'rgba(107, 29, 47, 0.1)' };

    let status = "Aman";
    let statusClass = "bg-jade-soft text-jade dark:text-[#6EE7B7]";
    let barColor = "bg-jade";

    if (percent >= 80) {
        status = "Hampir Habis";
        statusClass = "bg-amberwarm-soft text-amberwarm dark:text-[#FCD34D]";
        barColor = "bg-amberwarm";
    }
    if (percent >= 100 || overBudget) {
        status = "Melebihi Budget";
        statusClass = "bg-crimson-soft text-crimson dark:text-[#FDA4AF]";
        barColor = "bg-crimson";
    }

    return `
    <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-4 border border-linen-border dark:border-obsidian-border shadow-editorial space-y-3 transition hover:border-bordeaux">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background-color:${meta.bg}; color:${meta.color}">
                    <i data-lucide="${meta.icon}" class="w-4 h-4"></i>
                </div>
                <div>
                    <h4 class="text-xs font-extrabold text-charcoal dark:text-white">${escapeHtml(b.category)}</h4>
                    <p class="text-[10px] text-[#73685E] dark:text-[#9E9389]">${b.period || ''}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${statusClass}">${status}</span>
                <button onclick="deleteBudget('${b.id}')" class="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-crimson flex items-center justify-center transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>

        <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-extrabold font-money">
                <span>${formatRupiah(spent, privacyMode)}</span>
                <span class="text-[#73685E] dark:text-[#9E9389] font-normal">${formatRupiah(b.budget_limit, privacyMode)}</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-linen dark:bg-obsidian-elevated overflow-hidden">
                <div class="h-full rounded-full ${barColor} transition-all duration-300" style="width:${percent}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-[#73685E] dark:text-[#9E9389] font-semibold">
                <span>${percent.toFixed(0)}% terpakai</span>
                <span>${overBudget ? 'Lebih ' + formatRupiah(spent - b.budget_limit, privacyMode) : 'Sisa ' + formatRupiah(remain, privacyMode)}</span>
            </div>
        </div>
    </div>
    `;
}

function renderGoal() {
    const wrap = document.getElementById("goalList");
    if (!wrap) return;

    if (!goals || goals.length === 0) {
        wrap.innerHTML = `
        <div class="bg-linen-card dark:bg-obsidian-card rounded-[26px] p-8 text-center border border-linen-border dark:border-obsidian-border space-y-3 shadow-editorial">
            <div class="w-12 h-12 rounded-2xl bg-jade-soft text-jade flex items-center justify-center mx-auto text-xl">🎯</div>
            <h3 class="text-base font-extrabold">Belum ada Goal</h3>
            <p class="text-xs text-[#73685E] dark:text-[#9E9389] max-w-xs mx-auto">Buat target tabungan pertamamu untuk liburan, barang impian, atau dana darurat.</p>
            <button class="min-h-[40px] px-4 rounded-xl bg-bordeaux text-white text-xs font-extrabold" onclick="openGoalModal()">+ Tambah Goal</button>
        </div>`;
        return;
    }

    wrap.innerHTML = goals.map(g => goalCard(g)).join("");
}

function goalCard(g) {
    const saved = g.saved_amount || 0;
    const target = g.target_amount || 1;
    const percent = Math.min((saved / target) * 100, 100);
    const remain = Math.max(target - saved, 0);

    return `
    <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-4 border border-linen-border dark:border-obsidian-border shadow-editorial space-y-3 transition hover:border-bordeaux">
        <div class="flex items-center justify-between">
            <div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-jade-soft dark:bg-jade/20 text-jade dark:text-[#6EE7B7]">${escapeHtml(g.category || 'Target')}</span>
                <h4 class="text-sm font-extrabold text-charcoal dark:text-white mt-1">${escapeHtml(g.name)}</h4>
                <p class="text-[11px] text-[#73685E] dark:text-[#9E9389]">${escapeHtml(g.account || '')} • Target ${g.target_date || '-'}</p>
            </div>
            <button onclick="deleteGoal('${g.id}')" class="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-crimson flex items-center justify-center transition">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>

        <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-extrabold font-money">
                <span class="text-jade">${formatRupiah(saved, privacyMode)}</span>
                <span class="text-[#73685E] dark:text-[#9E9389] font-normal">${formatRupiah(target, privacyMode)}</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-linen dark:bg-obsidian-elevated overflow-hidden">
                <div class="h-full rounded-full bg-jade transition-all duration-300" style="width:${percent}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-[#73685E] dark:text-[#9E9389] font-semibold">
                <span>${percent.toFixed(0)}% terkumpul</span>
                <span>${remain === 0 ? 'Tercapai! 🎉' : 'Kurang ' + formatRupiah(remain, privacyMode)}</span>
            </div>
        </div>

        <div class="flex items-center gap-2 pt-1 border-t border-linen-border/60 dark:border-obsidian-border/60">
            <button onclick="openGoalDepositModal('${g.id}', 'withdraw')" class="min-h-[36px] px-3 rounded-xl bg-linen dark:bg-obsidian-elevated border border-linen-border dark:border-obsidian-border text-[11px] font-extrabold text-[#73685E] dark:text-[#9E9389] hover:text-crimson flex items-center justify-center gap-1 active:scale-95 transition">
                <span>Tarik</span>
            </button>
            <button onclick="openGoalDepositModal('${g.id}', 'deposit')" class="flex-1 min-h-[36px] rounded-xl bg-jade text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm hover:bg-emerald-600">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>+ Setor Tabungan</span>
            </button>
        </div>
    </div>
    `;
}

function renderGift() {
    const wrap = document.getElementById("giftList");
    if (!wrap) return;

    const unboughtCount = giftItems.filter(g => g.status !== "Sudah Dibeli").length;
    const badge = document.getElementById("badgeGiftsCount");
    if (badge) badge.textContent = `${unboughtCount} rencana kado`;

    if (!giftItems || giftItems.length === 0) {
        wrap.innerHTML = `
        <div class="bg-linen-card dark:bg-obsidian-card rounded-[26px] p-8 text-center border border-linen-border dark:border-obsidian-border space-y-3 shadow-editorial">
            <div class="w-12 h-12 rounded-2xl bg-crimson-soft text-crimson flex items-center justify-center mx-auto text-xl">🎁</div>
            <h3 class="text-base font-extrabold">Belum ada Gift</h3>
            <p class="text-xs text-[#73685E] dark:text-[#9E9389] max-w-xs mx-auto">Catat rencana kado agar tidak lupa menyiapkan dananya.</p>
            <button class="min-h-[40px] px-4 rounded-xl bg-bordeaux text-white text-xs font-extrabold" onclick="openGiftModal()">+ Tambah Gift</button>
        </div>`;
        return;
    }

    wrap.innerHTML = giftItems.map(g => giftCard(g)).join("");
}

function giftCard(g) {
    const bought = g.status === "Sudah Dibeli";
    const today = new Date();
    const daysLeft = g.event_date ? Math.ceil((new Date(g.event_date) - today) / 86400000) : null;
    const dateStr = g.event_date ? new Date(g.event_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

    return `
    <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-4 border border-linen-border dark:border-obsidian-border shadow-editorial space-y-3 transition hover:border-bordeaux">
        <div class="flex items-center justify-between">
            <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-crimson-soft dark:bg-crimson/20 text-crimson dark:text-[#FDA4AF]">${escapeHtml(g.category || 'Gift')}</span>
                    ${daysLeft !== null ? `<span class="text-[10px] text-[#73685E] dark:text-[#9E9389]">${daysLeft <= 0 ? (daysLeft === 0 ? 'Hari ini' : 'Lewat') : daysLeft + ' hari lagi'}</span>` : ''}
                </div>
                <h4 class="text-xs font-extrabold text-charcoal dark:text-white mt-1 truncate">🎁 ${escapeHtml(g.gift_name)}</h4>
                <p class="text-[11px] text-[#73685E] dark:text-[#9E9389]">${dateStr}</p>
                ${g.note ? `<p class="text-[11px] text-[#73685E] dark:text-[#9E9389] italic mt-0.5">${escapeHtml(g.note)}</p>` : ''}
            </div>
            <div class="text-right shrink-0">
                <p class="font-money text-xs font-extrabold tabular-nums">${formatRupiah(g.amount, privacyMode)}</p>
                <button onclick="deleteGift('${g.id}')" class="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-crimson inline-flex items-center justify-center transition mt-1">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
            <button onclick="toggleGiftStatus('${g.id}','${g.status}')" class="flex-1 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 ${
                bought 
                ? 'bg-jade-soft dark:bg-jade/20 text-jade dark:text-[#6EE7B7]' 
                : 'bg-linen dark:bg-obsidian-elevated text-charcoal dark:text-white border border-linen-border dark:border-obsidian-border'
            }">
                <i data-lucide="${bought ? 'check-circle' : 'circle'}" class="w-3.5 h-3.5"></i>
                <span>${bought ? 'Sudah Dibeli' : 'Tandai Sudah Beli'}</span>
            </button>
        </div>
    </div>
    `;
}

function renderReminder() {
    const wrap = document.getElementById("reminderList");
    if (!wrap) return;

    const activeCount = reminders.filter(r => reminderStatusOf(r) !== "Lunas").length;
    const badge = document.getElementById("badgeRemindersCount");
    if (badge) badge.textContent = `${activeCount} reminder aktif`;

    if (!reminders || reminders.length === 0) {
        wrap.innerHTML = `
        <div class="bg-linen-card dark:bg-obsidian-card rounded-[26px] p-8 text-center border border-linen-border dark:border-obsidian-border space-y-3 shadow-editorial">
            <div class="w-12 h-12 rounded-2xl bg-amberwarm-soft text-amberwarm flex items-center justify-center mx-auto text-xl">🔔</div>
            <h3 class="text-base font-extrabold">Belum ada Reminder</h3>
            <p class="text-xs text-[#73685E] dark:text-[#9E9389] max-w-xs mx-auto">Tambahkan cicilan, tagihan, atau hutang yang perlu diingat.</p>
            <button class="min-h-[40px] px-4 rounded-xl bg-bordeaux text-white text-xs font-extrabold" onclick="openReminderModal()">+ Tambah Reminder</button>
        </div>`;
        return;
    }

    wrap.innerHTML = reminders.map(r => reminderCard(r)).join("");
}

function reminderCard(r) {
    const paid = r.paid_amount || 0;
    const isInstallment = r.monthly_amount > 0;
    const hasTotal = r.total_amount !== null && r.total_amount !== undefined && r.total_amount > 0;
    const hasTenor = r.tenor_bulan !== null && r.tenor_bulan !== undefined && r.tenor_bulan > 0;
    const percent = hasTotal ? Math.min((paid / r.total_amount) * 100, 100) : 0;
    const remain = hasTotal ? Math.max(r.total_amount - paid, 0) : 0;
    const status = reminderStatusOf(r);
    const dueStr = r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

    let statusBadge = "bg-amberwarm-soft text-amberwarm dark:text-[#FCD34D]";
    if (status === "Lunas") statusBadge = "bg-jade-soft text-jade dark:text-[#6EE7B7]";
    if (status === "Terlambat") statusBadge = "bg-crimson-soft text-crimson dark:text-[#FDA4AF]";

    let cicilanKe = 0;
    if (isInstallment) {
        cicilanKe = Math.floor(paid / r.monthly_amount);
        if (hasTenor) cicilanKe = Math.min(cicilanKe, r.tenor_bulan);
    }

    return `
    <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] p-4 border border-linen-border dark:border-obsidian-border shadow-editorial space-y-3 transition hover:border-bordeaux">
        <div class="flex items-center justify-between">
            <div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${statusBadge}">${status}</span>
                    <span class="text-[10px] text-[#73685E] dark:text-[#9E9389]">${escapeHtml(r.category || 'Tagihan')}</span>
                </div>
                <h4 class="text-xs font-extrabold text-charcoal dark:text-white mt-1">🔔 ${escapeHtml(r.title)}</h4>
                <p class="text-[11px] text-[#73685E] dark:text-[#9E9389]">Jatuh tempo ${dueStr}</p>
            </div>
            <div class="text-right shrink-0">
                <p class="font-money text-xs font-extrabold tabular-nums text-crimson">${formatRupiah(r.monthly_amount, privacyMode)}/bln</p>
                <button onclick="deleteReminder('${r.id}')" class="w-7 h-7 rounded-lg text-[#94A3B8] hover:text-crimson inline-flex items-center justify-center transition mt-1">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>

        ${hasTotal ? `
        <div class="space-y-1.5">
            <div class="flex justify-between text-xs font-extrabold font-money">
                <span class="text-jade">${formatRupiah(paid, privacyMode)}</span>
                <span class="text-[#73685E] dark:text-[#9E9389] font-normal">${formatRupiah(r.total_amount, privacyMode)}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-linen dark:bg-obsidian-elevated overflow-hidden">
                <div class="h-full rounded-full bg-jade transition-all duration-300" style="width:${percent}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-[#73685E] dark:text-[#9E9389] font-semibold">
                <span>${percent.toFixed(0)}% terbayar ${hasTenor ? `(${cicilanKe}/${r.tenor_bulan} bln)` : ''}</span>
                <span>Sisa ${formatRupiah(remain, privacyMode)}</span>
            </div>
        </div>
        ` : ''}

        ${status !== "Lunas" ? `
        <div class="pt-1 border-t border-linen-border/60 dark:border-obsidian-border/60">
            <button onclick="openPayReminderModal('${r.id}')" class="w-full min-h-[40px] rounded-xl bg-bordeaux text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm hover:bg-bordeaux-light">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>Bayar Tagihan</span>
            </button>
        </div>
        ` : ''}
    </div>
    `;
}

function renderArchive() {
    const wrap = document.getElementById("archiveList");
    if (!wrap) return;

    if (!transactions || transactions.length === 0) {
        wrap.innerHTML = "<div class='empty text-center py-8 text-xs text-[#73685E] dark:text-[#9E9389]'>Belum ada transaksi.</div>";
        return;
    }

    const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    const groups = {};

    transactions.forEach(t => {
        if (!t.date) return;
        const key = t.date.slice(0, 7);
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a,b) => b.localeCompare(a));

    wrap.innerHTML = sortedKeys.map(key => {
        const items = groups[key].sort((a,b) => new Date(b.date) - new Date(a.date));
        const [year, month] = key.split("-");
        const label = monthNames[Number(month) - 1] + " " + year;
        const totalIncome = items.reduce((sum, t) => sum + (t.type === "income" ? t.amount : 0), 0);
        const totalExpense = items.reduce((sum, t) => sum + (t.type === "expense" ? t.amount : 0), 0);
        const net = totalIncome - totalExpense;
        const isExpanded = expandedArchiveMonths.has(key);

        return `
        <div class="bg-linen-card dark:bg-obsidian-card rounded-[24px] border border-linen-border dark:border-obsidian-border shadow-editorial overflow-hidden transition">
            <div class="p-4 cursor-pointer flex items-center justify-between" onclick="toggleArchiveMonth('${key}')">
                <div>
                    <h4 class="text-sm font-extrabold text-charcoal dark:text-white">${label}</h4>
                    <p class="text-[11px] text-[#73685E] dark:text-[#9E9389] mt-0.5 font-money">${items.length} Transaksi • Net: <span class="${net >= 0 ? 'text-jade' : 'text-crimson'} font-bold">${formatRupiah(net, privacyMode)}</span></p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right text-xs font-bold font-money">
                        <div class="text-jade">+${formatRupiah(totalIncome, privacyMode)}</div>
                        <div class="text-crimson">-${formatRupiah(totalExpense, privacyMode)}</div>
                    </div>
                    <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4 text-[#94A3B8]"></i>
                </div>
            </div>
            ${isExpanded ? `
            <div class="border-t border-linen-border dark:border-obsidian-border p-3 space-y-2 bg-linen/50 dark:bg-obsidian-elevated/40">
                ${items.map(t => {
                    const isInc = t.type === 'income';
                    const meta = CAT_META[t.category] || { icon: 'tag', color: '#6B1D2F', bg: 'rgba(107, 29, 47, 0.1)' };
                    return `
                    <div class="flex items-center justify-between py-1.5 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background-color:${meta.bg}; color:${meta.color}">
                                <i data-lucide="${meta.icon}" class="w-3.5 h-3.5"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="font-bold truncate text-charcoal dark:text-white">${escapeHtml(t.desc)}</p>
                                <p class="text-[10px] text-[#73685E] dark:text-[#9E9389]">${escapeHtml(t.account || '')} • ${t.date}</p>
                            </div>
                        </div>
                        <span class="font-money font-extrabold tabular-nums shrink-0 ${isInc ? 'text-jade' : 'text-crimson'}">
                            ${isInc ? '+' : '-'} ${formatRupiah(t.amount, privacyMode)}
                        </span>
                    </div>
                    `;
                }).join('')}
            </div>
            ` : ''}
        </div>
        `;
    }).join("");
}

function toggleArchiveMonth(key) {
    if (expandedArchiveMonths.has(key)) {
        expandedArchiveMonths.delete(key);
    } else {
        expandedArchiveMonths.add(key);
    }
    renderArchive();
    if (window.lucide) lucide.createIcons();
}
window.toggleArchiveMonth = toggleArchiveMonth;

/* ==================== 15. THEME (DARK / LIGHT MODE) ==================== */

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme_dark", isDark ? "true" : "false");

    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        const knob = toggle.querySelector("div");
        if (knob) {
            knob.className = `w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0'}`;
        }
    }

    const icon = document.getElementById("header-theme-icon");
    if (icon) icon.setAttribute("data-lucide", isDark ? "sun" : "moon");

    if (window.lucide) lucide.createIcons();
    showToast(isDark ? "Dark Mode aktif" : "Light Mode aktif", "success");
}
window.toggleDarkMode = toggleDarkMode;

function applySavedDarkMode() {
    const saved = localStorage.getItem("theme_dark") === "true";
    document.documentElement.classList.toggle("dark", saved);
    document.body.classList.toggle("dark-mode", saved);

    const toggle = document.getElementById("darkModeToggle");
    if (toggle) {
        const knob = toggle.querySelector("div");
        if (knob) {
            knob.className = `w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${saved ? 'translate-x-5' : 'translate-x-0'}`;
        }
    }

    const icon = document.getElementById("header-theme-icon");
    if (icon) icon.setAttribute("data-lucide", saved ? "sun" : "moon");

    if (window.lucide) lucide.createIcons();
}

/* ==================== 16. INITIALIZATION & LISTENERS ==================== */

document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    applySavedDarkMode();

    const txForm = document.getElementById('txForm');
    if (txForm) {
        txForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const desc = document.getElementById('descInput').value.trim();
            const amount = parseFloat(document.getElementById('amountInput').value);
            const account = document.getElementById('accountInput').value;
            const category = document.getElementById('categoryInput').value;
            const date = document.getElementById('dateInput').value;
            const editId = document.getElementById('editId').value;

            if (!desc || !amount || amount <= 0 || !date) {
                showToast("Lengkapi semua field dengan benar.", "error");
                return;
            }

            if (editId) {
                const { error } = await supabaseClient
                    .from("transactions")
                    .update({
                        type: currentType,
                        description: desc,
                        amount: amount,
                        account: account,
                        category: category,
                        transaction_date: date
                    })
                    .eq("id", editId);

                if (error) {
                    showToast(error.message, "error");
                    return;
                }
                showToast("Transaksi berhasil diperbarui!", "success");
            } else {
                const { error } = await supabaseClient
                    .from("transactions")
                    .insert([{
                        user_id: currentUser.id,
                        type: currentType,
                        description: desc,
                        amount: amount,
                        account: account,
                        category: category,
                        transaction_date: date
                    }]);

                if (error) {
                    showToast(error.message, "error");
                    return;
                }
                showToast("Transaksi berhasil dicatat!", "success");
            }

            closeModal();
            await loadData();
        });
    }

    if (window.lucide) lucide.createIcons();
});
