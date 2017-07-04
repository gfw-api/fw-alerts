const logger = require('logger');
const ErrorSerializer = require('serializers/error.serializer');
const config = require('config');

class AlertsValidator {

    static isValidDataset(property) {
        return property === config.get('viirsDatasetSlug') || property === config.get('gladDatasetSlug');
    }

    static isValidFormat(property) {
        return property === 'csv' || property === 'json';
    }

    static async get(ctx, next) {
        logger.debug('Validating params to get alerts');
        ctx.checkParams('dataset').check(dataset => AlertsValidator.isValidDataset(dataset), 'Dataset not supported');
        ctx.checkParams('geostore').len(32);
        ctx.checkQuery('range').optional().isInt();
        ctx.checkQuery('output').optional().check(output => AlertsValidator.isValidFormat(output), 'Format has to be json or csv');

        if (ctx.errors) {
            ctx.body = ErrorSerializer.serializeValidationBodyErrors(ctx.errors);
            ctx.status = 400;
            return;
        }
        await next();
    }
}

module.exports = AlertsValidator;
