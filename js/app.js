

let currentUser = null;
let authMode = "login";

function toggleAuthMode(){

    authMode = authMode === "login" ? "signup" : "login";

    document.getElementById("authError").textContent = "";

    if(authMode === "signup"){
        document.getElementById("authSubtitle").textContent = "Buat akun baru";
        document.getElementById("authSubmitBtn").textContent = "Daftar";
        document.getElementById("authToggleText").textContent = "Sudah punya akun?";
        document.getElementById("authToggleLink").textContent = "Masuk";
    }else{
        document.getElementById("authSubtitle").textContent = "Masuk ke akunmu";
        document.getElementById("authSubmitBtn").textContent = "Masuk";
        document.getElementById("authToggleText").textContent = "Belum punya akun?";
        document.getElementById("authToggleLink").textContent = "Daftar";
    }
}

async function authSubmit(){

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errBox = document.getElementById("authError");

    errBox.textContent = "";

    if(!email || !password){
        errBox.textContent = "Isi email dan password.";
        return;
    }

    if(authMode === "signup"){

        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if(error){
            errBox.textContent = error.message;
            return;
        }

        if(!data.session){
            errBox.textContent = "Cek email kamu untuk konfirmasi akun, lalu login.";
            toggleAuthMode();
            return;
        }

    }else{

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if(error){
            errBox.textContent = "Email atau password salah.";
            return;
        }
    }

    document.getElementById("authEmail").value = "";
    document.getElementById("authPassword").value = "";
}

async function authSignOut(){
    await supabaseClient.auth.signOut();
}

async function initAuth(){

    const { data: { session } } = await supabaseClient.auth.getSession();

    handleAuthState(session);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthState(session);
    });
}

function handleAuthState(session){

    if(session && session.user){

        currentUser = session.user;

        document.getElementById("authScreen").style.display = "none";
        document.getElementById("appScreen").style.display = "block";

        const name = currentUser.email.split("@")[0];
        const hour = new Date().getHours();
        const timeGreet = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
        document.getElementById("homeGreetTitle").textContent = `${timeGreet}, ${name}! 👋`;

        loadData();

    }else{

        currentUser = null;

        document.getElementById("appScreen").style.display = "none";
        document.getElementById("authScreen").style.display = "flex";
    }
}

window.toggleAuthMode = toggleAuthMode;
window.authSubmit = authSubmit;
window.authSignOut = authSignOut;

function formatRupiah(n) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}

async function loadData() {

    const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("transaction_date", { ascending: false });

    console.log(data);
    console.log(error);

    if (error) {
        console.error(error);
        return;
    }

    transactions = data.map(item => ({
        id: item.id,
        type: item.type,
        desc: item.description,
        amount: Number(item.amount),
        account: item.account,
        category: item.category,
        date: item.transaction_date
    }));

    console.log(transactions);
  console.log(budgets);

const { data: budgetData, error: budgetError } =
await supabaseClient
.from("budgets")
.select("*")
.eq("user_id", currentUser.id)
.order("created_at", {
    ascending: false
});

  console.log("Budget Data:", budgetData);
console.log("Budget Error:", budgetError);

  budgets = budgetData || [];
  
if (budgetError) {
    console.error(budgetError);
} else {
    budgets = budgetData;
}

const { data: goalData, error: goalError } =
await supabaseClient
    .from("goals")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

console.log("Goal Data:", goalData);
console.log("Goal Error:", goalError);

if (goalError) {
    console.error(goalError);
} else {
    goals = goalData || [];
}

const { data: giftData, error: giftError } =
await supabaseClient
    .from("gift_tracker")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("event_date", { ascending: true });

if (giftError) {
    console.error(giftError);
} else {
    giftItems = giftData || [];
}

const { data: reminderData, error: reminderError } =
await supabaseClient
    .from("payment_reminders")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("due_date", { ascending: true });

if (reminderError) {
    console.error(reminderError);
} else {
    reminders = reminderData || [];
    await processRecurringReminders();
}

    render();
}

async function saveData() {
    // Tidak digunakan lagi karena data disimpan langsung ke Supabase
}

function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const navMap = {
    home: "navHome",
    history: "navHistory2",
    insight: "navInsight",
    account: "navAccount"
  };

  const navId = navMap[name];
  if(navId){
      const el = document.getElementById(navId);
      if(el) el.classList.add("active");
  }

  if((name === "account" || name === "settings") && currentUser){
      const emailEl = document.getElementById("settingsEmailVal");
      if(emailEl) emailEl.textContent = currentUser.email;
  }

  render();
}

function openModal() {
  document.getElementById('modalTitle').textContent = 'Tambah transaksi';
  document.getElementById('editId').value = '';
  document.getElementById('txForm').reset();
  document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
  setType('income');
  document.getElementById('modalOverlay').classList.add('active');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('active'); }

function openBudgetModal() {

    document.getElementById("budgetModal")
        .classList.add("active");

    document.getElementById("budgetMonth").value =
        new Date().toISOString().slice(0,7);

}

function closeBudgetModal() {

    document.getElementById("budgetModal")
        .classList.remove("active");

}

function openTransfer() {

    document
        .getElementById("transferModal")
        .classList.add("active");

    document.getElementById("transferDate").value =
        new Date().toISOString().split("T")[0];
}

function closeTransfer() {

    document
        .getElementById("transferModal")
        .classList.remove("active");

}

function openGoalModal(){

    closeQuickAction();

    document
        .getElementById("goalModal")
        .classList.add("active");

    document.getElementById("goalDate").value =
        new Date().toISOString().split("T")[0];

}

function closeGoalModal(){

    document
        .getElementById("goalModal")
        .classList.remove("active");

}
  
async function saveBudget(){

    const category = document.getElementById("budgetCategory").value.trim();
    const amount = Number(document.getElementById("budgetAmount").value);
    const month = document.getElementById("budgetMonth").value;

    if(!category || !amount || !month){
        alert("Lengkapi semua data.");
        return;
    }

    const { error } = await supabaseClient
        .from("budgets")
        .insert([{
    category: category,
    budget_limit: amount,
    period: month,
    user_id: currentUser.id
}]);

    if(error){
        console.log(error);
        alert(error.message);
        return;
    }

    closeBudgetModal();

    document.getElementById("budgetCategory").value = "";
    document.getElementById("budgetAmount").value = "";
    document.getElementById("budgetMonth").value = "";

    await loadData();
}
  
async function deleteBudget(id){

    if(!confirm("Hapus Budget?")) return;

    const { error } = await supabaseClient
        .from("budgets")
        .delete()
        .eq("id", id);

    if(error){
        alert(error.message);
        return;
    }

    await loadData();
}
  

function setType(type) {
  currentType = type;
  document.querySelectorAll('.type-tab').forEach(b => b.classList.remove('active-income','active-expense'));
  const btn = document.getElementById(type === 'income' ? 'btnIncome' : 'btnExpense');
  if(btn) btn.classList.add(type === 'income' ? 'active-income' : 'active-expense');
  renderCategoryIcons(type);
}

function renderCategoryIcons(type){

    const grid = document.getElementById('categoryIconGrid');
    if(!grid) return;

    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const label = document.getElementById('categoryLabel');
    if(label) label.textContent = type === 'income' ? 'Dari Mana?' : 'Kemana?';

    const catInput = document.getElementById('categoryInput');
    const current = catInput.value;
    const selected = list.includes(current) ? current : list[0];
    catInput.value = selected;

    grid.innerHTML = list.map(cat => `
        <button type="button" class="cat-icon-btn ${cat === selected ? 'active' : ''}" onclick="selectCategory('${cat}')">
            <span class="cat-icon-emoji">${CAT_ICONS[cat] || '●'}</span>
            <span>${cat}</span>
        </button>
    `).join('');
}

function selectCategory(cat){
    document.getElementById('categoryInput').value = cat;
    renderCategoryIcons(currentType);
}

function bumpAmount(add){
    const input = document.getElementById('amountInput');
    const current = Number(input.value) || 0;
    input.value = current + add;
}
window.editTx = function(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  document.getElementById('modalTitle').textContent = 'Ubah transaksi';
  document.getElementById('editId').value = t.id;
  document.getElementById('descInput').value = t.desc;
  document.getElementById('amountInput').value = t.amount;
  document.getElementById('accountInput').value = t.account;
  document.getElementById('categoryInput').value = t.category;
  document.getElementById('dateInput').value = t.date;
  setType(t.type);
  document.getElementById('modalOverlay').classList.add('active');
}
window.goPage = goPage;
window.openModal = openModal;
window.closeModal = closeModal;

function accountBalance(acc) {
  let bal = 0;
  transactions.forEach(t => {
    if (t.account !== acc) return;
    bal += t.type === 'income' ? t.amount : -t.amount;
  });
  return bal;
}

function render() {
  console.log("Transactions:", transactions);
  
  const now = new Date();

let income = 0;
let expense = 0;

transactions.forEach(t => {
    const d = new Date(t.date);

    if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    ) {
        if (t.type === "income")
            income += t.amount;
        else
            expense += t.amount;
    }
});
  let totalSaldo = 0;

transactions.forEach(t => {
    totalSaldo += t.type === "income"
        ? t.amount
        : -t.amount;
});

  document.getElementById('netWorthVal').textContent = formatRupiah(totalSaldo);
  document.getElementById('homePemasukanVal').textContent = formatRupiah(income);
  document.getElementById('insIncome').textContent = formatRupiah(income);
  document.getElementById('insExpense').textContent = formatRupiah(expense);

  const homeBar = document.getElementById('homeProgressBar');
  if(homeBar){
      const sisaPercent = income > 0 ? Math.max(Math.min(((income - expense) / income) * 100, 100), 0) : 0;
      homeBar.style.width = sisaPercent + "%";
      homeBar.style.background = sisaPercent < 30 ? "var(--expense)" : "var(--income)";
  }

const monthExpense = transactions
    .filter(t => t.type === 'expense' && (() => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })())
    .reduce((sum, t) => sum + t.amount, 0);
  document.getElementById('monthExpenseVal').textContent = formatRupiah(monthExpense);

  const accGrid = document.getElementById('accGrid');
  accGrid.innerHTML = ACCOUNTS.map(acc => `
    <div class="acc-card" onclick="goPage('history')">
      <div class="acc-icon" style="background:${ACC_COLORS[acc]}">${ACC_ICONS[acc]}</div>
      <div class="acc-name">${acc}</div>
      <div class="acc-val">${formatRupiah(accountBalance(acc))}</div>
    </div>
  `).join('') + `<div class="acc-add" onclick="openModal()">+<div>Tambah</div></div>`;

  const recent = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date) || b.id - a.id).slice(0,5);
  document.getElementById('txListHome').innerHTML = renderTxList(recent);

  const filterType = document.getElementById('filterType')?.value || 'all';
  const sortOrder = document.getElementById('sortOrder')?.value || 'newest';
  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const filterAccount = document.getElementById('filterAccount')?.value || 'all';
  const filterCategory = document.getElementById('filterCategory')?.value || 'all';

  const accSel = document.getElementById('filterAccount');
  if (accSel && accSel.options.length <= 1) {
    ACCOUNTS.forEach(acc => accSel.insertAdjacentHTML('beforeend', `<option value="${acc}">${acc}</option>`));
  }
  const catSel = document.getElementById('filterCategory');
  if (catSel && catSel.options.length <= 1) {
    Object.keys(CAT_ICONS).forEach(cat => catSel.insertAdjacentHTML('beforeend', `<option value="${cat}">${cat}</option>`));
  }
  
  let list = [...transactions];
  if (filterType !== 'all') list = list.filter(t => t.type === filterType);
  if (filterAccount !== 'all') list = list.filter(t => t.account === filterAccount);
  if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory);
  if (searchVal) list = list.filter(t => t.desc.toLowerCase().includes(searchVal));
  if (sortOrder === 'newest') list.sort((a,b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
  else if (sortOrder === 'oldest') list.sort((a,b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
  else if (sortOrder === 'highest') list.sort((a,b) => b.amount - a.amount);
  document.getElementById('txListFull').innerHTML = renderTxList(list, true);

  const catTotals = {};

transactions
.filter(t => {
    const d = new Date(t.date);

    return (
        t.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    );
})
.forEach(t => {
    catTotals[t.category] =
        (catTotals[t.category] || 0) + t.amount;
});

const catEntries = Object.entries(catTotals);

const labels = catEntries.map(c => c[0]);
const values = catEntries.map(c => c[1]);

const colors = [
    "#4F46E5",
    "#16A34A",
    "#F59E0B",
    "#DC2626",
    "#0EA5E9",
    "#9333EA",
    "#EC4899",
    "#14B8A6"
];

const ctx = document.getElementById("categoryChart").getContext("2d");
  
console.log(categoryChart);
console.log(typeof categoryChart);
  
if (categoryChart instanceof Chart) {
    categoryChart.destroy();
}

if (labels.length > 0) {

    categoryChart = new Chart(ctx,{
        type:"doughnut",
        data:{
            labels:labels,
            datasets:[{
                data:values,
                backgroundColor:colors
            }]
        },
        options:{
            responsive:true,
            plugins:{
                legend:{
                    position:"bottom"
                }
            }
        }
    });

}else{

    if(categoryChart){
        categoryChart.destroy();
        categoryChart = null;
    }

    document.getElementById("catBreakdown").innerHTML =
        "<div class='empty'>Belum ada pengeluaran bulan ini.</div>";
}

const totalExpense = values.reduce((a,b)=>a+b,0);

document.getElementById("catBreakdown").innerHTML =
catEntries.map(([cat,val])=>`
<div class="cat-row">
    <span>${CAT_ICONS[cat]||"●"} ${cat}</span>
    <span>
        ${formatRupiah(val)}
        (${((val/totalExpense)*100).toFixed(1)}%)
    </span>
</div>
`).join("");

renderBudget();
renderGoal();
renderArchive();
renderGift();
renderReminder();
renderHomeDashboards();
}

function renderTxList(list, withDelete) {
  if (list.length === 0) return '<div class="empty">Belum ada catatan transaksi.</div>';
  return list.map(t => {
    const dateStr = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="tx">
        <div class="tx-left">
          <div class="tx-icon ${t.type}">${CAT_ICONS[t.category] || '●'}</div>
          <div class="tx-info">
            <div class="tx-desc">${escapeHtml(t.desc)}</div>
            <div class="tx-meta">${escapeHtml(t.account || '')} · ${dateStr}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="tx-amount ${t.type}">${sign} ${formatRupiah(t.amount)}</div>
          ${withDelete ? `<button class="del-inline" onclick="editTx(${t.id})" aria-label="Ubah">✎</button><button class="del-inline" onclick="deleteTx(${t.id})" aria-label="Hapus">✕</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderBudget(){

    const wrap =
        document.getElementById("budgetList");

    if(budgets.length===0){

        wrap.innerHTML=`
        <div class="budget-empty">

            <div class="budget-empty-icon">
            🎯
            </div>

            <h3>Belum ada Budget</h3>

            <p>
            Tambahkan budget agar Arta membantu mengontrol pengeluaranmu.
            </p>

            <button
            class="budget-add-btn"
            onclick="openBudgetModal()">

            + Tambah Budget

            </button>

        </div>`;

        return;

    }

    wrap.innerHTML =
    budgets.map(b=>budgetCard(b)).join("");

}

function renderGoal(){

    const wrap = document.getElementById("goalList");

    if(goals.length===0){

        wrap.innerHTML=`
        <div class="budget-empty">

            <div class="budget-empty-icon">🏦</div>

            <h3>Belum ada Goal</h3>

            <p>
                Buat target tabungan pertamamu.
            </p>

        </div>
        `;

        return;
    }

    wrap.innerHTML =
        goals.map(g=>goalCard(g)).join("");

}

function goalCard(g){

    const percent =
        Math.min(
            (g.saved_amount / g.target_amount) * 100,
            100
        );

    const remain =
        g.target_amount - g.saved_amount;

    return `
    <div class="budget-card">

        <div class="budget-title">
            ${g.name}
        </div>

        <div class="budget-sub">
            Target ${g.target_date}
        </div>

        <div style="margin-top:18px">

            <b>${formatRupiah(g.saved_amount)}</b>

            /

            ${formatRupiah(g.target_amount)}

        </div>

        <div style="background:#eee;height:10px;border-radius:10px;margin-top:12px">

            <div style="
                width:${percent}%;
                height:10px;
                background:var(--accent);
                border-radius:10px">
            </div>

        </div>

        <div style="margin-top:10px">

            ${percent.toFixed(1)}%

        </div>

        <div style="margin-top:8px">

            Sisa

            <b>${formatRupiah(remain)}</b>

        </div>

        <button class="submit" style="margin-top:12px" onclick="openGoalProgressModal('${g.id}', ${g.saved_amount})">
            + Update Progress
        </button>

    </div>
    `;
}
  
function budgetSpent(period, category){

    return transactions

    .filter(t=>

        t.type==="expense"

        &&

        t.date.startsWith(period)

        &&

        (t.category || "").trim().toLowerCase() === (category || "").trim().toLowerCase()

    )

    .reduce((a,b)=>a+b.amount,0);

}

function budgetCard(b){
  
  
    const spent = budgetSpent(b.period, b.category);

const percent = Math.min((spent / b.budget_limit) * 100, 100);

const remain = Math.max(b.budget_limit - spent,0);

const overBudget = spent > b.budget_limit;

    let color="#22c55e";

    let status="Aman";

    if(percent>=80){

        color="#f59e0b";

        status="Hampir Habis";

    }

    if(percent>=100){

        color="#ef4444";

        status="Melebihi Budget";

    }

    return`

<div class="budget-card">

<div class="budget-title">

${b.category}

</div>

<div class="budget-sub">

${b.period}

</div>

<div style="margin-top:18px">

<b>${formatRupiah(spent)}</b>

/

${formatRupiah(b.budget_limit)}

</div>

<div style="background:#eee;height:10px;border-radius:10px;margin-top:12px">

<div style="height:10px;

width:${percent}%;

background:${color};

border-radius:10px">

</div>

</div>

<div style="margin-top:12px">

${percent.toFixed(1)}%

</div>

<div style="margin-top:8px">
${overBudget ? "Melebihi" : "Sisa"}

<b>
${formatRupiah(overBudget ? spent - b.budget_limit : remain)}
</b>
</div>

<div style="margin-top:10px;color:${color};font-weight:bold">
${status}
</div>

<div style="margin-top:15px;display:flex;justify-content:flex-end">
    <button
        onclick="deleteBudget(${b.id})"
        style="
        border:none;
        background:#ef4444;
        color:white;
        padding:8px 12px;
        border-radius:8px;
        cursor:pointer;">
        🗑 Hapus
    </button>
</div>

</div>
`;

}
  
  
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.deleteTx = async function(id) {

    if (!confirm("Hapus transaksi ini?")) return;

    const { error } = await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    await loadData();
}

document.getElementById('btnIncome').addEventListener('click', () => setType('income'));
document.getElementById('btnExpense').addEventListener('click', () => setType('expense'));

document.getElementById('txForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const desc = document.getElementById('descInput').value.trim();
  const amount = parseFloat(document.getElementById('amountInput').value);
  const account = document.getElementById('accountInput').value;
  const category = document.getElementById('categoryInput').value;
  const date = document.getElementById('dateInput').value;
  const editId = document.getElementById('editId').value;
  if (!desc || !amount || amount <= 0 || !date) return;

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
        .eq("id", Number(editId));

    if (error) {
        console.error(error);
        return;
    }

} else {

    const { error } = await supabaseClient
        .from("transactions")
        .insert([{
            type: currentType,
            description: desc,
            amount: amount,
            account: account,
            category: category,
            transaction_date: date,
            user_id: currentUser.id
        }]);

    if (error) {
        console.error(error);
        return;
    }

}

await loadData();
closeModal();
});

document.addEventListener('change', (e) => {
  if (['filterType','sortOrder','filterAccount','filterCategory'].includes(e.target.id)) render();
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'searchInput') render();
});

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

document.getElementById("budgetModal")
.addEventListener("click", function(e){

    if(e.target.id==="budgetModal"){

        closeBudgetModal();

    }

});

document.getElementById("transferModal")
.addEventListener("click", function(e){

    if(e.target.id==="transferModal"){

        closeTransfer();

    }

});

document.getElementById("goalModal")
.addEventListener("click", function(e){

    if(e.target.id==="goalModal"){

        closeGoalModal();

    }

});

document.getElementById("goalProgressModal")
.addEventListener("click", function(e){

    if(e.target.id==="goalProgressModal"){

        closeGoalProgressModal();

    }

});

document.getElementById("quickSavingsModal")
.addEventListener("click", function(e){

    if(e.target.id==="quickSavingsModal"){

        closeQuickSavings();

    }

});

document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
  
window.goPage = goPage;
window.openModal = openModal;
window.closeModal = closeModal;

window.openQuickAction = openQuickAction;
window.closeQuickAction = closeQuickAction;
window.newIncome = newIncome;
window.newExpense = newExpense;
window.openBudgetFromQuick = openBudgetFromQuick;

window.openTransfer = openTransfer;
window.closeTransfer = closeTransfer;
window.saveTransfer = saveTransfer;
  window.saveGoal = saveGoal;
  window.openGoalProgressModal = openGoalProgressModal;
  window.closeGoalProgressModal = closeGoalProgressModal;
  window.saveGoalProgress = saveGoalProgress;
  window.openQuickSavings = openQuickSavings;
  window.closeQuickSavings = closeQuickSavings;
  window.saveQuickSavings = saveQuickSavings;

async function saveTransfer(){

    const from = document.getElementById("transferFrom").value;
    const to = document.getElementById("transferTo").value;
    const amount = Number(document.getElementById("transferAmount").value);
    const date = document.getElementById("transferDate").value;

    if(!from || !to || !amount || !date){
        alert("Lengkapi semua data.");
        return;
    }

    if(from === to){
        alert("Akun asal dan tujuan tidak boleh sama.");
        return;
    }

    if(amount <= 0){
        alert("Jumlah transfer tidak valid.");
        return;
    }

    const { error } = await supabaseClient
        .from("transactions")
        .insert([

            {
                type: "expense",
                description: `Transfer ke ${to}`,
                amount: amount,
                account: from,
                category: "Transfer",
                transaction_date: date,
                user_id: currentUser.id
            },

            {
                type: "income",
                description: `Transfer dari ${from}`,
                amount: amount,
                account: to,
                category: "Transfer",
                transaction_date: date,
                user_id: currentUser.id
            }

        ]);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }


    closeTransfer();

    document.getElementById("transferAmount").value = "";

    await loadData();

}

async function saveGoal(){

    const name = document.getElementById("goalName").value.trim();
    const target = Number(document.getElementById("goalTarget").value);
    const account = document.getElementById("goalAccount").value;
    const date = document.getElementById("goalDate").value;

    if(!name || !target || !date){
        alert("Lengkapi semua data.");
        return;
    }

    const { error } = await supabaseClient
        .from("goals")
        .insert([{
            name: name,
            target_amount: target,
            saved_amount: 0,
            account: account,
            target_date: date,
            user_id: currentUser.id
        }]);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    closeGoalModal();

    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalDate").value = "";

    await loadData();
}

let goalProgressId = null;
let goalProgressCurrentSaved = 0;

function openGoalProgressModal(id, currentSaved){

    goalProgressId = id;
    goalProgressCurrentSaved = currentSaved;

    document
        .getElementById("goalProgressModal")
        .classList.add("active");

    document.getElementById("goalProgressAmount").value = "";
}

function closeGoalProgressModal(){

    document
        .getElementById("goalProgressModal")
        .classList.remove("active");
}

async function saveGoalProgress(){

    const addAmount = Number(document.getElementById("goalProgressAmount").value);

    if(!addAmount || addAmount <= 0){
        alert("Jumlah tidak valid.");
        return;
    }

    const newSaved = goalProgressCurrentSaved + addAmount;

    const { error } = await supabaseClient
        .from("goals")
        .update({ saved_amount: newSaved })
        .eq("id", goalProgressId);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    closeGoalProgressModal();

    await loadData();
}

function openQuickSavings(){

    closeQuickAction();

    const select = document.getElementById("quickSavingsGoalSelect");
    const hasGoals = document.getElementById("quickSavingsHasGoals");
    const noGoals = document.getElementById("quickSavingsNoGoals");

    if(!goals || goals.length === 0){

        hasGoals.style.display = "none";
        noGoals.style.display = "block";

    }else{

        hasGoals.style.display = "block";
        noGoals.style.display = "none";

        select.innerHTML = goals
            .map(g => `<option value="${g.id}">${g.name}</option>`)
            .join("");

        document.getElementById("quickSavingsAmount").value = "";
    }

    document
        .getElementById("quickSavingsModal")
        .classList.add("active");
}

function closeQuickSavings(){

    document
        .getElementById("quickSavingsModal")
        .classList.remove("active");
}

async function saveQuickSavings(){

    const goalId = document.getElementById("quickSavingsGoalSelect").value;
    const addAmount = Number(document.getElementById("quickSavingsAmount").value);

    if(!goalId){
        alert("Pilih goal dulu.");
        return;
    }

    if(!addAmount || addAmount <= 0){
        alert("Jumlah tidak valid.");
        return;
    }

    const goal = goals.find(g => String(g.id) === String(goalId));
    const newSaved = (goal ? goal.saved_amount : 0) + addAmount;

    const { error } = await supabaseClient
        .from("goals")
        .update({ saved_amount: newSaved })
        .eq("id", goalId);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    closeQuickSavings();

    await loadData();
}
  
function openQuickAction(){
    openModal();
}

function closeQuickAction(){

    const el = document.getElementById("quickActionModal");
    if(el) el.classList.remove("active");

}

function newIncome(){

    closeQuickAction();

    openModal();

    setType("income");

}

function newExpense(){

    closeQuickAction();

    openModal();

    setType("expense");

}

function openBudgetFromQuick(){

    closeQuickAction();

    openBudgetModal();

}

/* ======================= FITUR 1: ARCHIVE ======================= */

function renderArchive(){

    const wrap = document.getElementById("archiveList");
    if(!wrap) return;

    if(!transactions || transactions.length === 0){
        wrap.innerHTML = "<div class='empty'>Belum ada transaksi.</div>";
        return;
    }

    const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

    const groups = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
        if(!groups[key]) groups[key] = [];
        groups[key].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a,b) => b.localeCompare(a));

    wrap.innerHTML = sortedKeys.map(key => {

        const items = groups[key].sort((a,b) => new Date(b.date) - new Date(a.date));
        const [year, month] = key.split("-");
        const label = monthNames[Number(month)-1] + " " + year;
        const totalIncome = items.reduce((sum,t) => sum + (t.type === "income" ? t.amount : 0), 0);
        const totalExpense = items.reduce((sum,t) => sum + (t.type === "expense" ? t.amount : 0), 0);
        const isOpen = expandedArchiveMonths.has(key);

        return `
        <div class="budget-card" style="margin:0 0 12px;cursor:pointer;" onclick="toggleArchiveMonth('${key}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="budget-title">${label}</div>
                <div style="font-size:14px;color:var(--muted);">${isOpen ? "▲" : "▼"}</div>
            </div>
            <div class="budget-sub">${items.length} transaksi</div>
            <div style="margin-top:10px;display:flex;gap:20px;">
                <div>
                    <div style="font-size:11px;color:var(--muted);">Pemasukan</div>
                    <b style="color:var(--income);">${formatRupiah(totalIncome)}</b>
                </div>
                <div>
                    <div style="font-size:11px;color:var(--muted);">Pengeluaran</div>
                    <b style="color:var(--expense);">${formatRupiah(totalExpense)}</b>
                </div>
            </div>

            ${isOpen ? `
            <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:8px;" onclick="event.stopPropagation()">
                ${renderTxList(items)}
            </div>
            ` : ""}
        </div>
        `;

    }).join("");
}

function toggleArchiveMonth(key){

    if(expandedArchiveMonths.has(key)){
        expandedArchiveMonths.delete(key);
    }else{
        expandedArchiveMonths.add(key);
    }

    renderArchive();
}

/* ======================= FITUR 2: GIFT TRACKER ======================= */

function renderGift(){

    const wrap = document.getElementById("giftList");
    if(!wrap) return;

    if(!giftItems || giftItems.length === 0){
        wrap.innerHTML = `
        <div class="budget-empty">
            <div class="budget-empty-icon">🎁</div>
            <h3>Belum ada Gift</h3>
            <p>Catat rencana hadiah biar gak lupa nabung buat itu.</p>
            <button class="budget-add-btn" onclick="openGiftModal()">+ Tambah Gift</button>
        </div>`;
        return;
    }

    wrap.innerHTML = giftItems.map(g => giftCard(g)).join("");
}

function giftCard(g){

    const bought = g.status === "Sudah Dibeli";
    const dateStr = g.event_date ? new Date(g.event_date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-";

    return `
    <div class="budget-card" style="${bought ? "background:#dcfce7;border-color:var(--income);" : ""}">
        <div class="budget-title">🎁 ${escapeHtml(g.gift_name)}</div>
        <div class="budget-sub">${g.category || ""}</div>
        <div style="margin-top:12px;"><b>${formatRupiah(g.amount)}</b></div>
        <div style="margin-top:6px;color:var(--muted);font-size:13px;">${dateStr}</div>
        ${g.note ? `<div style="margin-top:6px;color:var(--muted);font-size:12px;">${escapeHtml(g.note)}</div>` : ""}

        <div style="margin-top:10px;font-weight:700;color:${bought ? "var(--income)" : "var(--muted)"};">
            ${g.status}
        </div>

        <div style="margin-top:14px;display:flex;gap:8px;">
            <button class="submit" style="margin-top:0;flex:1;${bought ? "background:#f1f2f6;color:var(--text);" : ""}" onclick="toggleGiftStatus('${g.id}','${g.status}')">
                ${bought ? "Tandai Belum Dibeli" : "Tandai Sudah Dibeli"}
            </button>
            <button class="del-inline" onclick="deleteGift('${g.id}')" aria-label="Hapus">✕</button>
        </div>
    </div>
    `;
}

function openGiftModal(){

    document.getElementById("giftModal").classList.add("active");
    document.getElementById("giftName").value = "";
    document.getElementById("giftAmount").value = "";
    document.getElementById("giftEventDate").value = "";
    document.getElementById("giftStatus").value = "Belum Dibeli";
    document.getElementById("giftNote").value = "";
}

function closeGiftModal(){
    document.getElementById("giftModal").classList.remove("active");
}

async function saveGift(){

    const gift_name = document.getElementById("giftName").value.trim();
    const amount = Number(document.getElementById("giftAmount").value);
    const category = document.getElementById("giftCategory").value;
    const event_date = document.getElementById("giftEventDate").value;
    const status = document.getElementById("giftStatus").value;
    const note = document.getElementById("giftNote").value.trim();

    if(!gift_name || !amount || !event_date){
        alert("Lengkapi nama, nominal, dan tanggal event.");
        return;
    }

    const { error } = await supabaseClient
        .from("gift_tracker")
        .insert([{
            gift_name, amount, category, event_date, status, note,
            user_id: currentUser.id
        }]);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    closeGiftModal();
    await loadData();
}

async function toggleGiftStatus(id, currentStatus){

    const newStatus = currentStatus === "Sudah Dibeli" ? "Belum Dibeli" : "Sudah Dibeli";

    const { error } = await supabaseClient
        .from("gift_tracker")
        .update({ status: newStatus })
        .eq("id", id);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    await loadData();
}

async function deleteGift(id){

    if(!confirm("Hapus gift ini?")) return;

    const { error } = await supabaseClient
        .from("gift_tracker")
        .delete()
        .eq("id", id);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    await loadData();
}

/* ======================= FITUR 3: REMINDER ======================= */

function renderReminder(){

    const wrap = document.getElementById("reminderList");
    if(!wrap) return;

    if(!reminders || reminders.length === 0){
        wrap.innerHTML = `
        <div class="budget-empty">
            <div class="budget-empty-icon">🔔</div>
            <h3>Belum ada Reminder</h3>
            <p>Tambahkan hutang, cicilan, atau tagihan yang perlu diingat.</p>
            <button class="budget-add-btn" onclick="openReminderModal()">+ Tambah Reminder</button>
        </div>`;
        return;
    }

    wrap.innerHTML = reminders.map(r => reminderCard(r)).join("");
}

function reminderStatusOf(r){

    const paid = r.paid_amount || 0;

    if(r.total_amount && paid >= r.total_amount) return "Lunas";

    const today = new Date().toISOString().split("T")[0];
    if(r.due_date && r.due_date < today) return "Terlambat";

    return "Aktif";
}

function addOneMonth(dateStr){

    const d = new Date(dateStr);
    const day = d.getDate();

    d.setDate(1);
    d.setMonth(d.getMonth() + 1);

    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));

    return d.toISOString().split("T")[0];
}

async function processRecurringReminders(){

    const today = new Date().toISOString().split("T")[0];

    const toRoll = reminders.filter(r =>
        r.monthly_amount > 0 &&
        !(r.total_amount && (r.paid_amount || 0) >= r.total_amount) &&
        r.due_date && r.due_date < today
    );

    if(toRoll.length === 0) return;

    for(const r of toRoll){

        let nextDue = r.due_date;

        // Majuin due_date sampai gak lagi di masa lalu (jaga-jaga kalau lama gak dibuka).
        while(nextDue < today){
            nextDue = addOneMonth(nextDue);
        }

        const { error } = await supabaseClient
            .from("payment_reminders")
            .update({ due_date: nextDue })
            .eq("id", r.id);

        if(!error){
            r.due_date = nextDue;
        }
    }
}

function reminderCard(r){

    const paid = r.paid_amount || 0;
    const isInstallment = r.monthly_amount > 0;
    const hasTotal = r.total_amount !== null && r.total_amount !== undefined && r.total_amount > 0;

    const percent = hasTotal ? Math.min((paid / r.total_amount) * 100, 100) : 0;
    const remain = hasTotal ? Math.max(r.total_amount - paid, 0) : 0;
    const status = reminderStatusOf(r);

    let color = "var(--accent)";
    let bg = "";

    if(status === "Lunas"){ color = "var(--income)"; bg = "background:#dcfce7;border-color:var(--income);"; }
    if(status === "Terlambat"){ color = "var(--expense)"; bg = "background:#fee2e2;border-color:var(--expense);"; }

    const dueStr = r.due_date ? new Date(r.due_date).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-";

    return `
    <div class="budget-card" style="${bg}">
        <div class="budget-title">${escapeHtml(r.title)} ${isInstallment ? '<span style="font-size:11px;font-weight:600;color:var(--accent);">🔁 Bulanan</span>' : ''}</div>
        <div class="budget-sub">${r.category || ""} · Jatuh tempo ${dueStr}</div>

        ${isInstallment ? `
        <div style="margin-top:14px;">
            Cicilan per Bulan <b>${formatRupiah(r.monthly_amount)}</b>
        </div>
        ` : ""}

        ${hasTotal ? `
        <div style="margin-top:4px;">
            Total Hutang <b>${formatRupiah(r.total_amount)}</b>
        </div>
        ` : ""}

        <div style="margin-top:4px;">
            Sudah Dibayar <b>${formatRupiah(paid)}</b>
        </div>

        ${hasTotal ? `
        <div style="background:#eee;height:10px;border-radius:10px;margin-top:12px;border:1px solid var(--border);overflow:hidden;">
            <div style="height:10px;width:${percent}%;background:${color};border-radius:10px;min-width:${percent > 0 ? '4px' : '0'};"></div>
        </div>
        <div style="margin-top:8px;">${percent.toFixed(1)}%</div>

        <div style="margin-top:8px;">
            Sisa <b>${formatRupiah(remain)}</b>
        </div>
        ` : ""}

        <div style="margin-top:10px;font-weight:700;color:${color};">
            ${status}
        </div>

        ${r.note ? `<div style="margin-top:6px;color:var(--muted);font-size:12px;">${escapeHtml(r.note)}</div>` : ""}

        <div style="margin-top:14px;display:flex;gap:8px;">
            ${status !== "Lunas" ? `<button class="submit" style="margin-top:0;flex:1;" onclick="openReminderPayModal('${r.id}')">+ Bayar</button>` : ""}
            <button class="del-inline" onclick="deleteReminder('${r.id}')" aria-label="Hapus">✕</button>
        </div>
    </div>
    `;
}

function openReminderModal(){

    document.getElementById("reminderModal").classList.add("active");
    document.getElementById("reminderTitle").value = "";
    document.getElementById("reminderAmount").value = "";
    document.getElementById("reminderMonthly").value = "";
    document.getElementById("reminderDueDate").value = "";
    document.getElementById("reminderNote").value = "";
}

function closeReminderModal(){
    document.getElementById("reminderModal").classList.remove("active");
}

async function saveReminder(){

    const title = document.getElementById("reminderTitle").value.trim();
    const totalInput = document.getElementById("reminderAmount").value;
    const total_amount = totalInput ? Number(totalInput) : null;
    const monthly_amount = Number(document.getElementById("reminderMonthly").value) || 0;
    const due_date = document.getElementById("reminderDueDate").value;
    const category = document.getElementById("reminderCategory").value;
    const note = document.getElementById("reminderNote").value.trim();
    const is_recurring = monthly_amount > 0;

    if(!title || !due_date || (!total_amount && !monthly_amount)){
        alert("Lengkapi nama, tanggal jatuh tempo, dan minimal nominal total atau nominal per bulan.");
        return;
    }

    const { error } = await supabaseClient
        .from("payment_reminders")
        .insert([{
            title, total_amount, paid_amount: 0, monthly_amount, due_date, category, note, is_recurring,
            user_id: currentUser.id
        }]);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    closeReminderModal();
    await loadData();
}

async function deleteReminder(id){

    if(!confirm("Hapus reminder ini?")) return;

    const { error } = await supabaseClient
        .from("payment_reminders")
        .delete()
        .eq("id", id);

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    await loadData();
}

let reminderPayId = null;

function openReminderPayModal(id){

    reminderPayId = id;
    document.getElementById("reminderPayAmount").value = "";
    document.getElementById("reminderPayModal").classList.add("active");
}

function closeReminderPayModal(){
    document.getElementById("reminderPayModal").classList.remove("active");
}

async function submitReminderPay(){

    const amount = Number(document.getElementById("reminderPayAmount").value);

    if(!amount || amount <= 0){
        alert("Jumlah tidak valid.");
        return;
    }

    const r = reminders.find(x => String(x.id) === String(reminderPayId));
    if(!r) return;

    const newPaid = (r.paid_amount || 0) + amount;

    const { data, error } = await supabaseClient
        .from("payment_reminders")
        .update({ paid_amount: newPaid })
        .eq("id", reminderPayId)
        .select();

    if(error){
        console.error(error);
        alert(error.message);
        return;
    }

    if(!data || data.length === 0){
        alert("Pembayaran gagal disimpan (kemungkinan izin akses ke database ditolak). Coba refresh halaman dan cek apakah kamu masih login.");
        return;
    }

    const willComplete = r.total_amount && newPaid >= r.total_amount;

    closeReminderPayModal();
    await loadData();

    if(willComplete){
        alert("Hutang ini sudah lunas semua! 🎉");
    }
}

async function payReminder(id, amount){
    reminderPayId = id;
    const r = reminders.find(x => String(x.id) === String(id));
    if(!r) return;

    const newPaid = (r.paid_amount || 0) + amount;

    const { error } = await supabaseClient
        .from("payment_reminders")
        .update({ paid_amount: newPaid })
        .eq("id", id);

    if(error){
        console.error(error);
        return;
    }

    await loadData();
}

/* ======================= HOME DASHBOARD CARDS ======================= */

function renderHomeDashboards(){

    const reminderBox = document.getElementById("reminderDashCard");

    if(reminderBox){

        const today = new Date().toISOString().split("T")[0];

        const dueToday = reminders.filter(r => reminderStatusOf(r) !== "Lunas" && r.due_date === today);
        const tagihan = dueToday.filter(r => r.category === "Tagihan").length;
        const hutang = dueToday.filter(r => r.category !== "Tagihan").length;
        const total = dueToday.reduce((sum,r) => {
            return sum + Math.max((r.total_amount || 0) - (r.paid_amount||0), 0);
        }, 0);

        if(dueToday.length === 0){
            reminderBox.innerHTML = `<div class="insight-card"><div class="empty" style="padding:6px 0;">Tidak ada reminder.</div></div>`;
        }else{
            reminderBox.innerHTML = `
            <div class="insight-card" style="cursor:pointer;" onclick="goPage('reminder')">
                <div class="cat-row"><span>${tagihan} Tagihan</span><span></span></div>
                <div class="cat-row"><span>${hutang} Hutang</span><span></span></div>
                <div class="cat-row" style="border-bottom:none;"><span>Total</span><b>${formatRupiah(total)}</b></div>
            </div>`;
        }
    }

    const giftBox = document.getElementById("giftDashCard");

    if(giftBox){

        const today = new Date();

        const upcoming = giftItems
            .filter(g => g.status !== "Sudah Dibeli" && g.event_date)
            .map(g => ({...g, daysLeft: Math.ceil((new Date(g.event_date) - today) / 86400000)}))
            .filter(g => g.daysLeft >= 0)
            .sort((a,b) => a.daysLeft - b.daysLeft);

        if(upcoming.length === 0){
            giftBox.innerHTML = `<div class="insight-card"><div class="empty" style="padding:6px 0;">Tidak ada gift terdekat.</div></div>`;
        }else{
            const g = upcoming[0];
            giftBox.innerHTML = `
            <div class="insight-card" style="cursor:pointer;" onclick="goPage('gift')">
                <div class="cat-row" style="border-bottom:none;">
                    <span>🎁 ${escapeHtml(g.gift_name)}</span>
                    <span>${g.daysLeft === 0 ? "Hari ini" : g.daysLeft + " hari lagi"}</span>
                </div>
                <div style="margin-top:4px;font-weight:700;">${formatRupiah(g.amount)}</div>
            </div>`;
        }
    }
}

function toggleDarkMode(){
    const checked = document.getElementById("darkModeToggle").checked;
    document.body.classList.toggle("dark-mode", checked);
    localStorage.setItem("darkMode", checked ? "1" : "0");
}

function applySavedDarkMode(){
    const saved = localStorage.getItem("darkMode") === "1";
    document.body.classList.toggle("dark-mode", saved);
    const toggle = document.getElementById("darkModeToggle");
    if(toggle) toggle.checked = saved;
}

window.toggleDarkMode = toggleDarkMode;

initAuth();
applySavedDarkMode();
