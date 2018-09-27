const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const config = require('config');
const rp = require('request-promise');
const geohash = require('ngeohash');
const moment = require("moment");


class AreaService {
    static parseViirsAlerts(alerts, geohashPrecision) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of viirs alerts before grouping', alerts.length);
        logger.debug(`Grouping viirs alerts by geohash precision ${geohashPrecision}`);
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.latitude, alert.longitude, geohashPrecision);
            if (!alertsIncluded[alertGeohash]) {
                alertsIncluded[alertGeohash] = true;
                alertsGrouped.push({
                    lat: alert.latitude,
                    lon: alert.longitude,
                    date: moment(alert.acq_date).valueOf()
                })
            }
            // TODO: update the date when it was already added
        }, this);
        logger.debug('Number of viirs alerts after grouping', alertsGrouped.length);
        return alertsGrouped;
    }
    static parseGladAlerts(alerts, geohashPrecision) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of glad alerts before grouping', alerts.length);
        logger.debug(`Grouping glad alerts by geohash precision ${geohashPrecision}`);
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.lat, alert.long, geohashPrecision);
            if (!alertsIncluded[alertGeohash]) {
                alertsIncluded[alertGeohash] = true;
                const year = alert.year.toString();
                const date = moment(year, 'YYYY').add(alert.julian_day, 'days');
                alertsGrouped.push({
                    lat: alert.lat,
                    lon: alert.long,
                    date: date.valueOf()
                })
            }
            // TODO: update the date when it was already added
        }, this);
        logger.debug('Number of glad alerts after grouping', alertsGrouped.length);
        return alertsGrouped;
    }

    static async getViirsByGeostore(geostore, range = 7, geohashPrecision = 8) {
        logger.debug(`Obtaining data of viirs with last ${range} days`);
        const viirsDataset = config.get('viirsDataset');
        const table = config.get('viirsDatasetTableName');

        const firstDay = moment().subtract(range, 'days');
        const dateFilter = firstDay.format('YYYY-MM-DD');
        const query = `select latitude, longitude, acq_date from ${table} where acq_date > '${dateFilter}'`;

        let uri = `/query/${viirsDataset}?sql=${query}&geostore=${geostore}`;
        logger.info(`Requesting viirs alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });
            logger.info('Got viirs alerts', result);
            return AreaService.parseViirsAlerts(result.data, geohashPrecision);
        } catch (err) {
            throw new Error(err);
        }
    }

    static async getGladByGeostore(geostore, range = 365, geohashPrecision = 8) {
        logger.debug(`Obtaining data of glad with last ${range} days`);

        const firstDay = moment().subtract(range, 'days');
        const period = `${firstDay.format('YYYY-MM-DD')},${moment().format('YYYY-MM-DD')}`

        const uri = `/glad-alerts/download?period=${period}&geostore=${geostore}&format=json`;

        logger.info(`Requesting glad alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });

            return AreaService.parseGladAlerts(result.data, geohashPrecision);
        } catch (err) {
            throw new Error(err);
        }
    }
}

module.exports = AreaService;
