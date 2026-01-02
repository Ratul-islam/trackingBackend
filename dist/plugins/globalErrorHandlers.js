export default async function errorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
        app.log.error(error);
        if (error.validation) {
            return reply.status(400).send({
                status: 'fail',
                message: 'Validation error',
                errors: error.validation,
            });
        }
        reply.status(error.statusCode || 500).send({
            status: 'error',
            message: error.message || 'Internal Server Error',
        });
    });
}
