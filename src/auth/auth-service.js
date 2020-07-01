const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const xss = require('xss')

const AuthService = {
    getUserWithUsername(db, username) {
        return db('users')
            .where({ username })
            .first()
    },
    hasUserWithUsernameOrEmail(db, username, email) {
        return db('users')
            .where({ username })
            .orWhere({ email })
            .first()
            .then((user) => !!user)
    },
    insertUser(db, newUser) {
        return db
            .insert(newUser)
            .into('users')
            .returning("*")
            .then(([user]) => user);
    },
    comparePasswords(password, hash) {
        return bcrypt.compare(password, hash)
    },
    createJwt(subject, payload) {
        return jwt.sign(payload, config.JWT_SECRET, {
            subject,
            expiresIn: config.JWT_EXPIRY,
            algorithm: 'HS256',
        })
    },
    verifyJwt(token) {
        return jwt.verify(token, config.JWT_SECRET, {
            algorithms: ['HS256'],
        })
    },
    parseBasicToken(token) {
        return Buffer
            .from(token, 'base64')
            .toString()
            .split(':')
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12);
    },
    serializeUser(user) {
        return {
            id: user.id,
            email: xss(user.email),
            username: xss(user.username),
        }
    }
}

module.exports = AuthService