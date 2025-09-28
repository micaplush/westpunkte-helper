function zeroPad(num) {
    return num < 10 ? `0${num}` : num.toString()
}

async function init() {
    const currentTotal = document.getElementById("current-total")
    const loading = document.getElementById("loading")
    const table = document.getElementById("table")
    const tbody = document.getElementById("tbody")

    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs.length < 1) {
        return
    }
    const tab = tabs[0]

    const {total, oldestTransactions} = await browser.tabs.sendMessage(tab.id, {})
    currentTotal.innerText = total

    for (const transaction of oldestTransactions) {
        console.dir(transaction)
        const row = document.createElement("tr")
        const cellTime = document.createElement("td")
        cellTime.className = "time"
        cellTime.innerText = transaction.expiry.toUTCString().replace(" 00:00:00 GMT", "")
        cellTime.innerText = `${zeroPad(transaction.expiry.getDate())}.${zeroPad(transaction.expiry.getMonth() + 1)}.${transaction.expiry.getFullYear()}`
        row.appendChild(cellTime)
        const cellAmount = document.createElement("td")
        cellAmount.className = "amount"
        cellAmount.innerText = -transaction.amount
        row.appendChild(cellAmount)
        const cellTotalAfter = document.createElement("td")
        cellTotalAfter.className = "total-after"
        cellTotalAfter.innerText = transaction.totalAfter
        row.appendChild(cellTotalAfter)
        tbody.appendChild(row)
    }

    loading.style.display = "none"
    table.style.display = "table"
}

init()
