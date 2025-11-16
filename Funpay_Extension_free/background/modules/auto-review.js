async function autoReview(forceUpdate) {
    const ResFunpay = await fetch("https://funpay.com/");
    const funpay = await ResFunpay.text();

    const profileUrl = funpay.match(/<a href="(.*?)" class="user-link-dropdown/)[1];

    const ResProfile = await fetch(profileUrl);
    const profile = await ResProfile.text();

    const reviews = [...profile.matchAll(/<div class="review-item-order"><a href="([^"]+)">Заказ #(.*?)<\/a><\/div>/g)];
    
    let lastReviewIds = (await chrome.storage.local.get("lastReviewId")).lastReviewId?.id;

    if (forceUpdate || !lastReviewIds) {
        await chrome.storage.local.set({"lastReviewId": {"id": reviews.map(item => item[2])}});
        return;
    }

    for ( let i of reviews ) {
        if (lastReviewIds.includes(i[2])) break;

        await sendReview(i[2], profile.match(/csrf-token&quot;:&quot;(.*?)&quot;/)[1], profile.match(/userId&quot;:(.*?),/)[1], userData?.["auto-review"].value);
    }

    // Внос ласт id отзыва
    await chrome.storage.local.set({"lastReviewId": {"id": reviews.map(item => item[2])}});
};

async function sendReview(id, token, userId, text) {
    return new Promise(async resolve => {
        await fetch("https://funpay.com/orders/review", {
            method: "POST",
            headers: {
                "x-requested-with": "XMLHttpRequest",
                "sec-fetch-site": "same-origin"
            },
            body: new URLSearchParams({
                authorId: userId,
                text: text,
                rating: "",
                csrf_token: token,
                orderId: id
            })
        });

        setInterval(() => {
            resolve();
        }, 2000);
    });
}