const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const config = require('config');
const rp = require('request-promise');
const geohash = require('ngeohash');
const moment = require("moment");


class AreaService {
    static parseViirsAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of viirs alerts before grouping', alerts.length);
        logger.debug('Grouping viirs alerts by geohash precision 8', alerts);
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.latitude, alert.longitude, 8);
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
        logger.debug('Grouped viirs alerts by geohash precision 8', alertsGrouped);
        return alertsGrouped;
    }
    static parseGladAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Number of glad alerts before grouping', alerts.length);
        logger.debug('Grouping glad alerts by geohash precision 8', alerts);
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.lat, alert.long, 8);
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
        logger.debug('Grouped glad alerts by geohash precision 8', alertsGrouped);
        return alertsGrouped;
    }

    static async getViirsByGeojson(geojson, range = 7) {
        logger.debug(`Obtaining data of viirs with last ${range} days`);
        const areaGeometry = geojson.features[0].geometry;
        const viirsDataset = config.get('viirsDataset');
        const table = config.get('viirsDatasetTableName');

        const firstDay = moment().subtract(range, 'days');
        const dateFilter = firstDay.format('YYYY-MM-DD');
        const query = `select latitude, longitude, acq_date from ${table} where acq_date > '${dateFilter}' and st_intersects(st_setsrid(st_geomfromgeojson('${JSON.stringify(areaGeometry)}'), 4326), the_geom)`;

        let uri = `/query/${viirsDataset}?sql=${query}`;
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
            logger.error(err);
            return null;
        }
    }

    static async getGladByGeojson(geojson, range = 6) {
        logger.debug(`Obtaining data of glad with last ${range} months`);
        const areaGeometry = geojson.features[0].geometry;
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

        const query = `select lat, long, julian_day, year from data where ${dateQuery}
            AND st_intersects(st_setsrid(st_geomfromgeojson('${JSON.stringify(areaGeometry)}'), 4326), the_geom)`;
        const uri = `/query/${gladDataset}?sql=${query}`;
        logger.info(`Requesting glad alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });

            logger.info('Got glad alerts', result);
            return AreaService.parseGladAlerts(result.data);
        } catch (err) {
            logger.error(err);
            return null;
        }
    }
}

module.exports = AreaService;
