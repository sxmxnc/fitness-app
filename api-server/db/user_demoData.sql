/**
* Autor: Luca Lammers

*/

-- Creates the db-entrys for user, their stats/goals and Sessions
-- Passwords are bcrypt hashes of "DemoSecure123!". --> somewhere found
-- securityAnswerHash values are bcrypt hashes of the normalized (NFC, trim, lowercase) answers noted per user.

INSERT INTO users ("id","email", "createdAt", "firstName", "lastName", "role", "password", "securityQuestionKey", "securityAnswerHash", "isDeactivated") VALUES
  ('ceda8624-e813-459a-899d-0c57e37e0417','example1@example.test', 1700000000000, 'Alice', 'Müller',  'admin', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'first_pet', '$2b$12$Jf0979TRUZWRrDQsGfftAOxMoMzeYRTG9pPpzNcFB02eAJt5Qqmte', FALSE), -- admin Acc; answer: Bello
  ('5a1bafbd-8901-48c6-910a-33d1b6918176','example2@example.test', 1700000001000, 'Bob',   'Schmidt', 'user',  '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'birth_city', '$2b$12$ncSHSTNU.N121EUZNJcqau6HoCFiliRqsSY8lGujR6bpWaP9NbKw2', FALSE), -- answer: Berlin
  ('241ec06f-c075-4da0-9e43-7ace6c837875','example3@example.test', 1700000002000, 'Clara', 'Weber',   'user',  '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'mother_maiden_name', '$2b$12$CCR3Ai9KljCX7F9uYJc40u88ar6fs2q4bgF1.Klwoty5XltxSklYS', FALSE), -- answer: Hoffmann
  -- Inactive users
  ('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c','inactive1@example.test', 1705276800000, 'David',  'Bauer',   'user', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'first_school', '$2b$12$m4F20Rgb0fGNRr7MxZQ5aOSCYfhxT/nEwIarW5jqa2BC/HNVQTtUa', FALSE), -- answer: Grundschule Nord
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d','inactive2@example.test', 1707523200000, 'Emma',   'Fischer', 'user', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'favorite_school_subject', '$2b$12$f2Jy4xbJUf.1LI/wvMgtdeGGX0SSbGuWRVgpYX3.65N19g72tzJCS', FALSE), -- answer: Mathematik
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e','inactive3@example.test', 1709596800000, 'Felix',  'Wagner',  'user', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'first_pet', '$2b$12$gohdt24rykuNKZRgff58GOW4Ju7ZM809BFEqyACPfPSEPAK7XJs6a', FALSE), -- answer: Minka
  -- Deactivated user
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6d','deactivated@example.test', 1709596800000, 'Timo',  'Schmidt',  'user', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', 'birth_city', '$2b$12$PYP8bcMn88YNJAWPnQgoX.vuGj0EDEI4XUAZqJWygKret..6CViv2', TRUE), -- answer: Hamburg
  -- Legacy account WITHOUT a security question (predates the feature). Test fixture for the
  -- "no security question set up" 404 path of POST /api/auth/request-password-reset.
  ('c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f','legacy@example.test', 1709600000000, 'Lena',  'Krüger',  'user', '$2b$12$II/S8BaVlQ4H9H/HkGk56u9/QmH2M8D13BJP9YLTyqg2tXcCvUJn6', NULL, NULL, FALSE);

INSERT INTO user_stats ("id", "createdAt", "userId", "weight", "height", "birthDate", "dailyCalorieGoal", "dailyProteinGoal", "dailyFatGoal", "dailyCarbsGoal") VALUES
  ('2afbb76b-4b34-4c02-8a95-fcd90d5457de', 1700000010000, 'ceda8624-e813-459a-899d-0c57e37e0417', 68, 170, 797817600000, 2000, 120, 65, 220),
  ('52d7315f-e054-4432-93ea-81271f41e7c7', 1700000011000, '5a1bafbd-8901-48c6-910a-33d1b6918176', 85, 182, 651369600000, 2500, 160, 80, 280),
  ('c0740602-e782-4f84-a3dc-9275efebb9b2', 1700000012000, '241ec06f-c075-4da0-9e43-7ace6c837875', 60, 165, 949190400000, 1800, 100, 55, 200),
  ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 1705276810000, 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 78, 178, 883612800000, 2200, 140, 70, 240),
  ('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', 1707523210000, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 62, 168, 946684800000, 1900, 110, 60, 210),
  ('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', 1709596810000, 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 90, 185, 757382400000, 2800, 175, 90, 300);
