import { buildApp } from './application.js';
const PORT = 8000;
async function start() {
    const app = await buildApp();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`server started at ${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
