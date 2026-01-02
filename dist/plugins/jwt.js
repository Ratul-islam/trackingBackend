import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
// wrapping with fastify-plugin ensures the registration is applied at the root scope
export default fp(async function jwtPlugin(app) {
    await app.register(fastifyJwt, {
        secret: process.env.JWT_SECRET || 'supersecret',
        sign: { expiresIn: '15m' },
    });
    app.decorate('verifyJWT', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
});
