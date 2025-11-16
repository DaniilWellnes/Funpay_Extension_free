async function autoAnswer(forceUpdate) {
    const chatListResponse = await fetch("https://funpay.com/chat/");
 
    if (!chatListResponse.ok) return

    const chatListHtml = await chatListResponse.text();

    let lastMessageId = (await chrome.storage.local.get("lastChatId")).lastChatId?.id;

    if (forceUpdate || !lastMessageId) {
        await chrome.storage.local.set({"lastChatId": {"id": chatListHtml.match(/data-node-msg="(.*?)"/)[1]}});
        return;
    }

    const chatEntries = chatListHtml.split(/"contact-item[" ]/).splice(1)
        .map(entry => {
            return [
                entry.match(/data-node-msg="(.*?)"/)[1],
                entry.match(/data-id="(.*?)"/)[1]
            ];
        })
        .filter(pair => pair[0] > lastMessageId);
    
        
    for (let [messageId, dialogId] of chatEntries)
        await handleChat(dialogId);
}

function handleChat(dialogId) {
    return new Promise(async (resolve) => {
        let lastAuthor = "Поддержка";

        const dialogResponse = await fetch(`https://funpay.com/chat/?node=${dialogId}`);

        if (!dialogResponse.ok) resolve()

        const dialogHtml = await dialogResponse.text();

        const messages = dialogHtml.split(`<div class="chat-message">`).slice(1).map(entry => {
            const authorMatch = entry.match(/chat-msg-author-link">(.*?)</);

            if (authorMatch)
                lastAuthor = authorMatch[1];

            return [
                authorMatch ? authorMatch[1] : lastAuthor,
                entry.match(/<div class="chat-msg-text">([\s\S]*?)<\/div>/)[1]
            ];
        });

        const meta = {
            token: dialogHtml.match(/csrf-token&quot;:&quot;(.*?)&quot;/)[1],
            id: dialogHtml.match(/data-name="(.*?)"/)[1],
            username: dialogHtml.match(/<div class="media-body">.*?<a href="[^"]+">(.*?)<\/a>/s)[1],
            myusername: dialogHtml.match(/<div class="user-link-name">(.*?)<\/div>/)[1]
        };

        const userMessages = messages.filter(([author]) =>
            ["Поддержка", dialogHtml.match(/user-link-name">(.*?)<\//)[1]].includes(author)
        );

        if (!userMessages[0])
            sendReply(
                meta.token, 
                meta.id, 
                userData["auto-answer"]?.value
                    .replaceAll("{username}", meta.username)
                    .replaceAll("{myusername}", meta.myusername)
            );

        if (["Поддержка", dialogHtml.match(/user-link-name">(.*?)<\//)[1]].includes(messages.reverse()[0][0])) {
            setTimeout(() => { resolve(); }, 2000);
            return;
        }

        let firstAuthor;

        for (let [author, content] of messages) {
            if (!firstAuthor)
                firstAuthor = author;

            if (author === firstAuthor) {
                const commands = userData["auto-answer"]?.commands;
                if (!commands) break;

                for (let command of commands) {
                    if (command.command === content) {
                        await sendReply(
                            meta.token, 
                            meta.id, 
                            command.message
                                .replaceAll("{username}", meta.username)
                                .replaceAll("{myusername}", meta.myusername)
                        );
                        break;
                    }
            }
            } else break;
        }

        setTimeout(() => { resolve(); }, 2000);
    });
}

async function sendReply(csrfToken, nodeId, messageText) {
    const response = await fetch("https://funpay.com/runner/", {
        method: "POST",
        body: new URLSearchParams({
            request: JSON.stringify({ action: "chat_message", data: { node: nodeId, content: messageText } }),
            csrf_token: csrfToken
        })
    });

    await new Promise((resolve, reject) => { setTimeout(() => { resolve() }, 1000) })

    return (await response.text());
}