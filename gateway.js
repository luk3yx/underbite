//
// gateway.js - Send data to gopher.js
// An anonymous function is used so 'return' can be used.
//

(function() {

try {
    if (window.self == window.top) {
        return;
    }
} catch(e) {
    true;
}

top.postMessage([false, window.location.search], '*');

document.documentElement.setAttribute('data-underbite', 'true');

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

function redirectLink(e) {
    var obj = e.target;
    var c = 0;
    while (! obj.href && c < 10) {
        obj = obj.parentElement;
        c += 1
    }
    if (obj.href) {
        e.preventDefault();
        var url = '?' + obj.href;
        top.postMessage([false, url], '*');
        window.location.search = url;
    }
}

window.addEventListener('DOMContentLoaded', function() {
    // Redirect links
    var links = document.getElementsByTagName('a');
    var url;
    var baseurl = window.location.href.split('?')[0];
    for (var i = 0; i < links.length; i++) {
        if (links[i].name != 'top' && links[i].href.indexOf('#top') <= 0) {
            if (links[i].href.indexOf(baseurl) == 0) {
                url = links[i].href.split('?');
                url.shift()
                url = url.join('?');
                links[i].setAttribute('href', url);
                links[i].onclick = redirectLink;
            } else {
                links[i].setAttribute('target', '_top');
            }
        }
    }

    // Get the parent URL (if it exists)
    var breadcrumbs = document.getElementsByTagName('font');
    if (breadcrumbs.length > 0) {
        var pages = breadcrumbs[0].children;
        var prevPage = pages[pages.length - 2];
        if (prevPage) {
            top.postMessage([true, prevPage.href], '*');
        } else {
            top.postMessage([true, '..'], '*');
        }
    }
})

})();
