BEGIN;

TRUNCATE
    users,
    locations,
    problems
    RESTART IDENTITY CASCADE;

INSERT INTO users (email, username, password)
VALUES
('demo@gmail.com', 'demo', '$2a$12$AhvvRcrQlStNPbOJM/.JuO6fOcoN0N1hMGoNpODQHLf54kx7Ddvta');

INSERT INTO locations (user_id, location_name)
VALUES
(1, 'The New'),
(1, 'Catoctin');

INSERT INTO problems (location_id, user_id, problem_name, grade, area, notes, sent)
VALUES
(2, 1, 'Belly Up', 'V4', 'Jonah Boulder', 'knee scum', 
false),
(2, 1, 'Dish Right', 'V4', 'Jonah Boulder', 'skip first few crimps to good crimp?', false),
(2, 1, 'The Pigman', 'V3', 'Hog Rock', 'find feet ahead of time',true),
(1, 1, 'Doctor', 'V2', '', '', true),
(1, 1,'Friends of Coal', 'V2', 'Meadow Top', 'sharp holds, heel hooks work well', true);

COMMIT;