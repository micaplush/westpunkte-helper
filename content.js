async function getTotal() {
    const resp = await (await window.fetch("https://westbahn.at/api/v1/customer")).json()
    if (!resp.success) {
        throw resp
    }
    return resp.customer.westpunkte
}

async function getTransactions(page) {
    const resp = await (await window.fetch(`https://westbahn.at/api/v1/westpunkte?page=${page}&size=10&direction=incoming`)).json()
    if (!resp.success) {
        throw resp
    }
    return resp.data
}

function getDateString() {
    return (new Date()).toDateString()
}

// Cache expiry data for the current day since it can't change anyways.
// WestPunkte are credited one day after a journey and we don't consider not-yet-valid WestPunkte.
// The content script is also local to a page, so this doesn't persist across page reloads.
// It's really just a cheap way to avoid fetching data again if we absolutely don't have to.
let savedExpiryData = undefined
let saveDate = undefined

async function getExpiryData() {
    if (savedExpiryData !== undefined && saveDate == getDateString()) {
        return savedExpiryData
    }

	const total = await getTotal()

	let page = 1
	let oldestTransactions = []
	let wp = 0

	PAGES: while (true) {
		const transactions = await getTransactions(page)
		if (transactions.length === 0) {
			break PAGES
		}

		TRANSACTIONS: for (const t of transactions) {
            const transaction = {
                ...t,
                expiry: new Date(t.expiry),
            }

            const wpAfter = wp + transaction.amount
            if (wpAfter > total) {
                transaction.amount = total - wp
                oldestTransactions.push(transaction)
                break PAGES
            }
            if (wpAfter === total) {
                oldestTransactions.push(transaction)
                break PAGES
            }
			oldestTransactions.push(transaction)
			wp = wpAfter
		}

		page++
	}

    oldestTransactions.sort((a, b) => a.expiry > b.expiry)

    const oldestTransactionsCollapsed = []
    let topTransaction = undefined
    for (const transaction of oldestTransactions) {
        if (topTransaction !== undefined && transaction.expiry.getTime() === topTransaction.expiry.getTime()) {
            topTransaction.amount += transaction.amount
        } else {
            oldestTransactionsCollapsed.push(transaction)
            topTransaction = transaction
        }
    }

    wp = total
    for (const transaction of oldestTransactionsCollapsed) {
        wp -= transaction.amount
        transaction.totalAfter = wp
    }

    savedExpiryData = {
        total,
        oldestTransactions: oldestTransactionsCollapsed,
    }
    saveDate = getDateString()

    return savedExpiryData
}

browser.runtime.onMessage.addListener(async () => {
    return await getExpiryData()
})
