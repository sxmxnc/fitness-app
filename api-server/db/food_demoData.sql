/**
 * Autor: Simon Josef Cebula

 */

-- Creates the db-entries for foods, meal-entries and meal-entry-foods
-- demo data created by ai

-- =====================
-- SYSTEM FOODS (userId = NULL, isSystemProperty = TRUE)
-- Nährwerte pro 100g
-- =====================
INSERT INTO foods ("id", "userId", "name", "caloriesPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", "isSystemProperty", "isDeleted") VALUES
-- Proteinquellen
('70d99d57-9637-4104-bb5f-a56fcda9b1d1', NULL, 'Hähnchenbrust',   165, 31,  4,  0,  TRUE, FALSE),
('88b5124d-dc05-4d46-b82f-bb65beeb594a', NULL, 'Lachs',           208, 20, 13,  0,  TRUE, FALSE),
('9cd5fed6-aa8d-4608-9c2e-74274fffb531', NULL, 'Thunfisch (Dose)',  144, 30,  1,  0,  TRUE, FALSE),
('f64dbf20-6199-43ef-b4d4-ddbcc7af8e50', NULL, 'Ei',              155, 13, 11,  1,  TRUE, FALSE),
('e9e4924e-555b-4928-a682-7f6d4a6c9ca0', NULL, 'Griechischer Joghurt', 59, 10,  0,  4,  TRUE, FALSE),
('6763c476-9781-420c-aa33-361678641370', NULL, 'Hüttenkäse',       98, 11,  4,  3,  TRUE, FALSE),
-- Kohlenhydrate
('8cba5383-3ede-4ad3-93cb-f7b36ccbc216', NULL, 'Vollkornreis',    112,  2,  1, 24,  TRUE, FALSE),
('d98122d1-5663-4a92-907b-c6a540e7b94f', NULL, 'Haferflocken',    389, 17,  7, 66,  TRUE, FALSE),
('78009d75-abe5-4e7f-9955-ccf62c9fa101', NULL, 'Nudeln (gekocht)', 131,  5,  1, 25,  TRUE, FALSE),
('f2fe9623-bd45-4b8e-a813-3c0928150fe9', NULL, 'Weißbrot',        265,  9,  3, 49,  TRUE, FALSE),
('8196ad2f-7c6d-449e-9548-3fe63640139a', NULL, 'Süßkartoffel',     86,  2,  0, 20,  TRUE, FALSE),
('35c03dd5-e143-4bbe-bcb3-24f2e53b614a', NULL, 'Banane',           89,  1,  0, 23,  TRUE, FALSE),
-- Gemüse
('c4be178b-e6c5-4e62-8e2b-929201868f8d', NULL, 'Brokkoli',         34,  3,  0,  7,  TRUE, FALSE),
('5234cd54-4ec0-43dd-b84a-3328ef3536d9', NULL, 'Spinat',           23,  3,  0,  4,  TRUE, FALSE),
('2fadd54c-fb06-4e27-8a18-51724649c47d', NULL, 'Apfel',            52,  0,  0, 14,  TRUE, FALSE),
-- Fette / Sonstiges
('daf5e856-78da-4068-b3cb-c429c419f276', NULL, 'Mandeln',         579, 21, 50, 22,  TRUE, FALSE),
('668f0a2c-8390-4333-902d-a37b6b2c28c5', NULL, 'Olivenöl',        884,  0,100,  0,  TRUE, FALSE),
('0890b512-36de-40c4-a566-19e2dfa28497', NULL, 'Vollmilch',        61,  3,  3,  5,  TRUE, FALSE);


-- =====================
-- USER-SPECIFIC FOODS
-- =====================
INSERT INTO foods ("id", "userId", "name", "caloriesPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", "isSystemProperty", "isDeleted") VALUES
-- Alice
('628ed309-958f-4585-94b2-a0296b88e2c4', 'ceda8624-e813-459a-899d-0c57e37e0417', 'Proteinshake (Alice)',   120, 24, 2,  5, FALSE, FALSE),
-- Bob
('384e7e27-e6b8-48bd-8f0d-88372488188a', '5a1bafbd-8901-48c6-910a-33d1b6918176', 'Erdnussbutter (Bob)',    588, 25,50, 20, FALSE, FALSE),
-- Clara
('d8ff5dc3-5281-47a0-80b7-9df7e4e1c446', '241ec06f-c075-4da0-9e43-7ace6c837875', 'Smoothie-Mix (Clara)',    80,  4, 1, 15, FALSE, FALSE);


-- =====================
-- MEAL ENTRIES
-- entryDate / createdAt als BIGINT (Unix ms)
-- 2024-01-01 = 1704067200000
-- 2024-01-02 = 1704153600000
-- 2024-01-03 = 1704240000000
-- =====================
INSERT INTO meal_entries ("id", "userId", "entryDate", "mealType", "createdAt", "isDeleted") VALUES
-- Alice – Tag 1 (2024-01-01)
('6f3d6713-7007-4511-8b3c-2b8a0448f1d7', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704067200000, 'breakfast', 1704067200000, FALSE),
('5a739688-d96d-4c85-81e8-a4666bef87a1', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704067200000, 'lunch',     1704067200000, FALSE),
('acdd29db-bf13-4549-9e58-15e69190fb4b', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704067200000, 'dinner',    1704067200000, FALSE),
-- Alice – Tag 2 (2024-01-02)
('f245eae9-5f32-4136-86f0-d057878d3db5', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704153600000, 'breakfast', 1704153600000, FALSE),
('e1133a27-e529-437f-93a2-6201e1478b0a', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704153600000, 'lunch',     1704153600000, FALSE),
('d58de306-f4c4-4fd7-875a-a35fe1df0d7a', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704153600000, 'snack',     1704153600000, FALSE),
('ba006cdb-7b26-4bf9-a906-b42d27774868', 'ceda8624-e813-459a-899d-0c57e37e0417', 1704153600000, 'dinner',    1704153600000, FALSE),
-- Bob – Tag 1 (2024-01-01)
('fe018403-4cc2-447d-a41a-f4616b7f088e', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704067200000, 'breakfast', 1704067200000, FALSE),
('ae720dfb-ba3a-4eaa-ae0a-10a2b400ab47', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704067200000, 'lunch',     1704067200000, FALSE),
('a56bd493-4e21-4c3c-9ba9-0a21d4631399', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704067200000, 'dinner',    1704067200000, FALSE),
-- Bob – Tag 2 (2024-01-02)
('0a5188ad-0ad3-48ac-aef1-bbc27be2ea7e', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704153600000, 'breakfast', 1704153600000, FALSE),
('6da188e9-c90e-4df7-b118-d8ebe5b491dd', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704153600000, 'snack',     1704153600000, FALSE),
('edd5c6b7-529b-423a-94bd-b89562c662b8', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704153600000, 'lunch',     1704153600000, FALSE),
('dae458f9-d070-41b9-8049-be639e8aad99', '5a1bafbd-8901-48c6-910a-33d1b6918176', 1704153600000, 'dinner',    1704153600000, FALSE),
-- Clara – Tag 1 (2024-01-01)
('2906d700-9c34-441c-8046-e18f1e992075', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704067200000, 'breakfast', 1704067200000, FALSE),
('fab6f253-03b7-4f53-80b4-cf267fcc4b9c', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704067200000, 'lunch',     1704067200000, FALSE),
('092ff32e-4165-4243-a867-6dd1aa48c862', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704067200000, 'dinner',    1704067200000, FALSE),
-- Clara – Tag 2 (2024-01-02)
('e290775d-dea4-4134-ae0b-5bc3f83a4252', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704153600000, 'breakfast', 1704153600000, FALSE),
('a747378e-7702-435b-81d0-2bec41708a3d', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704153600000, 'lunch',     1704153600000, FALSE),
('8d947267-3ad8-476c-b5e1-d84226774f45', '241ec06f-c075-4da0-9e43-7ace6c837875', 1704153600000, 'snack',     1704153600000, FALSE);


-- =====================
-- MEAL ENTRY FOODS
-- =====================
INSERT INTO meal_entry_foods ("id", "mealEntryId", "foodId", "quantityGrams") VALUES
-- Alice Tag 1 – Frühstück: Haferflocken + Banane + Vollmilch
('e138f3bb-5ce0-41ed-904f-58e9a4d6aced', '6f3d6713-7007-4511-8b3c-2b8a0448f1d7', 'd98122d1-5663-4a92-907b-c6a540e7b94f', 80),
('73ac9b13-dd00-4764-a8be-4ee52ee15c6d', '6f3d6713-7007-4511-8b3c-2b8a0448f1d7', '35c03dd5-e143-4bbe-bcb3-24f2e53b614a', 120),
('2359cc8d-bcdb-4105-bb33-50a659c70027', '6f3d6713-7007-4511-8b3c-2b8a0448f1d7', '0890b512-36de-40c4-a566-19e2dfa28497', 200),
-- Alice Tag 1 – Mittagessen: Hähnchenbrust + Vollkornreis + Brokkoli
('d5d79dba-468a-432c-b46e-9761c3bd83a3', '5a739688-d96d-4c85-81e8-a4666bef87a1', '70d99d57-9637-4104-bb5f-a56fcda9b1d1', 200),
('ef9cdbb3-016a-414b-8271-89ad374c95c5', '5a739688-d96d-4c85-81e8-a4666bef87a1', '8cba5383-3ede-4ad3-93cb-f7b36ccbc216', 150),
('7c688656-c21b-49ad-89b1-44c3f45050c7', '5a739688-d96d-4c85-81e8-a4666bef87a1', 'c4be178b-e6c5-4e62-8e2b-929201868f8d', 100),
-- Alice Tag 1 – Abendessen: Lachs + Süßkartoffel + Spinat
('cf97ffc9-be54-41ba-9224-cf42a0ffd900', 'acdd29db-bf13-4549-9e58-15e69190fb4b', '88b5124d-dc05-4d46-b82f-bb65beeb594a', 180),
('7251510b-d47c-4c3c-ae46-602ee351d860', 'acdd29db-bf13-4549-9e58-15e69190fb4b', '8196ad2f-7c6d-449e-9548-3fe63640139a', 200),
('e01e22ba-abb1-4a0b-a9da-8b4637643cd7', 'acdd29db-bf13-4549-9e58-15e69190fb4b', '5234cd54-4ec0-43dd-b84a-3328ef3536d9', 80),
-- Alice Tag 2 – Frühstück: Griechischer Joghurt + Proteinshake
('12c8c3fb-cf01-4394-8eab-1de22e8ffa6a', 'f245eae9-5f32-4136-86f0-d057878d3db5', 'e9e4924e-555b-4928-a682-7f6d4a6c9ca0', 200),
('9bc932dd-eb59-47a4-8d4c-ddf72a272972', 'f245eae9-5f32-4136-86f0-d057878d3db5', '628ed309-958f-4585-94b2-a0296b88e2c4', 300),
-- Alice Tag 2 – Mittagessen: Thunfisch + Nudeln + Brokkoli
('f876f277-9029-40a5-9f69-156f1e79af09', 'e1133a27-e529-437f-93a2-6201e1478b0a', '9cd5fed6-aa8d-4608-9c2e-74274fffb531', 150),
('adbc677a-a6b4-4688-8db2-c93b626631ad', 'e1133a27-e529-437f-93a2-6201e1478b0a', '78009d75-abe5-4e7f-9955-ccf62c9fa101', 200),
('c32a5280-e472-4ead-a6da-0a1acf9db3e7', 'e1133a27-e529-437f-93a2-6201e1478b0a', 'c4be178b-e6c5-4e62-8e2b-929201868f8d', 100),
-- Alice Tag 2 – Snack: Apfel + Mandeln
('9b42fc69-52e4-4c89-9f9f-e8da9091c71f', 'd58de306-f4c4-4fd7-875a-a35fe1df0d7a', '2fadd54c-fb06-4e27-8a18-51724649c47d', 150),
('25afcee2-6006-477c-affe-1de9dfff4f9e', 'd58de306-f4c4-4fd7-875a-a35fe1df0d7a', 'daf5e856-78da-4068-b3cb-c429c419f276', 30),
-- Alice Tag 2 – Abendessen: Hähnchenbrust + Vollkornreis
('03e23009-def8-4cb8-9837-1e83b15d79e9', 'ba006cdb-7b26-4bf9-a906-b42d27774868', '70d99d57-9637-4104-bb5f-a56fcda9b1d1', 180),
('8e000659-ebe5-402f-bdbc-38533a1cfe87', 'ba006cdb-7b26-4bf9-a906-b42d27774868', '8cba5383-3ede-4ad3-93cb-f7b36ccbc216', 180),

-- Bob Tag 1 – Frühstück: Haferflocken + Ei + Vollmilch
('643f9b45-bd78-48b5-8df8-4d667b77e537', 'fe018403-4cc2-447d-a41a-f4616b7f088e', 'd98122d1-5663-4a92-907b-c6a540e7b94f', 120),
('0b265ca0-9fd5-4e03-bd84-b97c01428a18', 'fe018403-4cc2-447d-a41a-f4616b7f088e', 'f64dbf20-6199-43ef-b4d4-ddbcc7af8e50', 200),
('77d7bce7-989d-451b-8c39-915ffed7c2e2', 'fe018403-4cc2-447d-a41a-f4616b7f088e', '0890b512-36de-40c4-a566-19e2dfa28497', 250),
-- Bob Tag 1 – Mittagessen: Hähnchenbrust + Nudeln + Spinat
('bcccb79e-931e-4fd3-adac-eeba799cea7b', 'ae720dfb-ba3a-4eaa-ae0a-10a2b400ab47', '70d99d57-9637-4104-bb5f-a56fcda9b1d1', 250),
('aa2e5451-0c0b-409b-ae33-558eb2405767', 'ae720dfb-ba3a-4eaa-ae0a-10a2b400ab47', '78009d75-abe5-4e7f-9955-ccf62c9fa101', 250),
('1bcdcf87-5eb0-4b17-946a-2433d9a86c0f', 'ae720dfb-ba3a-4eaa-ae0a-10a2b400ab47', '5234cd54-4ec0-43dd-b84a-3328ef3536d9', 80),
-- Bob Tag 1 – Abendessen: Lachs + Süßkartoffel
('d26fea12-1d97-4702-9ddd-e7615989c974', 'a56bd493-4e21-4c3c-9ba9-0a21d4631399', '88b5124d-dc05-4d46-b82f-bb65beeb594a', 220),
('1c290f36-2ed0-4c0b-9eb5-429058a414eb', 'a56bd493-4e21-4c3c-9ba9-0a21d4631399', '8196ad2f-7c6d-449e-9548-3fe63640139a', 250),
-- Bob Tag 2 – Frühstück: Haferflocken + Ei + Erdnussbutter
('0ae7ecc7-0913-4b4f-be30-4454dce35818', '0a5188ad-0ad3-48ac-aef1-bbc27be2ea7e', 'd98122d1-5663-4a92-907b-c6a540e7b94f', 120),
('7e366023-6325-45fd-b4e2-7ff91be0a8f8', '0a5188ad-0ad3-48ac-aef1-bbc27be2ea7e', 'f64dbf20-6199-43ef-b4d4-ddbcc7af8e50', 150),
('c2231917-19fa-4586-8986-edc4f82e826d', '0a5188ad-0ad3-48ac-aef1-bbc27be2ea7e', '384e7e27-e6b8-48bd-8f0d-88372488188a', 30),
-- Bob Tag 2 – Snack: Mandeln + Banane
('6c5383bc-560c-457e-b9bf-f8886cb67f9a', '6da188e9-c90e-4df7-b118-d8ebe5b491dd', 'daf5e856-78da-4068-b3cb-c429c419f276', 50),
('d72e39f4-4e22-40ca-9455-de84f2d1ddd8', '6da188e9-c90e-4df7-b118-d8ebe5b491dd', '35c03dd5-e143-4bbe-bcb3-24f2e53b614a', 150),
-- Bob Tag 2 – Mittagessen: Thunfisch + Vollkornreis + Brokkoli
('66beebe1-3525-46d1-81bf-48fc48369002', 'edd5c6b7-529b-423a-94bd-b89562c662b8', '9cd5fed6-aa8d-4608-9c2e-74274fffb531', 200),
('768a4c27-3795-468b-93b7-69d35a8374f4', 'edd5c6b7-529b-423a-94bd-b89562c662b8', '8cba5383-3ede-4ad3-93cb-f7b36ccbc216', 200),
('14404e4a-ffbe-41a7-a017-9545c9b0ca51', 'edd5c6b7-529b-423a-94bd-b89562c662b8', 'c4be178b-e6c5-4e62-8e2b-929201868f8d', 120),
-- Bob Tag 2 – Abendessen: Hähnchenbrust + Nudeln
('ac4d86a1-4cfb-43f3-98af-b21f28820d3d', 'dae458f9-d070-41b9-8049-be639e8aad99', '70d99d57-9637-4104-bb5f-a56fcda9b1d1', 250),
('6bff51c3-e0e4-43c0-b121-83cf2e8c5a67', 'dae458f9-d070-41b9-8049-be639e8aad99', '78009d75-abe5-4e7f-9955-ccf62c9fa101', 250),

-- Clara Tag 1 – Frühstück: Griechischer Joghurt + Banane + Smoothie-Mix
('77dbdc5e-5cdc-47fb-b1f2-33f6a1569d48', '2906d700-9c34-441c-8046-e18f1e992075', 'e9e4924e-555b-4928-a682-7f6d4a6c9ca0', 150),
('a6371bdb-b76e-48b0-92b7-5e797fa25b85', '2906d700-9c34-441c-8046-e18f1e992075', '35c03dd5-e143-4bbe-bcb3-24f2e53b614a', 100),
('61bfedcc-a2a5-4d62-b17c-4d68d4fc4737', '2906d700-9c34-441c-8046-e18f1e992075', 'd8ff5dc3-5281-47a0-80b7-9df7e4e1c446', 250),
-- Clara Tag 1 – Mittagessen: Thunfisch + Vollkornreis + Spinat
('4baed024-8a84-4282-8b1b-be1c7c77672d', 'fab6f253-03b7-4f53-80b4-cf267fcc4b9c', '9cd5fed6-aa8d-4608-9c2e-74274fffb531', 130),
('b429581d-31a0-4e27-9464-316c7cb5a062', 'fab6f253-03b7-4f53-80b4-cf267fcc4b9c', '8cba5383-3ede-4ad3-93cb-f7b36ccbc216', 130),
('26f682fd-12e5-4701-b5a3-b029847efdd9', 'fab6f253-03b7-4f53-80b4-cf267fcc4b9c', '5234cd54-4ec0-43dd-b84a-3328ef3536d9', 80),
-- Clara Tag 1 – Abendessen: Hähnchenbrust + Süßkartoffel + Brokkoli
('6b53b671-8838-44a8-b36a-9d189f54a94a', '092ff32e-4165-4243-a867-6dd1aa48c862', '70d99d57-9637-4104-bb5f-a56fcda9b1d1', 160),
('f00499b4-1412-49ca-a2a7-c7a7e903c292', '092ff32e-4165-4243-a867-6dd1aa48c862', '8196ad2f-7c6d-449e-9548-3fe63640139a', 180),
('1ba0a97f-bfd7-41f8-b6c9-57117961cdeb', '092ff32e-4165-4243-a867-6dd1aa48c862', 'c4be178b-e6c5-4e62-8e2b-929201868f8d', 100),
-- Clara Tag 2 – Frühstück: Haferflocken + Vollmilch
('32f5f25c-2fd4-4a91-b282-6497a571447b', 'e290775d-dea4-4134-ae0b-5bc3f83a4252', 'd98122d1-5663-4a92-907b-c6a540e7b94f', 70),
('1f044af5-a902-4c54-8026-535a284a4762', 'e290775d-dea4-4134-ae0b-5bc3f83a4252', '0890b512-36de-40c4-a566-19e2dfa28497', 200),
-- Clara Tag 2 – Mittagessen: Lachs + Nudeln + Spinat
('38992c86-b36d-4d3e-9dc3-927c7e3e5fe4', 'a747378e-7702-435b-81d0-2bec41708a3d', '88b5124d-dc05-4d46-b82f-bb65beeb594a', 150),
('6973f179-dba1-4d96-a122-9d2f9110659b', 'a747378e-7702-435b-81d0-2bec41708a3d', '78009d75-abe5-4e7f-9955-ccf62c9fa101', 180),
('cc82952d-4d8b-414e-bfe6-cd8615afa436', 'a747378e-7702-435b-81d0-2bec41708a3d', '5234cd54-4ec0-43dd-b84a-3328ef3536d9', 60),
-- Clara Tag 2 – Snack: Apfel + Griechischer Joghurt
('0280781e-12d4-47ed-a875-221344e12fa6', '8d947267-3ad8-476c-b5e1-d84226774f45', '2fadd54c-fb06-4e27-8a18-51724649c47d', 180),
('a033bf69-a8e4-4f55-8a57-37242467407c', '8d947267-3ad8-476c-b5e1-d84226774f45', 'e9e4924e-555b-4928-a682-7f6d4a6c9ca0', 100);
