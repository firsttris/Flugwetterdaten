export default {
    async fetch(request, env, ctx) {
        const TARGET_URL = "https://www.baden-airpark.de/app/themes/nova/app/FileExport/weather.php";

        // 1. Handle CORS Preflight (OPTIONS request)
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Max-Age": "86400",
                },
            });
        }

        try {
            // 2. Fetch the image from Baden-Airpark masking as a browser
            // We add a timestamp to prevent caching on their side if needed, 
            // but Cloudflare usually handles caching well.
            const response = await fetch(TARGET_URL + "?t=" + Date.now(), {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Referer": "https://www.baden-airpark.de/fluginformationen/wetter/",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
                },
            });

            // 3. Re-serve the response with CORS headers
            const newHeaders = new Headers(response.headers);
            newHeaders.set("Access-Control-Allow-Origin", "*");
            newHeaders.set("Cache-Control", "no-store"); // Don't cache the proxy response if you want live data

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });

        } catch (err) {
            return new Response("Error fetching image: " + err.message, { status: 500 });
        }
    },
};
