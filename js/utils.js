function formatRupiah(n, mask = false) {
    if (mask) return "Rp •••••••";
    return "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
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
