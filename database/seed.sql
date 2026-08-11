-- Seed Customers
INSERT INTO customers (company_name, contact_person, phone, email) VALUES
('Acme Corporation', 'John Acme', '555-0100', 'info@acme.com'),
('Globex Industries', 'Hank Scorpio', '555-0200', 'contact@globex.com'),
('Initech Inc.', 'Peter Gibbons', '555-0300', 'support@initech.com'),
('Stark Industries', 'Pepper Potts', '555-0400', 'contact@starkindustries.com'),
('Wayne Enterprises', 'Lucius Fox', '555-0500', 'contact@wayneenterprises.com'),
('Hooli', 'Gavin Belson', '555-0600', 'contact@hooli.xyz'),
('Tyrell Corporation', 'Eldon Tyrell', '555-0700', 'support@tyrellcorp.com'),
('Cyberdyne Systems', 'Miles Dyson', '555-0800', 'tech@cyberdyne.com'),
('Umbrella Corporation', 'Albert Wesker', '555-0900', 'security@umbrellacorp.com');

-- Seed Users (Password is 'KeystoneFSM_Pass2026_Secure!' BCrypt hashed)
-- Password Hash: $2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O
INSERT INTO users (full_name, email, password, phone, role, active, customer_id, created_at, updated_at) VALUES
('System Manager', 'manager@keystone.com', '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O', '1234567890', 'MANAGER', true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Central Dispatcher', 'dispatcher@keystone.com', '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O', '1234567891', 'DISPATCHER', true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('John Doe Tech', 'technician@keystone.com', '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O', '1234567892', 'TECHNICIAN', true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Jane Smith Customer', 'customer@keystone.com', '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O', '1234567893', 'CUSTOMER', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bob Builder Tech', 'bob@keystone.com', '$2b$10$Q1wTvbjtZWFs7N0h4C1h1OeoBWSDGsye9F1pdd8bXH34a9mQXNQ2O', '1234567894', 'TECHNICIAN', true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Technicians using user subqueries
INSERT INTO technicians (id, employee_code, specialization, availability) VALUES
((SELECT id FROM users WHERE email = 'technician@keystone.com'), 'TECH001', 'HVAC & Plumbing', 'AVAILABLE'),
((SELECT id FROM users WHERE email = 'bob@keystone.com'), 'TECH002', 'Electrical & IT', 'AVAILABLE');

-- Seed Sites using customer subqueries
INSERT INTO sites (customer_id, site_name, address, city, state, pincode) VALUES
((SELECT id FROM customers WHERE email = 'info@acme.com'), 'Acme Headquarters', '123 Industrial Parkway', 'Metropolis', 'NY', '10001'),
((SELECT id FROM customers WHERE email = 'info@acme.com'), 'Acme Warehouse East', '456 Logistics Way', 'Newark', 'NJ', '07101'),
((SELECT id FROM customers WHERE email = 'contact@globex.com'), 'Globex HQ', '1000 Innovation Way', 'Cypress Creek', 'OR', '97401'),
((SELECT id FROM customers WHERE email = 'support@initech.com'), 'Initech Main Office', '4120 Freemont Ave', 'Austin', 'TX', '78701'),
((SELECT id FROM customers WHERE email = 'contact@starkindustries.com'), 'Stark Tower New York', '200 Park Ave', 'New York', 'NY', '10166'),
((SELECT id FROM customers WHERE email = 'contact@starkindustries.com'), 'Stark California Lab', '10880 Wilshire Blvd', 'Los Angeles', 'CA', '90024'),
((SELECT id FROM customers WHERE email = 'contact@wayneenterprises.com'), 'Wayne Tower', '100 Core Road', 'Gotham City', 'NJ', '07001'),
((SELECT id FROM customers WHERE email = 'contact@wayneenterprises.com'), 'Wayne R&D Facility', '1244 Science Way', 'Gotham City', 'NJ', '07002'),
((SELECT id FROM customers WHERE email = 'contact@hooli.xyz'), 'Hooli HQ Campus', '100 Hooli Way', 'Mountain View', 'CA', '94043'),
((SELECT id FROM customers WHERE email = 'support@tyrellcorp.com'), 'Tyrell Corporate Pyramid', '1000 Elysian Park Ave', 'Los Angeles', 'CA', '90012'),
((SELECT id FROM customers WHERE email = 'tech@cyberdyne.com'), 'Cyberdyne Research Lab', '18111 Nordhoff St', 'Northridge', 'CA', '91330'),
((SELECT id FROM customers WHERE email = 'security@umbrellacorp.com'), 'Hive Underground Facility', '500 Raccoon St', 'Raccoon City', 'MO', '63101');

-- Seed Parts (Inventory)
INSERT INTO parts (name, sku, price, quantity) VALUES
('Copper Pipe 1/2 inch (10ft)', 'PIPE-COP-12', 24.99, 150),
('HVAC Filter 20x20x1', 'FILT-HVAC-20', 12.50, 200),
('Cat6 Ethernet Cable (1000ft)', 'CAB-CAT6-1K', 149.99, 30),
('LED Light Fixture 2x2', 'LGT-LED-22', 45.00, 80),
('Single Pole Switch 15A', 'ELEC-SPS-15', 3.25, 500),
('Thermostat Smart WiFi', 'TSTAT-SMART', 129.99, 15),
('Security Camera Dome 4K', 'SEC-CAM-01', 89.99, 45),
('Fire Extinguisher 10lb', 'FIRE-EXT-10', 55.00, 120),
('Drywall Sheet 4x8', 'DRY-48', 15.50, 75),
('Heavy Duty Door Lockset', 'LOCK-HD-02', 42.50, 110),
('White Latex Wall Paint 5gal', 'PNT-WHT-5G', 75.00, 35),
('Ergonomic Office Chair', 'FURN-CHR-08', 189.99, 20),
('Fiber Optic Patch Cable 10m', 'CAB-FIBER-10M', 19.99, 65);

-- Seed Initial Service Requests using customer subqueries
INSERT INTO service_requests (customer_id, title, description, priority, status, service_type, created_at) VALUES
((SELECT id FROM customers WHERE email = 'info@acme.com'), 'AC unit blowing warm air', 'The main server room AC unit (Zone B) is blowing warm air. Temp is rising rapidly.', 'EMERGENCY', 'NEW', 'HVAC', CURRENT_TIMESTAMP),
((SELECT id FROM customers WHERE email = 'contact@globex.com'), 'Flickering lights in cafeteria', 'Several LED light fixtures in the cafeteria are flickering, causing eye strain.', 'MEDIUM', 'NEW', 'ELECTRICAL', CURRENT_TIMESTAMP),
((SELECT id FROM customers WHERE email = 'support@initech.com'), 'Network outlet damaged', 'Desk 12 network outlet was pulled from the wall and requires rewiring and a new jack.', 'LOW', 'NEW', 'IT', CURRENT_TIMESTAMP);

-- Seed Work Orders
INSERT INTO work_orders (work_order_number, request_id, customer_id, site_id, assigned_to, priority, status, sla_due_date, created_at, updated_at) VALUES
('WO-2026-0001', 1, (SELECT id FROM customers WHERE email = 'info@acme.com'), (SELECT id FROM sites WHERE site_name = 'Acme Headquarters'), (SELECT id FROM users WHERE email = 'technician@keystone.com'), 'EMERGENCY', 'IN_PROGRESS', '2026-08-10 12:00:00', '2026-08-01 09:00:00', '2026-08-01 09:00:00'),
('WO-2026-0002', 2, (SELECT id FROM customers WHERE email = 'contact@globex.com'), (SELECT id FROM sites WHERE site_name = 'Globex HQ'), (SELECT id FROM users WHERE email = 'bob@keystone.com'), 'MEDIUM', 'COMPLETED', '2026-07-28 17:00:00', '2026-07-25 08:30:00', '2026-07-27 15:45:00'),
('WO-2026-0003', 3, (SELECT id FROM customers WHERE email = 'support@initech.com'), (SELECT id FROM sites WHERE site_name = 'Initech Main Office'), (SELECT id FROM users WHERE email = 'technician@keystone.com'), 'LOW', 'ASSIGNED', '2026-08-15 17:00:00', '2026-08-03 11:15:00', '2026-08-03 11:15:00'),
('WO-2026-0004', null, (SELECT id FROM customers WHERE email = 'contact@starkindustries.com'), (SELECT id FROM sites WHERE site_name = 'Stark Tower New York'), (SELECT id FROM users WHERE email = 'bob@keystone.com'), 'HIGH', 'ON_HOLD', '2026-08-02 12:00:00', '2026-07-29 10:00:00', '2026-07-31 14:20:00'),
('WO-2026-0005', null, (SELECT id FROM customers WHERE email = 'contact@wayneenterprises.com'), (SELECT id FROM sites WHERE site_name = 'Wayne Tower'), null, 'LOW', 'NEW', '2026-08-20 12:00:00', '2026-08-05 15:00:00', '2026-08-05 15:00:00');

-- Seed Time Logs
INSERT INTO time_logs (work_order_id, technician_id, minutes, notes, logged_at) VALUES
(1, (SELECT id FROM users WHERE email = 'technician@keystone.com'), 90, 'Diagnosed faulty compressor relay. Replaced relay and tested AC.', '2026-08-01 11:30:00'),
(2, (SELECT id FROM users WHERE email = 'bob@keystone.com'), 45, 'Replaced 2 flicker LED tubes in cafeteria west block.', '2026-07-26 09:45:00'),
(2, (SELECT id FROM users WHERE email = 'bob@keystone.com'), 30, 'Completed validation and final check of lighting circuits.', '2026-07-27 14:20:00');

-- Seed Part Usages
INSERT INTO part_usages (work_order_id, part_id, quantity) VALUES
(1, (SELECT id FROM parts WHERE sku = 'FILT-HVAC-20'), 2),
(2, (SELECT id FROM parts WHERE sku = 'LGT-LED-22'), 2);
