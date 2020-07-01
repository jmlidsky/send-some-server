const knex = require('knex')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const helpers = require('./test-helpers')
const config = require('../src/config')

describe('Auth Endpoints', function () {
    let db

    const { testUsers } = helpers.makeFixtures()
    const testUser = testUsers[0]

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

    describe(`POST /api/auth/login`, () => {
        beforeEach('insert users', () =>
            helpers.seedUsers(
                db,
                testUsers,
            )
        )

        const requiredFields = ['username', 'password']

        requiredFields.forEach(field => {
            const loginAttemptBody = {
                username: testUser.username,
                password: testUser.password,
            }

            it(`responds with 400 required error when '${field}' is missing`, () => {
                delete loginAttemptBody[field]

                return supertest(app)
                    .post('/api/auth/login')
                    .send(loginAttemptBody)
                    .expect(400, {
                        error: `Missing '${field}' in request body`,
                    })
            })
        })

        it(`responds 400 'invalid username or password' when bad username`, () => {
            const userInvalidUser = { username: 'user-not', password: 'existy' }
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidUser)
                .expect(400, { error: `Incorrect username or password` })
        })

        it(`responds 400 'invalid username or password' when bad password`, () => {
            const userInvalidPass = { username: testUser.username, password: 'incorrect' }
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidPass)
                .expect(400, { error: `Incorrect username or password` })
        })

        it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
            const userValidCreds = {
                username: testUser.username,
                password: testUser.password,
            }
            // console.log(userValidCreds)
            const expectedToken = jwt.sign(
                { user_id: testUser.id }, config.JWT_SECRET,
                {
                    subject: testUser.username,
                    expiresIn: config.JWT_EXPIRY,
                    algorithm: 'HS256',
                }
            )
            // console.log(expectedToken)
            return supertest(app)
                .post('/api/auth/login')
                .send(userValidCreds)
                .expect(200, {
                    authToken: expectedToken,
                })
        })
    })

    describe(`POST /api/auth/signup`, () => {
        context(`New user validation`, () => {
            beforeEach('insert users', () =>
                helpers.seedUsers(
                    db,
                    testUsers,
                )
            )

            const requiredFields = ['email', 'username', 'password']

            requiredFields.forEach(field => {
                const registerAttemptBody = {
                    email: 'test email',
                    username: 'test username',
                    password: 'test password',
                }

                it(`responds with 400 required error when '${field}' is missing`, () => {
                    delete registerAttemptBody[field]

                    return supertest(app)
                        .post('/api/auth/signup')
                        .send(registerAttemptBody)
                        .expect(400, {
                            error: `Missing '${field}' in request body`,
                        })
                })
            })

            it(`responds 400 'Username already taken' when username isn't unique`, () => {
                const duplicateUser = {
                    email: 'test email',
                    username: testUser.username,
                    password: '11AAaa!!',
                }
                return supertest(app)
                    .post('/api/auth/signup')
                    .send(duplicateUser)
                    .expect(400, { error: `Username already taken` })
            })
        })

        context(`Happy path`, () => {
            it(`responds 201, serialized user, storing bcrypted password`, () => {
                const newUser = {
                    email: 'test email',
                    username: 'test username',
                    password: '11AAaa!!',
                }
                return supertest(app)
                    .post('/api/auth/signup')
                    .send(newUser)
                    .expect(201)
                    .expect(res => {
                        expect(res.body).to.have.property('id')
                        expect(res.body.email).to.eql(newUser.email)
                        expect(res.body.username).to.eql(newUser.username)
                        expect(res.body).to.not.have.property('password')
                    })
                    .expect(res =>
                        db
                            .from('users')
                            .select('*')
                            .where({ id: res.body.id })
                            .first()
                            .then(row => {
                                expect(row.email).to.eql(newUser.email)
                                expect(row.username).to.eql(newUser.username)

                                return bcrypt.compare(newUser.password, row.password)
                            })
                            .then(compareMatch => {
                                expect(compareMatch).to.be.true
                            })
                    )
            })
        })
    })
})