/* eslint-disable max-len */
const nock = require('nock');
const chai = require('chai');
const moment = require('moment');

const { getTestServer } = require('./utils/test-server');

chai.should();

const requester = getTestServer();

describe('Get alerts tests', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Get alerts for a dataset that is not viirs nor glad should return a 400 error', async () => {
        const response = await requester.get(`/api/v1/fw-alerts/12345/67890`);

        response.status.should.equal(400);
        response.body.should.have.property('errors').and.be.an('array').and.length(2);
    });

    it('Get alerts for the glad dataset should return a 200 response (happy case)', async () => {
        const firstDay = moment().subtract(365, 'days');

        nock(process.env.GATEWAY_URL)
            .get('/v1/glad-alerts/download')
            .query({
                period: `${firstDay.format('YYYY-MM-DD')},${moment().format('YYYY-MM-DD')}`,
                geostore: 'ddc18d3a0692eea844f687c6d0fd3002',
                format: 'json'
            })
            .reply(200, {
                data: [{
                    year: 2020,
                    long: 97.74737500000012,
                    lat: 3.6766249999999765,
                    julian_day: 26,
                    confidence: 3
                }, {
                    year: 2019,
                    long: 97.75287500000013,
                    lat: 3.670124999999976,
                    julian_day: 160,
                    confidence: 3
                }, {
                    year: 2020,
                    long: 97.72162500000013,
                    lat: 3.6581249999999765,
                    julian_day: 75,
                    confidence: 2
                }]
            });

        const response = await requester.get(`/api/v1/fw-alerts/gladDatasetSlug/ddc18d3a0692eea844f687c6d0fd3002`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(3);
    });

    it('Get alerts for the viirs dataset should return a 200 response (happy case)', async () => {
        const firstDay = moment().subtract(7, 'days');
        const dateFilter = firstDay.format('YYYY-MM-DD');

        nock(process.env.GATEWAY_URL)
            .get('/v1/query/7af31612-a88a-4910-9b11-88c355b2f7a4')
            .query({
                sql: `select latitude, longitude, alert__date from table where alert__date > '${dateFilter}'`,
                geostore: 'ddc18d3a0692eea844f687c6d0fd3002'
            })
            .reply(200, {
                data: [
                    {
                        latitude: 12.42243,
                        longitude: 21.50799,
                        alert__date: '2020-03-16T00:00:00Z'
                    },
                    {
                        latitude: 24.55886,
                        longitude: 117.63361,
                        alert__date: '2020-03-16T00:00:00Z'
                    },
                    {
                        latitude: 39.5949,
                        longitude: 112.95085,
                        alert__date: '2020-03-16T00:00:00Z'
                    }
                ],
                meta: {
                    cloneUrl: {
                        http_method: 'POST',
                        url: '/dataset/7af31612-a88a-4910-9b11-88c355b2f7a4/clone',
                        body: {
                            dataset: {
                                datasetUrl: '/query/7af31612-a88a-4910-9b11-88c355b2f7a4?sql=select%20latitude%2C%20longitude%2C%20acq_date%20from%20vnp14imgtdl_nrt_global_7d%20where%20acq_date%20%3E%20%272020-03-15%27&geostore=ddc18d3a0692eea844f687c6d0fd3002',
                                application: [
                                    'your',
                                    'apps'
                                ]
                            }
                        }
                    }
                }
            });

        const response = await requester.get(`/api/v1/fw-alerts/viirsDatasetSlug/ddc18d3a0692eea844f687c6d0fd3002`);

        response.status.should.equal(200);
        response.body.should.have.property('data').and.be.an('array').and.length(3);
        response.body.data.should.deep.equal([
            {
                lat: 12.42243,
                lon: 21.50799,
                date: 1584316800000
            },
            {
                lat: 24.55886,
                lon: 117.63361,
                date: 1584316800000
            },
            {
                lat: 39.5949,
                lon: 112.95085,
                date: 1584316800000
            }
        ]);
    });

    afterEach(async () => {
        if (!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`);
        }
    });
});
