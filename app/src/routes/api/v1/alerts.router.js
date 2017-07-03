const logger = require('logger');
const Router = require('koa-router');
const GeostoreService = require('services/geostore.service');
const ConverterService = require('services/converter.service')
const AlertsService = require('services/alerts.service');
const ErrorSerializer = require('serializers/error.serializer');
const config = require('config');

const router = new Router({
    prefix: '/fw-alerts',
});

class AlertsRouter {
    static async getAlertsByGeostore(ctx) {
        logger.debug('Getting alerts by geostore');
        const dataset = ctx.params.dataset;
        const range = ctx.query.range;
        const geostore = await GeostoreService.getGeostoreById(ctx.params.geostore);
        const format = ctx.query.format || 'csv';

        if (geostore) {
            const geojson = geostore && geostore.attributes.geojson;
            let alerts = [];
            if (dataset === config.get('viirsDatasetSlug')) {
                logger.debug('Requesting viirs alerts');
                alerts = await AlertsService.getViirsByGeojson(geojson, range)
            } else if (dataset === config.get('gladDatasetSlug')) {
                logger.debug('Requesting glad alerts');
                alerts = await AlertsService.getGladByGeojson(geojson, range)
            } else {
                ctx.body = ErrorSerializer.serializeError(400, 'Dataset not supported');
                ctx.status = 400;
            }
            if (format === 'csv') {
                ctx.set('Content-type', 'text/csv');
                ctx.statusCode = 200;
                if (alerts && alerts.length) {
                    const fields = ['lat', 'lon', 'date'];
                    ctx.body = ConverterService.json2csv(alerts, fields);
                } else {
                    ctx.body = '';
                }
            } else {
                // this is not being serialized as we need to minimify the size of the json
                ctx.body = {
                    data: alerts
                }
            }
        } else {
            ctx.body = ErrorSerializer.serializeError(404, 'Geostore not found');
            ctx.status = 404;
        }
    }

}

router.get('/:dataset/:geostore', AlertsRouter.getAlertsByGeostore);

module.exports = router;
