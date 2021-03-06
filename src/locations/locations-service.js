const LocationsService = {
    // locations
    getAllLocationsByUserId(knex, user_id) {
        return knex
            .select('*')
            .from('locations')
            .where('user_id', user_id)
            .orderBy('location_name')
    },
    getById(knex, user_id, id) {
        return knex
            .select('*')
            .from('locations')
            .where('user_id', user_id)
            .where('id', id)
            .first()
    },
    insertLocation(knex, user_id, newLocation) {
        return knex
            .insert(newLocation)
            .into('locations')
            .where('user_id', user_id)
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteLocation(knex, id) {
        return knex('locations')
            .where({ id })
            .delete()
    },
    updateLocation(knex, user_id, id, newLocationFields) {
        return knex('locations')
            .where('user_id', user_id)
            .where({ id })
            .update(newLocationFields)
    },
    // problems
    getAllProblemsByLocationAndUserId(knex, location_id, user_id) {
        return knex
            .select('*')
            .from('problems')
            .where('location_id', location_id)
            .where('user_id', user_id)
            .orderBy('problem_name')
    },
    getProblemById(knex, user_id, id) {
        return knex
        .select('*')
        .from('problems')
        .where('user_id', user_id)
        .where('id', id)
        .first()
    },
    insertProblem(knex, newProblem) {
        return knex
            .insert(newProblem)
            .into('problems')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteProblem(knex, id) {
        return knex('problems')
            .where({ id })
            .delete()
    },
    updateProblem(knex, id, newProblemFields) {
        return knex('problems')
            .where({ id })
            .update(newProblemFields)
    },
}

module.exports = LocationsService