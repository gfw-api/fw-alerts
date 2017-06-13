const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const config = require('config');
const rp = require('request-promise');
const geohash = require('ngeohash');
const moment = require("moment");


class AreaService {
    static parseViirsAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Grouping viirs alerts by geohash precision 8');
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
        return alertsGrouped;
    }
    static parseGladAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Grouping glad alerts by geohash precision 8');
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.lat, alert.long, 8);
            if (!alertsIncluded[alertGeohash]) {
                alertsIncluded[alertGeohash] = true;
                const date = moment(alert.year).add(alert.julian_day, 'days');
                alertsGrouped.push({
                    lat: alert.lat,
                    lon: alert.long,
                    date: date.valueOf()
                })
            }
            // TODO: update the date when it was already added
        }, this);
        return alertsGrouped;
    }

    static async getViirsByGeojson(geojson, range = 7) {
        logger.debug(`Obtaining data of viirs with last ${range} days`);
        const areaGeometry = geojson.features[0].geometry;
        const viirsDataset = config.get('viirsDataset');
        const table = config.get('viirsDatasetTableName');

        const firstDay = moment().subtract(range, 'days');
        const dateFilter = firstDay.format('YYYY-MM-DD');
        const query = `select * from ${table} where acq_date > '${dateFilter}' and st_intersects(st_setsrid(st_geomfromgeojson('${JSON.stringify(areaGeometry)}'), 4326), the_geom)`;

        let uri = `/query/${viirsDataset}?sql=${query}`;
        logger.info(`Requesting viirs alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });
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
        const dateFilter = {
            year: firstDay.year(),
            day:  firstDay.diff(startYearDate, 'days')
        }

        const query = `select * from data where year >= ${dateFilter.year} and julian_day >= ${dateFilter.day}
            AND st_intersects(st_setsrid(st_geomfromgeojson('${JSON.stringify(areaGeometry)}'), 4326), the_geom)`;
        const uri = `/query/${gladDataset}?sql=${query}`;
        logger.info(`Requesting glad alerts with query ${uri}`);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });

            return AreaService.parseGladAlerts(result.data);
        } catch (err) {
            logger.error(err);
            return null;
        }
    }
}

module.exports = AreaService;
