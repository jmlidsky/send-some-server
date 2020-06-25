const path = require('path')
const express = require('express')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const ProblemsService = require('./problems-service.js')

const problemsRouter = express.Router()
const bodyParser = express.json()

const serializeProblem = problem => ({
    id: problem.id,
    location_id: problem.location_id,
    problem_name: xss(problem.problem_name),
    grade: xss(problem.grade),
    area: xss(problem.area),
    notes: xss(problem.notes),
    sent: problem.sent,
})

problemsRouter
    .route('/')
    .post(requireAuth, (req, res, next) => {
        console.log(req.body, req.params)
        ProblemsService.getAllProblemsByLocationAndUserId(
            req.app.get('db'), req.params.location_id, req.body.user_id
        )
            .then(problems => {
                res.json(problems.map(serializeProblem))
            })
            .catch(next);
    })

    .post(bodyParser, requireAuth, (req, res, next) => {
        console.log(req.body)
        const { location_id, problem_name, grade, area, notes, sent } = req.body;
        console.log('found user id', req.user.id)
        const newProblem = {
            location_id: location_id,
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

        ProblemsService.insertProblem(
            req.app.get('db'), req.user.id,
            newProblem
        )
            .then(problem => {
                res.status(201)
                    .location(path.posix.join(req.originalUrl, `/${problem.id}`))
                    .json(serializeProblem(problem))
            })
            .catch(next)
    })

problemsRouter
    .route('/:id')
    .all(requireAuth, (req, res, next) => {
        const { id } = req.params
        ProblemsService.getById(
            req.app.get('db'), req.user.id,
            id
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
        const { id } = req.params;
        ProblemsService.deleteProblem(
            req.app.get('db'), req.user.id,
            id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, requireAuth, (req, res, next) => {
        const { problem_name, grade, area, notes, sent } = req.body
        const problemToUpdate = { problem_name, grade, area, notes, sent }
        const { id } = req.params

        const numberOfValues = Object.values(problemToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'problem_name', 'grade', 'area', 'notes', 'sent'.`
                }
            })
        }

        ProblemsService.updateProblem(
            req.app.get('db'), req.user.id,
            id,
            problemToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = problemsRouter