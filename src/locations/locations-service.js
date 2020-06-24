const LocationsService = {
    getAllLocationsByUserId(knex, user_id) {
        return knex
            .select('*')
            .from('locations')
            .where('user_id', user_id)
            .first()
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
    // not implemented
    deleteLocation(knex, user_id, id) {
        return knex('locations')
            .where('user_id', user_id)
            .where({ id })
            .delete()
    },
    // not implemented
    updateLocation(knex, user_id, id, newLocationFields) {
        return knex('locations')
            .where('user_id', user_id)
            .where({ id })
            .update(newLocationFields)
    },
}

module.exports = LocationsService