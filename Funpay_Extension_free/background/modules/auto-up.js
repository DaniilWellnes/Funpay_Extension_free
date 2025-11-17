let pattern_orders = {};
let get_orders = [];

async function autoUp() {
    try {
        const ds = await chrome.storage.local.get(['demo_mode']);
        if (ds.demo_mode) {
            console.info('autoUp: demo_mode enabled — skipping real network calls (simulation)');
            // Simulate a successful run: populate some pattern_orders so UI can show activity
            pattern_orders = pattern_orders || {};
            get_orders = get_orders || [];
            // fake a few order ids
            const fakeIds = ['demo-1','demo-2'];
            fakeIds.forEach(id => { if (!get_orders.includes(id)) get_orders.push(id); pattern_orders[id] = `game_id=demo&node_id=${id}`; });
            return;
        }
    } catch(e) { console.warn('autoUp demo-check failed', e); }
    const ResFunpay = await fetch("https://funpay.com/");
    const funpay = await ResFunpay.text();

    const profileUrl = funpay.match(/<a href="(.*?)" class="user-link-dropdown/)[1];

    const ResProfile = await fetch(profileUrl);
    const profile = await ResProfile.text();

    const orders = [...profile.matchAll(/<a href="https:\/\/funpay\.com\/lots\/(.*?)\/trade/g)].map(( item ) => item[1]);

    for ( let i of orders ) {
        if (get_orders.includes(i)) {
            
            if (pattern_orders[i])
                await upLots(pattern_orders[i]);

            continue; 
        }

        const ResTrade = await fetch(`https://funpay.com/lots/${i}/trade`);
        const trade = await ResTrade.text();

        const gameId = trade.match(/data-game="(.*?)"/)[1];

        let raise = await upLots(`game_id=${gameId}&node_id=${i}`);

        if (!raise.modal) {
            get_orders.push(i);
        
            if (raise?.error != 1)
                pattern_orders[i] = `game_id=${gameId}&node_id=${i}`;

            continue;
        }

        const ids = [...raise.modal.matchAll(/value="(.*?)"/g)].map(m => m[1]);

        get_orders = [...get_orders, ...ids];

        const data = new URLSearchParams();

        data.append("game_id", gameId);
        data.append("node_id", i);

        get_orders.forEach(( el ) => {
            data.append("node_ids[]", el);
        });

        raise = await upLots(data);

        if (raise?.error == 0)
            pattern_orders[i] = data;
    }
}

async function upLots(data) {
    return new Promise((resolve) => {
        setTimeout(async () => {
            try {
                const ds = await chrome.storage.local.get(['demo_mode']);
                if (ds.demo_mode) {
                    // return a mock successful response
                    resolve({ error: 0, modal: null });
                    return;
                }
            } catch(e) { /* ignore */ }
            const ResUpLot = await fetch("https://funpay.com/lots/raise", {
                "method": "POST",
                "headers": {
                    "x-requested-with": "XMLHttpRequest",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                "body": data
            });

            if (ResUpLot.ok)
                resolve(await ResUpLot.json());
            
            resolve({ error: 1 });
        }, 1000);
    });
}