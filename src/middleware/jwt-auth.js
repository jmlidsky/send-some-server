const AuthService = require('../auth/auth-service')

function requireAuth(req, res, next) {
    console.log('using jwt auth')
    const authToken = req.get('Authorization') || ''

    let bearerToken
    if (!authToken.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({ error: 'Missing bearer token' })
    } else {
        bearerToken = authToken.slice(7, authToken.length)
    }
    console.log(bearerToken)

    try {
        const payload = AuthService.verifyJwt(bearerToken)

        AuthService.getUserWithUsername(
            req.app.get('db'),
            payload.sub,
        )
            .then(user => {
                if (!user) {
                    console.log('do not have a user')
                    return res.status(401).json({ error: 'Unauthorized request' })
                }
                console.log('verified jwt and have found user:', user)
                req.user = user
                next()
            })
            .catch(err => {
                console.error(err)
                next(err)
            })
    } catch (error) {
        console.log(error)
        res.status(401).json({ error: 'Unauthorized request' })
    }
}

module.exports = {
    requireAuth,
}