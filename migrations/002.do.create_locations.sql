CREATE TABLE locations (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    user_id INTEGER 
        REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    location_name TEXT NOT NULL
);