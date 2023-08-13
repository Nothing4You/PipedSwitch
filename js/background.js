const browser = window.browser || window.chrome;

const YOUTUBE_DOMAIN = "youtube.com";
const PIPED_DOMAINS = new Set([
    "piped.video",
    "piped.kavin.rocks",
]);

const URL_PATTERNS_YOUTUBE = [
    `*://*.${YOUTUBE_DOMAIN}/*`,
];

let URL_PATTERNS_PIPED = [];
for (const i = PIPED_DOMAINS.length - 1; i >= 0; i--) {
    URL_PATTERNS_PIPED += `*://${PIPED_DOMAINS[i]}/*`;
}

browser.contextMenus.create({
    "contexts": ["page"],
    "title": "Open current page in Piped",
    "onclick": Switch,
    "documentUrlPatterns": URL_PATTERNS_YOUTUBE,
});

browser.contextMenus.create({
    "contexts": ["page"],
    "title": "Open current page in YouTube",
    "onclick": Switch,
    "documentUrlPatterns": URL_PATTERNS_PIPED,
});

browser.contextMenus.create({
    "contexts": ["link"],
    "title": "Open link in Piped",
    "onclick": Switch,
    "targetUrlPatterns": URL_PATTERNS_YOUTUBE,
});

browser.contextMenus.create({
    "contexts": ["link"],
    "title": "Open link in Piped in new tab",
    "onclick": OpenInNewTab,
    "targetUrlPatterns": URL_PATTERNS_YOUTUBE,
});

browser.contextMenus.create({
    "contexts": ["link"],
    "title": "Open link in Piped in incognito",
    "onclick": OpenInIncognito,
    "targetUrlPatterns": URL_PATTERNS_YOUTUBE,
});

async function Switch(info, tab, incognito = false, new_tab = false) {
    let url = null;
    if (typeof info.linkUrl !== "undefined") {
        // context menu on link
        url = new URL(info.linkUrl);
    } else {
        // context menu on page
        url = new URL(info.pageUrl);
    }

    if (url.host.endsWith(YOUTUBE_DOMAIN)) {
        url.host = PIPED_DOMAINS.values().next().value;
    } else if (PIPED_DOMAINS.has(url.host)) {
        url.host = YOUTUBE_DOMAIN;
    } else {
        console.log(`Unsupported URL, ${url.host} is not currently defined as YouTube or Piped domain`);
        return;
    }

    if (incognito) {
        const incognito_allowed = await browser.extension.isAllowedIncognitoAccess();

        if (!incognito_allowed) {
            console.log("Missing incognito access to open private window");
            return;
        }

        browser.windows.create({
            "incognito": true,
            "url": url.toString(),
        });
    } else if (new_tab) {
        browser.tabs.create({
            url: url.toString(),
            openerTabId: tab.id,
        });
    } else {
        browser.tabs.update({
            url: url.toString(),
        });
    }
}

async function OpenInIncognito(info, tab) {
    await Switch(info, tab, true);
}

async function OpenInNewTab(info, tab) {
    await Switch(info, tab, false, true);
}
