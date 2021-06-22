const logger = require('logger');
const config = require('config');
const axios = require('axios');

class GFWDataAPIService {

    static async queryDataset(dataset, query, geostoreId = null, datasetVersion = 'latest') {
        const axiosRequestConfig = {
            baseURL: config.get('gfwDataApi.url'),
            method: 'GET',
            params: {},
            headers: {}
        };

        try {
            axiosRequestConfig.url = `/dataset/${dataset}/${datasetVersion}/query`;

            const apiKey = config.get('gfwDataApi.apiKey');
            if (apiKey) {
                axiosRequestConfig.headers['x-api-key'] = apiKey;
            }

            if (geostoreId) {
                axiosRequestConfig.params.geostore_id = geostoreId;
            }
            axiosRequestConfig.params.sql = query;

            const response = await axios(axiosRequestConfig);

            return response.data;
        } catch (err) {
            logger.info('Error doing request', err);
            return err;
        }
    }

}

module.exports = GFWDataAPIService;
