const express = require('express')
const AuthService = require('./auth-service')

const authRouter = express.Router()
const jsonBodyParser = express.json()

authRouter
    .post('/signup', jsonBodyParser, (req, res, next) => {
        const { email, username, password } = req.body
        // console.log(req.body)

        for (const field of ['email', 'username', 'password'])
            if (!req.body[field])
                return res.status(400).json({
                    error: `Missing '${field}' in request body`,
                });

        AuthService.hasUserWithUsernameOrEmail(req.app.get('db'), username, email)
            .then((hasUserWithUsernameOrEmail) => {
                if (hasUserWithUsernameOrEmail)
                    return res.status(400).json({ error: `Username or email already taken` });

                return AuthService.hashPassword(password).then((hashedPassword) => {
                    const newUser = {
                        username,
                        password: hashedPassword,
                        email,
                    };

                    return AuthService.insertUser(req.app.get('db'), newUser).then(
                        (user) => {
                            const sub = user.username
                            const payload = { user_id: user.id }
                            res.status(201).send({
                                authToken: AuthService.createJwt(sub, payload),
                            })
                        }
                    )
                })
            })
            .catch(next);
    })

authRouter
    .post('/login', jsonBodyParser, (req, res, next) => {
        const { username, password } = req.body
        const loginUser = { username, password }

        // console.log(loginUser)

        for (const [key, value] of Object.entries(loginUser))
            if (value == null)
                return res.status(400).json({
                    error: `Missing '${key}' in request body`
                })

        AuthService.getUserWithUsername(
            req.app.get('db'),
            loginUser.username
        )
            .then(dbUser => {
                if (!dbUser)
                    return res.status(400).json({
                        error: 'Incorrect username or password',
                    })

                return AuthService.comparePasswords(loginUser.password, dbUser.password)
                    .then(compareMatch => {
                        if (!compareMatch)
                            return res.status(400).json({
                                error: 'Incorrect username or password',
                            })

                        const sub = dbUser.username
                        const payload = { user_id: dbUser.id }
                        res.send({
                            authToken: AuthService.createJwt(sub, payload),
                        })
                    })
            })
            .catch(next)
    })


module.exports = authRouter