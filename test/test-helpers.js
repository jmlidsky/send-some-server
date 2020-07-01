const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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
    [
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
        user_id: {
            id: user.id,
            email: user.email,
            username: user.username,
            password: user.password
        }
    }
}

function makeExpectedProblem(users, locations, problem) {
    const user = users.find(user => user.id === problem.user_id)
    const location = locations.find(location => location.id === problem.location_id)

    return {
        id: problem.id,
        problem_name: problem.problem_name,
        grade: problem.grade,
        area: problem.area,
        notes: problem.notes,
        sent: problem.sent,
        user_id: {
            id: user.id,
            email: user.email,
            username: user.username,
            password: user.password
        },
        location_id: {
            id: location.id,
            location_name: location.location_name,
            user_id: {
                id: user.id,
                email: user.email,
                username: user.username,
                password: user.password
            },
        }
    }
}

function makeFixtures() {
    const testUsers = makeUsersArray()
    const testLocations = makeLocationsArray(testUsers)
    const testProblems = makeProblemsArray(testUsers, testLocations)
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

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.username,
      algorithm: 'HS256',
    })
    return `Bearer ${token}`
  }

module.exports = {
            makeUsersArray,
            makeLocationsArray,
            makeProblemsArray,
            makeExpectedLocation,
            makeExpectedProblem,

            makeFixtures,
            cleanTables,
            seedDbTables,
            // seedUsers,
            // seedLocationsTable,
            // seedProblemsTable,
            makeAuthHeader
        }