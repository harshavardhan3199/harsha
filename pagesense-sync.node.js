/**
 * PageSense cookie-sync endpoint (Safari ITP fix) — Node.js / Express.
 * Re-issues PageSense first-party cookies via Set-Cookie so Safari
 * honours their full lifetime. Mount on the same domain as your site.
 *
 *   const pagesenseSync = require('./pagesense-sync.node.js');
 *   app.get('/pagesense-sync', pagesenseSync);
 */

// --- CONFIG: your registrable domain, with leading dot ---
const COOKIE_DOMAIN = '.example.com';

const MAX_AGE_SECONDS = 34560000; // 400 days

module.exports = function pagesenseSync(req, res) {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const raw = req.headers.cookie || '';

    const setCookies = raw.split(';').reduce((acc, pair) => {
        const idx = pair.indexOf('=');
        if (idx < 0) return acc;
        const name = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (name.indexOf('zab') === 0 || name.indexOf('zps') === 0) {
            acc.push(
                name + '=' + value +
                '; Max-Age=' + MAX_AGE_SECONDS +
                '; Path=/' +
                '; Domain=' + COOKIE_DOMAIN +
                (isHttps ? '; Secure; SameSite=None' : '; SameSite=Lax')
                // intentionally NOT HttpOnly — tracker must read these cookies
            );
        }
        return acc;
    }, []);

    if (setCookies.length) {
        res.setHeader('Set-Cookie', setCookies);
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(204).end();
};
