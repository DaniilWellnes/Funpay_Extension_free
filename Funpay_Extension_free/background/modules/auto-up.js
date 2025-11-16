let pattern_orders = {};
let get_orders = [];

async function autoUp() {
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