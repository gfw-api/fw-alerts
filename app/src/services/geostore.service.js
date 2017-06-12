const config = require('config');
const logger = require('logger');
const ctRegisterMicroservice = require('ct-register-microservice-node');

class GeostoreService {
    static async getGeostoreById(geostoreId) {
        logger.debug('Obtaining geostore of geostoreId ', geostoreId);
        try {
            const result = await ctRegisterMicroservice.requestToMicroservice({
                uri: `/geostore/${geostoreId}`,
                method: 'GET',
                json: true
            });
            return result.data;
        } catch (err) {
            if (err.statusCode === 404) {
                throw new Error('Geostore not found');
            }
        }
    }
}

module.exports = GeostoreService;
