let transactions = [];
let budgets = [];
let goals = [];
let giftItems = [];
let reminders = [];
let expandedArchiveMonths = new Set();

let currentType = "income";
let categoryChart = null;
let privacyMode = false;

const supabaseClient = window.supabase.createClient(
    "https://tcmngkjrgkmtvdnyydqc.supabase.co",
    "sb_publishable_qy0g_cQoFggFgsVkzDN1wQ_CiLk9Ds5"
);

const ACCOUNTS = [
    "Tunai",
    "BCA",
    "SeaBank",
    "Bibit",
    "E-Wallet"
];

const ACC_ICONS = {
    Tunai: "💵",
    BCA: "🏦",
    SeaBank: "🏦",
    Bibit: "🏦",
    "E-Wallet": "📱"
};

const ACC_COLORS = {
    Tunai: "#dcfce7",
    BCA: "#dbeafe",
    SeaBank: "#ede9fe",
    Bibit: "#fee2e2",
    "E-Wallet": "#fef3c7"
};

const ACC_META = {
    Tunai: { icon: "banknote", color: "#B87333", bg: "rgba(184, 115, 51, 0.12)", cardClass: "card-tunai", desc: "Dompet fisik & kas tunai" },
    BCA: { icon: "landmark", color: "#1E4E8C", bg: "rgba(30, 78, 140, 0.12)", cardClass: "card-bca", desc: "Rekening operasional harian" },
    SeaBank: { icon: "sparkles", color: "#EA580C", bg: "rgba(234, 88, 12, 0.12)", cardClass: "card-seabank", desc: "Tabungan bunga harian 3.75%" },
    Bibit: { icon: "trending-up", color: "#15803D", bg: "rgba(21, 128, 61, 0.12)", cardClass: "card-bibit", desc: "Portofolio Reksadana & SBN" },
    "E-Wallet": { icon: "qr-code", color: "#7C3AED", bg: "rgba(124, 58, 237, 0.12)", cardClass: "card-ewallet", desc: "GoPay, OVO, Dana & QRIS" }
};

const CAT_ICONS = {
    Umum: "●",
    Makanan: "🍔",
    "Makanan & Minuman": "🍔",
    Transportasi: "🚗",
    Belanja: "🛍",
    Tagihan: "🧾",
    Hiburan: "🎬",
    Gaji: "💰",
    Freelance: "💼",
    Investasi: "📈",
    Tabungan: "🐷",
    Titipan: "🤝",
    "Dana Darurat": "🆘",
    Lainnya: "✳",
    Transfer: "🔄"
};

const CAT_META = {
    Makanan: { icon: "utensils", color: "#B91C1C", bg: "rgba(185, 28, 28, 0.1)" },
    "Makanan & Minuman": { icon: "utensils", color: "#B91C1C", bg: "rgba(185, 28, 28, 0.1)" },
    Transportasi: { icon: "car", color: "#D97706", bg: "rgba(217, 119, 6, 0.1)" },
    Belanja: { icon: "shopping-bag", color: "#6B1D2F", bg: "rgba(107, 29, 47, 0.1)" },
    Tagihan: { icon: "zap", color: "#4F46E5", bg: "rgba(79, 70, 229, 0.1)" },
    Hiburan: { icon: "film", color: "#7C3AED", bg: "rgba(124, 58, 237, 0.1)" },
    Gaji: { icon: "banknote", color: "#15803D", bg: "rgba(21, 128, 61, 0.1)" },
    Freelance: { icon: "briefcase", color: "#0D9488", bg: "rgba(13, 148, 136, 0.1)" },
    Investasi: { icon: "trending-up", color: "#0284C7", bg: "rgba(2, 132, 199, 0.1)" },
    Tabungan: { icon: "piggy-bank", color: "#15803D", bg: "rgba(21, 128, 61, 0.1)" },
    Titipan: { icon: "users", color: "#6366F1", bg: "rgba(99, 102, 241, 0.1)" },
    "Dana Darurat": { icon: "shield-alert", color: "#DC2626", bg: "rgba(220, 38, 38, 0.1)" },
    Transfer: { icon: "arrow-left-right", color: "#0284C7", bg: "rgba(2, 132, 199, 0.1)" },
    Umum: { icon: "circle-dot", color: "#6B7280", bg: "rgba(107, 114, 128, 0.1)" },
    Lainnya: { icon: "sparkles", color: "#6B1D2F", bg: "rgba(107, 29, 47, 0.1)" }
};

const EXPENSE_CATEGORIES = ["Makanan", "Transportasi", "Belanja", "Tagihan", "Hiburan", "Umum", "Lainnya"];
const INCOME_CATEGORIES = ["Gaji", "Investasi", "Freelance", "Umum", "Lainnya"];
