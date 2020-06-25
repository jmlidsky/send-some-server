const ProblemsService = {
    getAllProblemsByLocationId(knex, location_id) {
        return knex
            .select('*')
            .from('problems')
            .where('location_id', location_id)
    },
    getById(knex, location_id, id) {
        return knex
            .select('*')
            .from('problems')
            .where('location_id', location_id)
            .where('id', id)
            .first()
    },
    insertProblem(knex, location_id, newProblem) {
        return knex
            .insert(newProblem)
            .into('problems')
            .where('location_id', location_id)
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteProblem(knex, location_id, id) {
        return knex('problems')
            .where('location_id', location_id)
            .where({ id })
            .delete()
    },
    updateProblem(knex, location_id, id, newProblemFields) {
        return knex('problems')
            .where('location_id', location_id)
            .where({ id })
            .update(newProblemFields)
    },
}

module.exports = ProblemsService