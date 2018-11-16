//
// Change bookmark URLs to the correct gopher:// ones.
//

var url = browser.runtime.getURL('gopher.html?');

browser.bookmarks.onCreated.addListener(function(id, info) {
    if (info.url && info.url.startsWith(url)) {
        var gopher = decodeURIComponent(info.url.substr(url.length));
        if (gopher.startsWith('gopher://')) {
            browser.bookmarks.update(id, {'url': gopher});
        }
    }
});
