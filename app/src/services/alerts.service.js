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
        logger.debug(`Grouping viirs alerts by geohash precision ${geohashPrecision}`, alerts);
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
        logger.debug(`Grouping glad alerts by geohash precision ${geohashPrecision}`, alerts);
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

    static async getGladByGeostore(geostore, range = 6, geohashPrecision = 8) {
        logger.debug(`Obtaining data of glad with last ${range} months`);
        const gladDataset = config.get('gladDataset');

        const firstDay = moment().subtract(range, 'months');
        const startYearDate = moment().subtract(range, 'months').startOf('year');
        const dateFromFilter = {
            year: firstDay.year(),
            day:  firstDay.diff(startYearDate, 'days')
        }
        const dateCurrentFilter = {
            year: moment().year(),
            day: moment().diff(moment().startOf('year'), 'days')
        }

        let dateQuery = '';
        if (dateFromFilter.year === dateCurrentFilter.year) {
            dateQuery += ` year = ${dateFromFilter.year} and julian_day >= ${dateFromFilter.day}`;
        } else {
            dateQuery += ' (';
            for (let i = dateFromFilter.year; i <= dateCurrentFilter.year; i++) {
                if (i > dateFromFilter.year){
                    dateQuery +=' or ';
                }
                if (i === dateFromFilter.year) {
                    dateQuery += `(year = '${i}' and julian_day >= ${dateFromFilter.day})`;
                } else if(i === dateCurrentFilter.day) {
                    dateQuery += `(year = '${i}' and julian_day <= ${dateCurrentFilter.day})`;
                } else {
                    dateQuery += `(year = '${i}')`;
                }
            }
            dateQuery += ')';
        }

        const query = `select lat, long, julian_day, year from data where ${dateQuery}`;
        const uri = `/query/${gladDataset}?sql=${query}&geostore=${geostore}`;
        logger.info(`Requesting glad alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });

            logger.info('Got glad alerts', result);
            return AreaService.parseGladAlerts(result.data, geohashPrecision);
        } catch (err) {
            throw new Error(err);
        }
    }
}

module.exports = AreaService;
