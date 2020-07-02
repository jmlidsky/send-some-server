const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')
const supertest = require('supertest')
const { expect } = require('chai')

describe('Locations Endpoints', function () {
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
            beforeEach('insert users', () =>
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

    describe(`GET /api/locations/:location_id/problems`, () => {
        context(`Given no problems`, () => {
            beforeEach(() =>
                helpers.seedLocationsTable(db, testUsers, testLocations)
            )

            it(`responds with 200 and an empty list`, () => {
                const location_id = 123456
                return supertest(app)
                    .get(`/api/locations/${location_id}/problems`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, [])
            })
        })

        context('Given there are problems for a location in the database', () => {
            beforeEach('insert problems', () =>
                helpers.seedDbTables(
                    db,
                    testUsers,
                    testLocations,
                    testProblems
                )
            )

            it('responds with 200 and the problems in a specified location', () => {
                const location_id = 2
                const expectedProblems = helpers.makeExpectedProblems(
                    testUsers, testLocations, location_id, testProblems
                )

                return supertest(app)
                    .get(`/api/locations/${location_id}/problems`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedProblems)
            })
        })
    })

    describe(`GET /api/locations/:location_id/problems/:problem_id`, () => {
        context(`Given no problems`, () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations,
                )
            )

            it(`responds with 404`, () => {
                const location_id = 123456
                const problem_id = 123445
                return supertest(app)
                    .get(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Problem doesn't exist` } })
            })
        })

        context(`Given there are problems in the database`, () => {
            beforeEach('insert problems', () =>
                helpers.seedDbTables(
                    db,
                    testUsers,
                    testLocations,
                    testProblems
                )
            )

            it(`responds with 200 and a specific problem`, () => {
                const location_id = 2
                const problem_id = 2
                const expectedProblem = helpers.makeExpectedProblems(
                    testUsers,
                    testLocations,
                    2,
                    testProblems
                )
                // console.log(expectedProblem[1])

                return supertest(app)
                    .get(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(200, expectedProblem[1])
            })
        })
    })

    describe(`POST /api/locations`, () => {
        beforeEach('insert locations', () =>
            helpers.seedLocationsTable(
                db,
                testUsers,
                testLocations
            )
        )

        it(`creates a location, responding with 201`, () => {
            const newLocation = {
                location_name: 'Here',
            }
            return supertest(app)
                .post('/api/locations')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newLocation)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.location_name).to.eql(newLocation.location_name)

                })
        })
    })

    describe(`POST /api/locations/:location_id/problems`, () => {
        beforeEach('insert problems', () => {
            helpers.seedDbTables(
                db,
                testUsers,
                testLocations,
                testProblems
            )
        })

        it(`creates a location, responding with 201`, () => {
            const newLocation = {
                location_name: 'Here',
            }
            return supertest(app)
                .post('/api/locations')
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newLocation)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.location_name).to.eql(newLocation.location_name)
                })
        })
    })

    describe(`POST /api/locations/:location_id/problems`, () => {
        beforeEach('insert problems', () =>
            helpers.seedDbTables(
                db,
                testUsers,
                testLocations,
                testProblems
            )
        )

        it(`creates a problem, responding with 201`, () => {
            const newProblem = {
                problem_name: 'That',
                grade: 'V2',
                area: 'Here',
                notes: 'Ouch',
                sent: true
            }
            const location_id = 1
            // console.log(newProblem)
            return supertest(app)
                .post(`/api/locations/${location_id}/problems`)
                .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                .send(newProblem)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.problem_name).to.eql(newProblem.problem_name)
                    expect(res.body.grade).to.eql(newProblem.grade)
                    expect(res.body.area).to.eql(newProblem.area)
                    expect(res.body.notes).to.eql(newProblem.notes)
                    expect(res.body.sent).to.eql(newProblem.sent)
                })
        })
    })

    describe(`DELETE /api/locations/:location_id`, () => {
        context(`Given no locations`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )

            it(`responds with 404 when location doesn't exist`, () => {
                const location_id = 12345
                return supertest(app)
                    .delete(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Location doesn't exist` } })
            })
        })

        context(`Given there are locations in the database`, () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations
                )
            )

            it(`responds with 204 and removes the location`, () => {
                const location_id = 1
                const expectedLocations = testLocations.filter(location => location.id !== location_id)
                // console.log(expectedLocations)
                return supertest(app)
                    .delete(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/locations`)
                            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                            .expect(expectedLocations)
                    )
            })
        })
    })

    describe(`DELETE /api/locations/:location_id/problems/:problem_id`, () => {
        context(`Given no problems`, () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations
                )
            )

            it(`responds with 404 when problem doesn't exist`, () => {
                const location_id = 1
                const problem_id = 12345
                return supertest(app)
                    .delete(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Problem doesn't exist` } })
            })
        })

        context(`Given there are problems in the database`, () => {
            beforeEach('insert problems', () =>
                helpers.seedDbTables(
                    db,
                    testUsers,
                    testLocations,
                    testProblems
                )
            )

            it(`responds with 204 and removes the problem`, () => {
                const location_id = 2
                const problem_id = 1
                const expectedProblems = testProblems.filter(problem => problem.id !== problem_id)
                // console.log(expectedProblems)
                return supertest(app)
                    .delete(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(204)
                // .then(res =>
                //     supertest(app)
                //         .get(`/api/locations/${location_id}/problems`)
                //         .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                //         .expect(expectedProblems)
                // )
            })
        })
    })

    describe(`PATCH /api/locations/:location_id`, () => {
        context(`Given no locations`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )

            it(`responds with 404 when location doesn't exist`, () => {
                const location_id = 12345
                return supertest(app)
                    .patch(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Location doesn't exist` } })
            })
        })

        context(`Given there are locations in the database`, () => {
            beforeEach('insert locations', () =>
                helpers.seedLocationsTable(
                    db,
                    testUsers,
                    testLocations
                )
            )

            it(`responds with 204 and updates the location`, () => {
                const location_id = 2
                const updateLocation = {
                    location_name: 'Updated location name'
                }
                const expectedLocation = {
                    ...testLocations[location_id - 1],
                    ...updateLocation
                }
                return supertest(app)
                    .patch(`/api/locations/${location_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .send(updateLocation)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/locations/${location_id}`)
                            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                            .expect(expectedLocation)
                    )
            })
        })
    })

    describe(`PATCH /api/locations/:location_id/problems/:problem_id`, () => {
        context(`Given no problems`, () => {
            beforeEach('insert locations', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                    testLocations
                )
            )

            it(`responds with 404 when problem doesn't exist`, () => {
                const location_id = 12345
                const problem_id = 12345
                return supertest(app)
                    .patch(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .expect(404, { error: { message: `Problem doesn't exist` } })
            })
        })

        context(`Given there are problems in the database`, () => {
            beforeEach('insert problems', () =>
                helpers.seedDbTables(
                    db,
                    testUsers,
                    testLocations,
                    testProblems
                )
            )

            it(`responds with 204 and updates the problem`, () => {
                const location_id = 2
                const problem_id = 1
                const updateProblem = {
                    problem_name: 'Updated problem name',
                    grade: 'V10',
                    area: 'No area',
                    notes: 'Fun one',
                    sent: true
                }
                const expectedProblem = {
                    ...testProblems[problem_id - 1],
                    ...updateProblem
                }
                return supertest(app)
                    .patch(`/api/locations/${location_id}/problems/${problem_id}`)
                    .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                    .send(updateProblem)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/locations/${location_id}/problems/${problem_id}`)
                            .set('Authorization', helpers.makeAuthHeader(testUsers[0]))
                            .expect(expectedProblem)
                    )
            })
        })
    })
})