let transactions = [];
let budgets = [];
let goals = [];

let currentType = "income";
let categoryChart = null;

const supabaseClient = window.supabase.createClient(
    "https://tcmngkjrgkmtvdnyydqc.supabase.co",
    "sb_publishable_qy0g_cQoFggFgsVkzDN1wQ_CiLk9Ds5"
);

const ACCOUNTS=[
    "Tunai",
    "BCA",
    "SeaBank",
    "Bibit",
    "E-Wallet"
];

const ACC_ICONS={
    Tunai:"💵",
    BCA:"🏦",
    SeaBank:"🏦",
    Bibit:"🏦",
    "E-Wallet":"📱"
};

const ACC_COLORS={
    Tunai:"#dcfce7",
    BCA:"#dbeafe",
    SeaBank:"#ede9fe",
    Bibit:"#fee2e2",
    "E-Wallet":"#fef3c7"
};

const CAT_ICONS={
    Umum:"●",
    Makanan:"🍔",
    Transportasi:"🚗",
    Belanja:"🛍",
    Tagihan:"🧾",
    Hiburan:"🎬",
    Gaji:"💰",
    Investasi:"📈",
    Lainnya:"✳",
    Transfer:"🔄"
};