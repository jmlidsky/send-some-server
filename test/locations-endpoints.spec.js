const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')

describe.only('Locations Endpoints', function () {
    let db

    const {
        testUsers,
        testLocations,
        testProblems,
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

    describe(`GET /api/locations`, () => {
        context(`Given no locations`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/locations')
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })
        context(`Given there are locations in the database`, () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations,
                )
            )

            it('responds with 200 and all of the locations', () => {
                const expectedLocations = testLocations.map(location =>
                    helpers.makeExpectedLocation(
                        testUsers,
                        location
                    )
                )
                return supertest(app)
                    .get('/api/locations')
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedLocations)
            })
        })
    })

    describe(`GET /api/locations/:location_id`, () => {
        context(`Given no locations`, () => {
            beforeEach(() =>
                helpers.seedUsers(
                    db,
                    testUsers)
            )

            it(`responds with 404`, () => {
                const location_id = 123456
                return supertest(app)
                    .get(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Location doesn't exist` } })
            })
        })

        context('Given there are locations in the database', () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations,
                )
            )

            it('responds with 200 and the specified location', () => {
                const location_id = 2
                const expectedLocation = helpers.makeExpectedLocation(
                    testUsers,
                    testLocations[location_id - 1],
                )

                return supertest(app)
                    .get(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedLocation)
            })
        })
    })

    describe.only(`GET /api/locations/:location_id/problems`, () => {
        context(`Given no problems`, () => {
            beforeEach(() =>
                helpers.seedUsers(db, testUsers)
            )

            it(`responds with 404`, () => {
                const location_id = 123456
                return supertest(app)
                    .get(`/api/locations/${location_id}/problems`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Problem doesn't exist` } })
            })
        })

        context('Given there are problems for a location in the database', () => {
            beforeEach('insert problems', () =>
                helpers.seedProblemsTable(
                    db,
                    testUsers,
                    testLocations,
                    testProblems
                )
            )

            it('responds with 200 and the problems in a specified location', () => {
                const location_id = 1
                const expectedProblems = helpers.makeExpectedProblem(
                    testUsers, testLocations
                )

                return supertest(app)
                    .get(`/api/locations/${location_id}/problems`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedProblems)
            })
        })
    })
})