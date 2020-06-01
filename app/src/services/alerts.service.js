const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const config = require('config');
const moment = require('moment');


class AreaService {

    static parseViirsAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of viirs alerts before parsing', alerts.length);
        const alertsParsed = [];
        alerts.forEach((alert) => {
            alertsParsed.push({
                lat: alert.latitude,
                lon: alert.longitude,
                date: moment(alert.alert__date).valueOf()
            });
            // TODO: update the date when it was already added
        }, this);
        logger.debug('Number of viirs alerts after parsing', alertsParsed.length);
        return alertsParsed;
    }

    static parseGladAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of glad alerts before parsing', alerts.length);

        const alertsParsed = [];

        alerts.forEach((alert) => {

            const year = alert.year.toString();
            const date = moment(year, 'YYYY').add(alert.julian_day, 'days');
            alertsParsed.push({
                lat: alert.lat,
                lon: alert.long,
                date: date.valueOf()
            });
            // TODO: update the date when it was already added
        }, this);
        logger.debug('Number of glad alerts after parsing', alertsParsed.length);
        return alertsParsed;
    }

    static async getViirsByGeostore(geostore, range = 7) {
        logger.debug(`Obtaining data of viirs with last ${range} days`);
        const viirsDataset = config.get('viirsDataset');

        const firstDay = moment().subtract(range, 'days');
        const dateFilter = firstDay.format('YYYY-MM-DD');
        const query = `select latitude, longitude, alert__date from table where alert__date > '${dateFilter}'`;

        const uri = `/query/${viirsDataset}?sql=${query}&geostore=${geostore}`;
        logger.info(`Requesting viirs alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });
            logger.info('Got viirs alerts', result);
            return AreaService.parseViirsAlerts(result.data);
        } catch (err) {
            throw new Error(err);
        }
    }

    static async getGladByGeostore(geostore, range = 365) {
        logger.debug(`Obtaining data of glad with last ${range} days`);

        const firstDay = moment().subtract(range, 'days');
        const period = `${firstDay.format('YYYY-MM-DD')},${moment().format('YYYY-MM-DD')}`;

        const uri = `/glad-alerts/download?period=${period}&geostore=${geostore}&format=json`;

        logger.info(`Requesting glad alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });
            logger.info('Got glad alerts', result.data.length);
            return AreaService.parseGladAlerts(result.data);
        } catch (err) {
            throw new Error(err);
        }
    }

}

module.exports = AreaService;
