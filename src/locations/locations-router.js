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

const serializeProblem = problem => ({
    id: problem.id,
    location_id: problem.location_id,
    user_id: problem.user_id,
    problem_name: xss(problem.problem_name),
    grade: xss(problem.grade),
    area: xss(problem.area),
    notes: xss(problem.notes),
    sent: problem.sent,
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
    .route('/:location_id')
    .all(requireAuth, (req, res, next) => {
        const { location_id } = req.params
        LocationsService.getById(
            req.app.get('db'), req.user.id,
            location_id
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
        const { location_id } = req.params;
        LocationsService.deleteLocation(
            req.app.get('db'),
            location_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, requireAuth, (req, res, next) => {
        const { location_name } = req.body
        const locationToUpdate = { location_name }
        const { location_id } = req.params

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
            location_id,
            locationToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

locationsRouter
    .route('/:location_id/problems')
    .get(requireAuth, (req, res, next) => {
        console.log(req.params.location_id, req.user.id)
        LocationsService.getAllProblemsByLocationAndUserId(
            req.app.get('db'), req.params.location_id, req.user.id
        )
            .then(problems => {
                res.json(problems.map(serializeProblem))
            })
            .catch(next);
    })

    .post(bodyParser, requireAuth, (req, res, next) => {
        console.log(req.body)
        const location_id = req.params.location_id
        const user_id = req.user.id
        const { problem_name, grade, area, notes, sent } = req.body;
        console.log('found user id', req.user.id)
        const newProblem = {
            location_id: location_id,
            user_id: user_id,
            problem_name,
            grade,
            area,
            notes,
            sent
        }

        for (const [key, value] of Object.entries(newProblem)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        LocationsService.insertProblem(
            req.app.get('db'),
            newProblem
        )
            .then(problem => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${problem.id}`))
                    .json(serializeProblem(problem))
            })
            .catch(next)
    })


locationsRouter
    .route('/:location_id/problems/:problem_id')
    .all(requireAuth, (req, res, next) => {
        const { problem_id } = req.params
        LocationsService.getProblemById(
            req.app.get('db'), req.user.id,
            problem_id
        )
            .then(problem => {
                if (!problem) {
                    return res.status(404).json({
                        error: { message: `Problem doesn't exist` }
                    })
                }
                res.problem = problem // save the problem for the next middleware
                next() // don't forget to call next so the next middleware happens!
            })
            .catch(next)
    })
    .get(requireAuth, (req, res, next) => {
        res.json(serializeProblem(res.problem))
    })
    .delete(requireAuth, (req, res, next) => {
        const { problem_id } = req.params;
        LocationsService.deleteProblem(
            req.app.get('db'),
            problem_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, requireAuth, (req, res, next) => {
        const { problem_name, grade, area, notes, sent } = req.body
        const problemToUpdate = { problem_name, grade, area, notes, sent }
        const { problem_id } = req.params

        const numberOfValues = Object.values(problemToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'problem_name', 'grade', 'area', 'notes', 'sent'.`
                }
            })
        }

        LocationsService.updateProblem(
            req.app.get('db'), problem_id,
            problemToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })
module.exports = locationsRouter