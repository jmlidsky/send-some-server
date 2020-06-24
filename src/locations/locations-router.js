const path = require('path')
const express = require('express')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const LocationsService = require('./locations-service.js')

const locationsRouter = express.Router()
const bodyParser = express.json()

const serializeLocation = location => ({
    id: location.id,
    user_id: location.user_id,
    location_name: xss(location.location_name),
})

locationsRouter
    .route('/')
    .get(requireAuth, (req, res, next) => {
        LocationsService.getAllLocationsByUserId(
            req.app.get('db'), req.user.id
        )
            .then(locations => {
                res.json(locations.map(serializeLocation))
            })
            .catch(next);
    })

    .post(bodyParser, requireAuth, (req, res, next) => {
        console.log(req.body)
        const { location_name } = req.body;
        console.log('found user id', req.user.id)
        const newLocation = {
            user_id: req.user.id,
            location_name,
        }

        for (const [key, value] of Object.entries(newLocation)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        LocationsService.insertLocation(
            req.app.get('db'), req.user.id,
            newLocation
        )
            .then(location => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${location.id}`))
                    .json(serializeLocation(location))
            })
            .catch(next)
    })

locationsRouter
    .route('/:id')
    .all(requireAuth, (req, res, next) => {
        const { id } = req.params
        LocationsService.getById(
            req.app.get('db'), req.user.id,
            id
        )
            .then(location => {
                if (!location) {
                    return res.status(404).json({
                        error: { message: `Location doesn't exist` }
                    })
                }
                res.location = location // save the location for the next middleware
                next() // don't forget to call next so the next middleware happens!
            })
            .catch(next)
    })
    .get(requireAuth, (req, res, next) => {
        res.json(serializeLocation(res.location))
    })
    .delete(requireAuth, (req, res, next) => {
        const { id } = req.params;
        LocationsService.deleteLocation(
            req.app.get('db'), req.user.id,
            id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, requireAuth, (req, res, next) => {
        const { location_name } = req.body
        const locationToUpdate = { location_name }
        const { id } = req.params

        const numberOfValues = Object.values(locationToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'location_name'.`
                }
            })
        }

        LocationsService.updateLocation(
            req.app.get('db'), req.user.id,
            id,
            locationToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = locationsRouter