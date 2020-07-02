const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../src/config')

function makeUsersArray() {
    return [
        {
            id: 1,
            email: "test@test.com",
            username: "test",
            password: "testpassword"
        }
    ]
}

function makeLocationsArray(users) {
    return [
        {
            id: 1,
            user_id: users[0].id,
            location_name: "First Location"
        },
        {
            id: 2,
            user_id: users[0].id,
            location_name: "Second Location"
        }
    ]
}

function makeProblemsArray(users, locations) {
    return [
        {
            id: 1,
            location_id: locations[1].id,
            user_id: users[0].id,
            problem_name: "First Problem",
            grade: "V4",
            area: "First Area",
            notes: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            sent: false
        },
        {
            id: 2,
            location_id: locations[1].id,
            user_id: users[0].id,
            problem_name: "Second Problem",
            grade: "V4",
            area: "Second Area",
            notes: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            sent: false
        },
        {
            id: 3,
            location_id: locations[1].id,
            user_id: users[0].id,
            problem_name: "Third Problem",
            grade: "V3",
            area: "Third Area",
            notes: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            sent: true
        },
        {
            id: 4,
            location_id: locations[0].id,
            user_id: users[0].id,
            problem_name: "Fourth Problem",
            grade: "V2",
            area: "",
            notes: "",
            sent: true
        },
        {
            id: 5,
            location_id: locations[0].id,
            user_id: users[0].id,
            problem_name: "Fifth Problem",
            grade: "V3",
            area: "",
            notes: "Lorem ipsum dolor sit amet, consectetur adipisicing elit.",
            sent: true
        }
    ]
}

function makeExpectedLocation(users, location) {
    const user = users.find(user => user.id === location.user_id)

    return {
        id: location.id,
        location_name: location.location_name,
        user_id: user.id
    }
}

function makeExpectedProblems(users, locations, location_id, problems) {
    const expectedProblems = problems.filter(problem => problem.location_id === location_id)

    return expectedProblems.map(problem => {
        const problemUser = users.find(user => user.id === problem.user_id)
        const problemLocation = locations.find(location => location.id === problem.location_id)
        return {
            id: problem.id,
            location_id: problemLocation.id,
            user_id: problemUser.id,
            problem_name: problem.problem_name,
            grade: problem.grade,
            area: problem.area,
            notes: problem.notes,
            sent: problem.sent
        }
    })
}

function makeFixtures() {
    const testUsers = makeUsersArray()
    const testLocations = makeLocationsArray(testUsers)
    const testProblems = makeProblemsArray(testUsers, testLocations)
    // console.log(testUsers, testLocations, testProblems)
    return { testUsers, testLocations, testProblems }
}

function cleanTables(db) {
    return db.raw(
        `TRUNCATE
        users,
        locations,
        problems
        RESTART IDENTITY CASCADE`
    )
}

function seedDbTables(db, users, locations, problems) {
    return db.transaction(async trx => {
        await trx.into('users').insert(users)
        await trx.raw(
            `SELECT setval('users_id_seq', ?)`,
            [users[users.length - 1].id]
        )

        await trx.into('locations').insert(locations)
        await trx.raw(
            `SELECT setval('locations_id_seq', ?)`,
            [locations[locations.length - 1].id]
        )

        await trx.into('problems').insert(problems)
        await trx.raw(
            `SELECT setval('problems_id_seq', ?)`,
            [problems[problems.length - 1].id]
        )
    })
}

function seedUsers(db, users) {
    const preppedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }))
    return db.into('users').insert(preppedUsers)
        .then(() =>
            // update the auto sequence to stay in sync
            db.raw(
                `SELECT setval('users_id_seq', ?)`,
                [users[users.length - 1].id],
            )
        )
}

function seedLocationsTable(db, users, locations) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async trx => {
        await seedUsers(trx, users)
        await trx.into('locations').insert(locations)
        // update the auto sequence to match the forced id values
        await trx.raw(
            `SELECT setval('locations_id_seq', ?)`,
            [locations[locations.length - 1].id],
        )
    })
}

function makeAuthHeader(user, secret = config.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
        subject: user.username,
        expiresIn: config.JWT_EXPIRY,
        algorithm: 'HS256',
    })
    return `Bearer ${token}`
}

module.exports = {
    makeUsersArray,
    makeLocationsArray,
    makeProblemsArray,
    seedLocationsTable,
    makeExpectedLocation,
    makeExpectedProblems,
    makeFixtures,
    cleanTables,
    seedDbTables,
    seedUsers,
    makeAuthHeader
}