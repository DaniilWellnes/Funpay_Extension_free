async function autoReview(forceUpdate) {
    try {
        const ResFunpay = await fetch("https://funpay.com/");
        if (!ResFunpay.ok) {
            console.error('autoReview: failed to fetch funpay root', ResFunpay.status);
            return;
        }
        const funpay = await ResFunpay.text();

        // Попробуем найти URL профиля несколькими способами
        const profileMatch = funpay.match(/<a\s+href="(\/[^\"]+)"\s+class="user-link-dropdown/i) || funpay.match(/"profile_url":"(https?:\\/\\/[^\"]+)"/i) || funpay.match(/"profile":"(https?:\\/\\/[^\"]+)"/i);
        if (!profileMatch) {
            console.error('autoReview: profile URL not found on funpay homepage');
            return;
        }

        let profileUrl = profileMatch[1];
        if (!profileUrl.startsWith('http')) profileUrl = `https://funpay.com${profileUrl}`;

        const ResProfile = await fetch(profileUrl);
        if (!ResProfile.ok) {
            console.error('autoReview: failed to fetch profile', ResProfile.status);
            return;
        }
        const profile = await ResProfile.text();

        const reviews = [...profile.matchAll(/<div class="review-item-order"><a href="([^\"]+)">Заказ #(\d+?)<\/a><\/div>/g)];

        let lastReviewIds = (await chrome.storage.local.get("lastReviewId")).lastReviewId?.id;

        if (forceUpdate || !lastReviewIds) {
            await chrome.storage.local.set({"lastReviewId": {"id": reviews.map(item => item[2])}});
            return;
        }

        // Найдём токен и userId разными способами
        const csrfMatch = profile.match(/csrf-token&quot;:&quot;(.*?)&quot;/) || profile.match(/"csrf_token":"(.*?)"/) || profile.match(/name="csrf-token" content="(.*?)"/);
        const userIdMatch = profile.match(/userId&quot;:(\d+),/) || profile.match(/"userId":(\d+),/) || profile.match(/"id":(\d+),/);

        const token = csrfMatch?.[1];
        const userId = userIdMatch?.[1];

        if (!token || !userId) {
            console.error('autoReview: csrf token or userId not found');
            return;
        }

        const stored = await chrome.storage.local.get('userData');
        const autoReviewText = stored.userData?.["auto-review"]?.value || '';

        for (let i of reviews) {
            if (lastReviewIds.includes(i[2])) break;

            await sendReview(i[2], token, userId, autoReviewText);
        }

        // Внос ласт id отзыва
        await chrome.storage.local.set({"lastReviewId": {"id": reviews.map(item => item[2])}});
    } catch (err) {
        console.error('autoReview error', err);
    }
};

async function sendReview(id, token, userId, text) {
    return new Promise(async resolve => {
        try {
            const res = await fetch("https://funpay.com/orders/review", {
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

            if (!res.ok) console.warn('sendReview: non-ok response', res.status);
        } catch (err) {
            console.error('sendReview fetch error', err);
        }

        // Заменяем setInterval на setTimeout — одноразовая задержка
        setTimeout(() => {
            resolve();
        }, 2000);
    });
}