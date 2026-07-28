
let transactions = [];
let budgets = [];
let currentType = 'income';
let categoryChart = null;
let goals = [];

const supabaseClient = window.supabase.createClient(
    "https://tcmngkjrgkmtvdnyydqc.supabase.co",
    "sb_publishable_qy0g_cQoFggFgsVkzDN1wQ_CiLk9Ds5"

);

console.log("Supabase =", window.supabase);
console.log("Client =", supabaseClient);
console.log("typeof from =", typeof supabaseClient.from);
  
const ACCOUNTS = ['Tunai','BCA','SeaBank','Bibit','E-Wallet'];
const ACC_ICONS = { 'Tunai':'💵', 'BCA':'🏦', 'SeaBank':'🏦', 'Bibit':'🏦', 'E-Wallet':'📱' };
const ACC_COLORS = { 'Tunai':'#dcfce7', 'BCA':'#dbeafe', 'SeaBank':'#ede9fe', 'Bibit':'#fee2e2', 'E-Wallet':'#fef3c7' };
const CAT_ICONS = { 'Umum':'●','Makanan':'🍔','Transportasi':'🚗','Belanja':'🛍','Tagihan':'🧾','Hiburan':'🎬','Gaji':'💰','Investasi':'📈','Lainnya':'✳' };

function formatRupiah(n) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}

async function loadData() {

    const { data, error } = await supabaseClient
        .from("transactions")
        .select("*")
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
    render();
}

async function saveData() {
    // Tidak digunakan lagi karena data disimpan langsung ke Supabase
}

function goPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (name === 'home') document.getElementById('navHome').classList.add('active');
  if (name === 'history') { 
    document.getElementById('navHistory2').classList.add('active'); }
  if (name === 'insight') document.getElementById('navInsight').classList.add('active');
  if(name==="budget")  document.getElementById("navBudget").classList.add("active");
  if(name==="goals"){
    document
        .getElementById("navGoals")
        .classList.add("active");
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

    const category = document.getElementById("budgetCategory").value;
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
    period: month
}]);

  const { data: goalData, error: goalError } =
await supabaseClient
    .from("goals")
    .select("*")
    .order("created_at",{ascending:false});

if(goalError){
    console.error(goalError);
}else{
    goals = goalData || [];
}
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
  document.getElementById('btnIncome').classList.toggle('active-income', type === 'income');
  document.getElementById('btnExpense').classList.toggle('active-expense', type === 'expense');
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
  document.getElementById('totalSaldoVal').textContent = formatRupiah(totalSaldo);
  document.getElementById('insIncome').textContent = formatRupiah(income);
  document.getElementById('insExpense').textContent = formatRupiah(expense);

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
            ${g.goal_name}
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
                background:#2451c4;
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

    </div>
    `;
}
  
function budgetSpent(period){

    return transactions

    .filter(t=>

        t.type==="expense"

        &&

        t.date.startsWith(period)

    )

    .reduce((a,b)=>a+b.amount,0);

}

function budgetCard(b){
  
  
    const spent = budgetSpent(b.period);

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
            transaction_date: date
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
                transaction_date: date
            },

            {
                type: "income",
                description: `Transfer dari ${from}`,
                amount: amount,
                account: to,
                category: "Transfer",
                transaction_date: date
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
            goal_name: name,
            target_amount: target,
            saved_amount: 0,
            account: account,
            target_date: date
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
  
function openQuickAction(){

    document
        .getElementById("quickActionModal")
        .classList.add("active");

}

function closeQuickAction(){

    document
        .getElementById("quickActionModal")
        .classList.remove("active");

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

document
.getElementById("quickActionModal")
.addEventListener("click",function(e){

    if(e.target.id==="quickActionModal"){

        closeQuickAction();

    }

});

loadData();
