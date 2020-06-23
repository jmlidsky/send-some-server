BEGIN;

TRUNCATE
    users,
    locations,
    problems
    RESTART IDENTITY CASCADE;

INSERT INTO users (email, username, password)
VALUES
('demo@gmail.com', 'demo', 'demo');

INSERT INTO locations (user_id, location_name)
VALUES
(1, 'The New'),
(1, 'Catoctin');

INSERT INTO problems (location_id, problem_name, grade, area, notes, sent)
VALUES
(2, 'Belly Up', 'V4', 'Jonah Boulder', 'knee scum', 
false),
(2, 'Dish Right', 'V4', 'Jonah Boulder', 'skip first few crimps to good crimp?', false),
(2, 'The Pigman', 'V3', 'Hog Rock', 'find feet ahead of time',true),
(1, 'Doctor', 'V2', '', '', true),
(1, 'I Love Luci', 'V3', '', 'push through feet for big right hand move', true);

COMMIT;