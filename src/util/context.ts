export function isContent() {
    return !browser || !browser.runtime || !browser.runtime.onInstalled;
}

export function isBackground() {
    return !!browser && !!browser.runtime && !!browser.runtime.onInstalled;
}