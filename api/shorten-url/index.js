const { CosmosClient } = require("@azure/cosmos");
const crypto = require("crypto");

module.exports = async function (context, req) {
    const longUrl = req.body?.url;

    if (!longUrl) {
        context.res = {
            status: 400,
            body: { error: "URL is required" }
        };
        return;
    }

    const shortcode = crypto.randomBytes(3).toString("hex"); // e.g., "4e9d1a"

    try {
        const client = new CosmosClient(process.env.COSMOS_DB_CONNECTION_STRING);
        const container = client.database("Shortener").container("Urls");

        await container.items.create({
            id: shortcode,
            longUrl: longUrl,
            createdAt: new Date().toISOString()
        });

        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const shortUrl = `${protocol}://${host}/${shortcode}`;

        context.res = {
            status: 200,
            body: { shortUrl }
        };

    } catch (err) {
        context.res = {
            status: 500,
            body: { error: "Failed to shorten URL", details: err.message }
        };
    }
};
