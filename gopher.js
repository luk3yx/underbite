//
// gopher.js - Navigate the gopher iframe
//

var proxy_url   = 'https://gopher.floodgap.com/gopher/gw.lite';
var previous_url  = 'gopher://127.0.0.1';
var current_url = 'gopher://127.0.0.1';
var urlbar;
var frame;
var display_onload = false;
var dark_mode = false;
var useHistory = [];

// Use the tab instead of the window in case of private tabs.
browser.tabs.getCurrent().then(function(s) {
    if (! s) {
        useHistory = true;
        return;
    }
    var urls = useHistory;
    useHistory = ! s.incognito;
    if (history) {
        for (var i = 0; i < urls.length; i++) {
            browser.history.addUrl({'url': urls[i], 'title': urls[i]});
        }
    }
})

window.addEventListener('load', function() {
    urlbar = document.getElementById('urlbar');
    frame  = document.getElementsByClassName('frame')[0];
    var n = document.getElementsByClassName('button');
    for (var i = 0; i < n.length; i++) {
        var e = n[i];
        if (e.id == 'urlbar') continue;
        if (e.id != 'toggle-dark-mode')
            e.addEventListener('click', icon_click);
        e.addEventListener('dragstart', icon_drag);
    }
    document.getElementById('urlwrapper').onsubmit = icon_click;
    document.getElementById('toggle-dark-mode').addEventListener('click',
        toggle_dark_mode);
    if (window.location.search.length > 1) {
        navigate(decodeURIComponent(window.location.search.substr(1)));
    } else {
        navigate(current_url);
    }

    if (display_onload) {
        display_onload();
    }
});

function _raw_update_dark_mode() {
    document.documentElement.className = dark_mode ? 'dark' : '';
    if (frame) frame.contentWindow.postMessage('.', '*');
}

async function check_dark_mode() {
    var res = await browser.storage.local.get('dark_mode');
    dark_mode = res.dark_mode;
    _raw_update_dark_mode();
}
check_dark_mode();

window.addEventListener('focus', check_dark_mode);

function toggle_dark_mode() {
    dark_mode = ! dark_mode;
    browser.storage.local.set({dark_mode});
    _raw_update_dark_mode();
}

function display_url(url) {
    while (url.endsWith('/')) {
        url = url.substr(0, url.length - 1);
    }
    try {
        urlbar.value = url;
        if (url == '') {
            document.title = 'gopher://...';
        } else {
            current_url = url;
            document.title = url;
        }
        var historyUrl = '?' + encodeURIComponent(current_url);
        browser.history.deleteUrl({'url': window.location.href});
        window.history.replaceState('', document.title, historyUrl);
        browser.history.deleteUrl({'url': window.location.href});
        if (typeof(useHistory) == 'object') {
            useHistory.push(current_url);
        } else if (useHistory) {
            browser.history.addUrl({'url': current_url, 'title': current_url});
        }
    } catch(e) {
        display_onload = function() {
            display_url(url)
        }
    }
}

function icon_click(e) {
    var obj = e.target;
    if (obj.tagName.toLowerCase() == 'img') {
        obj = obj.parentElement;
    }
    var url = obj.getAttribute('data-url');
    if (! url) {
        url = urlbar.value;
    }
    navigate(url);
    if (e.target.id == 'urlwrapper') {
        return false;
    }
}

function icon_drag(e) {
    e.preventDefault();
    return false;
}

function navigate(ourl) {
    var protocol = 'gopher';
    var u = ourl.split('://');
    var v = u[0].split('/')[0];
    var url = ourl;
    if (u[0] != url && u[0] == v) {
        protocol = u.shift().toLowerCase();
        url = u.join('/');
    }
    if (protocol != 'gopher') {
        if (confirm('Are you sure you want to leave gopherspace?')) {
            window.location.href = ourl;
        }
        return;
    } else if ((url + '/').startsWith('../')) {
        if (previous_url == '..') {
            // No breadcrumbs, guess the parent URL.
            v = current_url.split('/');
            v.shift();
            v.shift();
            if (v.length > 1) {
                if (v[v.length - 1] == '') {
                    v.pop();
                }
                v.pop();
            }
        } else {
            // Use the parent URL specified in the breadcrumbs.
            v = previous_url.split('/');
            v.shift();
            v.shift();
        }
        var x = url.split('/');
        x.shift()
        url = v.concat(x).join('/');
    } else if ((url + '/').startsWith('./')) {
        v = current_url.split('/');
        v.shift();
        v.shift();
        url = v.concat(url.split('/')).join('/');
    } else if (url.startsWith('/')) {
        url = current_url.split('/')[2] + url;
    }
    if (url == '' || (url + '/').startsWith('127.0.0.1/')) {
        frame.src = 'about.html';
        previous_url = '..';
        display_url('gopher://127.0.0.1');
        urlbar.value = '';
    } else {
        url = 'gopher://' + url;
        frame.src = proxy_url + '?' + url;
        display_url(url);
    }
}

window.addEventListener('message', function(e) {
    if (e.origin == 'https://gopher.floodgap.com') {
        var url = decodeURIComponent(e.data[1]);
        if (e.data[0]) {
            previous_url = url;
        } else {
            display_url(url.substr(1));
            previous_url = '..';
        }
    }
})
