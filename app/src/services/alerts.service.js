const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const config = require('config');
const rp = require('request-promise');
const geohash = require('ngeohash');
const moment = require("moment");


class AreaService {
    static parseAlerts(alerts) {
        if (!alerts || !alerts.length) return [];

        logger.debug('Grouping alerts by geohash precision 8');
        const alertsGrouped = [];
        const alertsIncluded = {};
        alerts.forEach(function(alert) {
            const alertGeohash = geohash.encode(alert.lat, alert.long, 8);
            if (!alertsIncluded[alertGeohash]) {
                alertsIncluded[alertGeohash] = true;
                alertsGrouped.push({
                    lat: alert.lat,
                    lon: alert.long
                })
            }
        }, this);
        return alertsGrouped;
    }

    static async getViirsByGeojson(geojson, range) {
        // TODO: filter by range 1-7 days;
        logger.debug('Obtaining data of viirs');
        const viirsDataset = config.get('viirsDataset');
        const table = config.get('viirsDatasetTableName');
        let uri = `/query/${viirsDataset}?sql=select * from ${table} where acq_date > '2017-01-01'`;
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri,
                method: 'GET',
                json: true
            });
            return result;
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    static async getGladByGeojson(geojson, range) {
        logger.debug('Obtaining data of glad');
        const areaGeometry = geojson.features[0].geometry;
        const gladDataset = config.get('gladDataset');
        // TODO: filter by range 1-7 months;
        // const now = moment();
        // const dateFilter = {
        //     year: now.year(),
        //     day: now.subtract(range, 'month')
        // }
        const query = `select lat, long from data where year >= 2016 AND st_intersects(st_setsrid(st_geomfromgeojson('${JSON.stringify(areaGeometry)}'), 4326), the_geom)`;
        // const uri = `/query/${gladDataset}?sql=${query}`;

        const uriPro = `https://production-api.globalforestwatch.org/v1/query/${gladDataset}?sql=${query}`;
        try {
            // const result = await ctRegisterMicroservice.requestToMicroservice({
            //     uri,
            //     method: 'GET',
            //     json: true
            // });
            var options = {
                uri: uriPro,
                headers: {
                    'Authentication': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwiaW5zZXJ0aW5nIjp0cnVlLCJnZXR0ZXJzIjp7ImluZm9TdGF0dXMiOnsibnVtUmV0cmllcyI6MH19LCJ3YXNQb3B1bGF0ZWQiOmZhbHNlLCJzY29wZSI6eyJfX3YiOjAsIm5hbWUiOiJGVyBhbGVydHMiLCJ1cmwiOiJodHRwOi8vbXltYWNoaW5lOjMwMDUiLCJ2ZXJzaW9uIjoxLCJfaWQiOiI1OTNlYThmYmIyYjhmMTAwMTE5YWRjYzYiLCJ0YWdzIjpbXSwiZW5kcG9pbnRzIjpbXSwidXBkYXRlZEF0IjoiMjAxNy0wNi0xMlQxNDo0NToxNS45MjRaIiwiaW5mb1N0YXR1cyI6eyJudW1SZXRyaWVzIjowfSwic3RhdHVzIjoicGVuZGluZyIsInBhdGhMaXZlIjoiL3BpbmciLCJwYXRoSW5mbyI6Ii9pbmZvIn0sImFjdGl2ZVBhdGhzIjp7InBhdGhzIjp7InZlcnNpb24iOiJyZXF1aXJlIiwidXBkYXRlZEF0IjoicmVxdWlyZSIsImluZm9TdGF0dXMubnVtUmV0cmllcyI6InJlcXVpcmUiLCJwYXRoTGl2ZSI6InJlcXVpcmUiLCJwYXRoSW5mbyI6InJlcXVpcmUiLCJ1cmwiOiJyZXF1aXJlIiwibmFtZSI6InJlcXVpcmUifSwic3RhdGVzIjp7Imlnbm9yZSI6e30sImRlZmF1bHQiOnt9LCJpbml0Ijp7fSwibW9kaWZ5Ijp7fSwicmVxdWlyZSI6eyJ2ZXJzaW9uIjp0cnVlLCJ1cGRhdGVkQXQiOnRydWUsImluZm9TdGF0dXMubnVtUmV0cmllcyI6dHJ1ZSwicGF0aExpdmUiOnRydWUsInBhdGhJbmZvIjp0cnVlLCJ1cmwiOnRydWUsIm5hbWUiOnRydWV9fSwic3RhdGVOYW1lcyI6WyJyZXF1aXJlIiwibW9kaWZ5IiwiaW5pdCIsImRlZmF1bHQiLCJpZ25vcmUiXX0sImVtaXR0ZXIiOnsiZG9tYWluIjpudWxsLCJfZXZlbnRzIjp7fSwiX2V2ZW50c0NvdW50IjoyLCJfbWF4TGlzdGVuZXJzIjowfX0sImlzTmV3IjpmYWxzZSwiX2RvYyI6eyJwYXRoSW5mbyI6Ii9pbmZvIiwicGF0aExpdmUiOiIvcGluZyIsInN0YXR1cyI6InBlbmRpbmciLCJpbmZvU3RhdHVzIjp7Im51bVJldHJpZXMiOjB9LCJ1cGRhdGVkQXQiOiIyMDE3LTA2LTEyVDE0OjQ1OjE1LjkyNFoiLCJlbmRwb2ludHMiOltdLCJ0YWdzIjpbXSwiX2lkIjoiNTkzZWE4ZmJiMmI4ZjEwMDExOWFkY2M2IiwidmVyc2lvbiI6MSwidXJsIjoiaHR0cDovL215bWFjaGluZTozMDA1IiwibmFtZSI6IkZXIGFsZXJ0cyIsIl9fdiI6MH0sImlhdCI6MTQ5NzI3ODcxNX0.JDO2rchLLgL8Ck69QifBW_rY7pne-2ncVBbH_Qs1Y3g&'
                },
                json: true
            };

            const results = await rp(options);

            logger.debug('Before merging', results.data.length);
            const alerts = AreaService.parseAlerts(results.data);
            logger.debug('After alerts', alerts.length);

            return alerts;
        } catch (err) {
            logger.error(err);
            return null;
        }
    }
}

module.exports = AreaService;
