const logger = require('logger');
const nock = require('nock');
const request = require('superagent').agent();
const BASE_URL = require('./test.constants').BASE_URL;
require('should');

describe('E2E test', () => {

    before(() => {

        // simulating gateway communications
        nock(`${process.env.CT_URL}/v1`)
            .post('/', () => true)
            .reply(200, {
                status: 200,
                detail: 'Ok'
            });
    });

    /* Greeting Hi */
    // it('Service Greeting Hi', async() => {
    //     let response = null;
    //     try {
    //         response = await request.get(`${BASE_URL}/service/hi`).send();
    //     } catch (e) {
    //         logger.error(e);
    //     }
    //     response.status.should.equal(200);
    //     response.body.should.have.property('greeting').and.be.exactly('hi');
    // });

    after(() => {
    });
});
