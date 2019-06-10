//
// about.js - Just set dark mode
//

async function check_dark_mode() {
    var res = await browser.storage.local.get('dark_mode');
    if (res.dark_mode) {
        document.documentElement.setAttribute('data-underbite-dark', 'true');
    } else {
        document.documentElement.removeAttribute('data-underbite-dark');
    }
}

check_dark_mode();
window.addEventListener('message', check_dark_mode);
