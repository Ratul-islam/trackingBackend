import * as authController from './auth.controller.js';
export default async function authRoutes(app) {
    app.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                    firstName: { type: 'string', minLength: 2 },
                    lastName: { type: 'string', minLength: 2 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                },
            },
        },
    }, async (request, reply) => {
        await authController.register(app, request, reply);
    });
    app.post('/verify', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'code', 'type'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    code: { type: 'string', minLength: 4 },
                    type: { type: 'string', enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'] },
                    password: { type: 'string', minLength: 6 },
                },
                if: {
                    properties: { type: { const: 'PASSWORD_RESET' } },
                },
                then: {
                    required: ['password'],
                },
            },
        },
    }, async (request, reply) => {
        await authController.verify(request, reply);
    });
    app.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                },
            },
        },
    }, authController.login);
    app.post('/refresh', {
        schema: {
            body: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        await authController.refreshToken(request, reply);
    });
    app.post('/forgot-password', {
        schema: {
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' },
                },
            },
        },
    }, async (request, reply) => {
        await authController.forgotPassword(app, request, reply);
    });
    app.post('/reset-password', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'code', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    code: { type: 'string', minLength: 4 },
                    password: { type: 'string', minLength: 6 },
                },
            },
        },
    }, async (request, reply) => {
        await authController.resetPassword(request, reply);
    });
    app.post('/logout', {
        schema: {
            body: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        await authController.logout(request, reply);
    });
}
