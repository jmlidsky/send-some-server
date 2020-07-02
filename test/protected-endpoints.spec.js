const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')

describe('Protected endpoints', function () {
    let db

    const {
        testUsers,
        testLocations,
        testProblems
    } = helpers.makeFixtures()

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: config.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('cleanup', () => helpers.cleanTables(db))

    afterEach('cleanup', () => helpers.cleanTables(db))

    beforeEach('insert problems', () =>
        helpers.seedDbTables(
            db,
            testUsers,
            testLocations,
            testProblems
        )
    )

    const protectedEndpoints = [
        {
            name: 'GET /api/locations',
            path: '/api/locations/1',
            method: supertest(app).get,
        },
        {
            name: 'POST /api/locations',
            path: '/api/locations/1',
            method: supertest(app).post,
        },
        {
            name: 'GET /api/locations/:location_id',
            path: '/api/locations/1',
            method: supertest(app).get,
        },
        {
            name: 'PATCH /api/locations/:location_id',
            path: '/api/locations/1',
            method: supertest(app).patch,
        },
        {
            name: 'DELETE /api/locations/:location_id',
            path: '/api/locations/1',
            method: supertest(app).delete,
        },
        {
            name: 'GET /api/locations/:location_id/problems',
            path: '/api/locations/1/problems',
            method: supertest(app).get,
        },
        {
            name: 'POST /api/locations/:location_id/problems',
            path: '/api/locations/1/problems',
            method: supertest(app).post,
        },
        {
            name: 'GET /api/locations/:location_id/problems/:problem_id',
            path: '/api/locations/1/problems/1',
            method: supertest(app).get,
        },
        {
            name: 'PATCH /api/locations/:location_id/problems/:problem_id',
            path: '/api/locations/1/problems/1',
            method: supertest(app).patch,
        },
        {
            name: 'DELETE /api/locations/:location_id/problems/:problem_id',
            path: '/api/locations/1/problems/1',
            method: supertest(app).delete,
        },
    ]

    protectedEndpoints.forEach(endpoint => {
        describe(endpoint.name, () => {
            it(`responds 401 'Missing bearer token' when no bearer token`, () => {
                return endpoint.method(endpoint.path)
                    .expect(401, { error: `Missing bearer token` })
            })

            it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
                const validUser = testUsers[0]
                const invalidSecret = 'bad-secret'
                return endpoint.method(endpoint.path)
                    .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
                    .expect(401, { error: `Unauthorized request` })
            })

            it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
                const invalidUser = { username: 'user-not-existy', id: 1 }
                return endpoint.method(endpoint.path)
                    .set('Authorization', helpers.makeAuthHeader(invalidUser))
                    .expect(401, { error: `Unauthorized request` })
            })
        })
    })
})