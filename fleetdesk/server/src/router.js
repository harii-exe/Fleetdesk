const url = require('node:url');

class Router {
    constructor() {
        this.routes = [];
        this.middlewares = [];
    }

    use(fn) {
        this.middlewares.push(fn);
    }

    add(method, pattern, ...handlers) {
        // Convert pattern like /api/vehicles/:id to regex and param names
        const paramNames = [];
        const regexStr = '^' + pattern.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        }) + '$';

        this.routes.push({
            method: method.toUpperCase(),
            pattern,
            regex: new RegExp(regexStr),
            paramNames,
            handlers
        });
    }

    get(pattern, ...handlers) { this.add('GET', pattern, ...handlers); }
    post(pattern, ...handlers) { this.add('POST', pattern, ...handlers); }
    put(pattern, ...handlers) { this.add('PUT', pattern, ...handlers); }
    patch(pattern, ...handlers) { this.add('PATCH', pattern, ...handlers); }
    delete(pattern, ...handlers) { this.add('DELETE', pattern, ...handlers); }

    async handle(req, res) {
        // Enrich res with helper methods
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };

        res.json = (data, code = null) => {
            if (code) res.statusCode = code;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(JSON.stringify(data));
        };

        // Handle preflight CORS
        if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.statusCode = 204;
            return res.end();
        }

        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        req.query = parsedUrl.query || {};

        // Parse JSON body if present
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            try {
                req.body = await this.parseBody(req);
            } catch (err) {
                return res.status(400).json({ success: false, error: 'Malformed JSON payload: ' + err.message });
            }
        } else {
            req.body = {};
        }

        // Run global middlewares
        let middlewareIdx = 0;
        const runMiddlewares = async () => {
            if (middlewareIdx < this.middlewares.length) {
                const mw = this.middlewares[middlewareIdx++];
                await mw(req, res, runMiddlewares);
            } else {
                await this.matchAndExecute(req, res, pathname);
            }
        };

        await runMiddlewares();
    }

    parseBody(req) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
                if (data.length > 5 * 1024 * 1024) { // 5MB limit
                    reject(new Error('Payload too large'));
                }
            });
            req.on('end', () => {
                if (!data.trim()) return resolve({});
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }

    async matchAndExecute(req, res, pathname) {
        for (const route of this.routes) {
            if (route.method === req.method) {
                const match = pathname.match(route.regex);
                if (match) {
                    req.params = {};
                    route.paramNames.forEach((name, i) => {
                        req.params[name] = decodeURIComponent(match[i + 1]);
                    });

                    // Execute chain of handlers for this route
                    let handlerIdx = 0;
                    const next = async () => {
                        if (handlerIdx < route.handlers.length) {
                            const handler = route.handlers[handlerIdx++];
                            try {
                                await handler(req, res, next);
                            } catch (err) {
                                console.error('Route Handler Error:', err);
                                res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
                            }
                        }
                    };

                    await next();
                    return;
                }
            }
        }

        // Not an API match
        return false;
    }
}

module.exports = Router;
