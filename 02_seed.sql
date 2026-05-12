-- ============================================================
-- AIRLINE MANAGEMENT SYSTEM — Oracle XE 11.2
-- Phase 2 | DB Systems | Sample Data Script
-- Run AFTER 01_schema.sql
-- ============================================================

-- AIRLINES
INSERT INTO AIRLINE VALUES (seq_airline.NEXTVAL, 'Pakistan International Airlines', '111-786-786', 'Pakistan');
INSERT INTO AIRLINE VALUES (seq_airline.NEXTVAL, 'Emirates', '800-EMIRATES', 'UAE');
INSERT INTO AIRLINE VALUES (seq_airline.NEXTVAL, 'Qatar Airways', '800-QATAR', 'Qatar');

-- AIRPORTS
INSERT INTO AIRPORT VALUES (seq_airport.NEXTVAL, 'Allama Iqbal International Airport', 'Lahore',    'Pakistan', '042-99200000');
INSERT INTO AIRPORT VALUES (seq_airport.NEXTVAL, 'Dubai International Airport',        'Dubai',     'UAE',      '971-4-2245555');
INSERT INTO AIRPORT VALUES (seq_airport.NEXTVAL, 'Hamad International Airport',        'Doha',      'Qatar',    '974-4010555');

-- TERMINALS
INSERT INTO TERMINAL VALUES (seq_terminal.NEXTVAL, 1, 'Terminal A', 3, 500);
INSERT INTO TERMINAL VALUES (seq_terminal.NEXTVAL, 1, 'Terminal B', 2, 350);
INSERT INTO TERMINAL VALUES (seq_terminal.NEXTVAL, 2, 'Terminal 1', 5, 1200);

-- GATES
INSERT INTO GATE VALUES (seq_gate.NEXTVAL, 1, 'G1', 'Active');
INSERT INTO GATE VALUES (seq_gate.NEXTVAL, 1, 'G2', 'Active');
INSERT INTO GATE VALUES (seq_gate.NEXTVAL, 2, 'G3', 'Maintenance');
INSERT INTO GATE VALUES (seq_gate.NEXTVAL, 3, 'G4', 'Active');

-- FLIGHTS
INSERT INTO FLIGHT VALUES (seq_flight.NEXTVAL, 1, 1, TO_DATE('2025-06-01 08:00','YYYY-MM-DD HH24:MI'), TO_DATE('2025-06-01 11:00','YYYY-MM-DD HH24:MI'), 'Lahore', 'Dubai',  'Scheduled');
INSERT INTO FLIGHT VALUES (seq_flight.NEXTVAL, 2, 2, TO_DATE('2025-06-02 14:00','YYYY-MM-DD HH24:MI'), TO_DATE('2025-06-02 17:30','YYYY-MM-DD HH24:MI'), 'Dubai',  'Doha',   'Scheduled');
INSERT INTO FLIGHT VALUES (seq_flight.NEXTVAL, 4, 3, TO_DATE('2025-06-03 09:00','YYYY-MM-DD HH24:MI'), TO_DATE('2025-06-03 15:00','YYYY-MM-DD HH24:MI'), 'Doha',   'Lahore', 'Delayed');

-- CREW
INSERT INTO CREW VALUES (seq_crew.NEXTVAL, 'Ahmed',  'Raza',   280000, '0300-1234567', 12, 'Pilot');
INSERT INTO CREW VALUES (seq_crew.NEXTVAL, 'Sara',   'Khan',   150000, '0301-9876543', 7,  'CabinCrew');
INSERT INTO CREW VALUES (seq_crew.NEXTVAL, 'Omar',   'Sheikh', 300000, '0302-5556667', 18, 'Pilot');
INSERT INTO CREW VALUES (seq_crew.NEXTVAL, 'Nadia',  'Ali',    140000, '0303-1112223', 5,  'CabinCrew');

-- PILOT specialisation
INSERT INTO PILOT VALUES (1, 'LIC-PK-00123', 'Captain',        4500.5, NULL);
INSERT INTO PILOT VALUES (3, 'LIC-PK-00456', 'First Officer',  8000.0, NULL);

-- CABIN CREW specialisation
INSERT INTO CABIN_CREW VALUES (2, 'Senior Attendant', 7,  'No');
INSERT INTO CABIN_CREW VALUES (4, 'Junior Attendant', 5,  'Yes');

-- CREW <-> FLIGHT
INSERT INTO CREW_FLIGHT VALUES (1, 1);
INSERT INTO CREW_FLIGHT VALUES (2, 1);
INSERT INTO CREW_FLIGHT VALUES (3, 2);
INSERT INTO CREW_FLIGHT VALUES (4, 3);

-- PASSENGERS
INSERT INTO PASSENGER VALUES (seq_passenger.NEXTVAL, 'Ali',   'Hassan', '0321-1234567', 'House 5, Gulberg, Lahore', '35201-1234567-1', TO_DATE('1990-03-15','YYYY-MM-DD'), 'Male',   'Business');
INSERT INTO PASSENGER VALUES (seq_passenger.NEXTVAL, 'Zara',  'Malik',  '0333-9876543', 'Flat 12, Clifton, Karachi','42101-9876543-2', TO_DATE('1995-07-22','YYYY-MM-DD'), 'Female', 'Economy');
INSERT INTO PASSENGER VALUES (seq_passenger.NEXTVAL, 'Bilal', 'Ahmed',  '0312-5555555', 'Street 3, F-7, Islamabad', '61101-5555555-3', TO_DATE('1985-11-08','YYYY-MM-DD'), 'Male',   'VIP');

-- Specialisation rows
INSERT INTO BUSINESS_PASSENGER VALUES (1, 'Yes', 'A1',  40);
INSERT INTO ECONOMY_PASSENGER  VALUES (2, 'Vegetarian', 'B22');
INSERT INTO VIP_PASSENGER      VALUES (3, 'Gold', 'Mr. James', 'Yes');

-- BOARDING PASSES
INSERT INTO BOARDING_PASS VALUES (seq_boardpass.NEXTVAL, 1, 1, 1, 'A1',  TO_DATE('2025-06-01 07:30','YYYY-MM-DD HH24:MI'), 'G1', 'A');
INSERT INTO BOARDING_PASS VALUES (seq_boardpass.NEXTVAL, 2, 1, 1, 'B22', TO_DATE('2025-06-01 07:35','YYYY-MM-DD HH24:MI'), 'G1', 'B');
INSERT INTO BOARDING_PASS VALUES (seq_boardpass.NEXTVAL, 3, 2, 3, 'C1',  TO_DATE('2025-06-02 13:30','YYYY-MM-DD HH24:MI'), 'G4', 'A');

-- SECURITY CHECKS
INSERT INTO SECURITY_CHECK VALUES (seq_seccheck.NEXTVAL, 1, TO_DATE('2025-06-01 07:00','YYYY-MM-DD HH24:MI'), 'Cleared',     'Officer Iqbal');
INSERT INTO SECURITY_CHECK VALUES (seq_seccheck.NEXTVAL, 2, TO_DATE('2025-06-01 07:05','YYYY-MM-DD HH24:MI'), 'Cleared',     'Officer Iqbal');
INSERT INTO SECURITY_CHECK VALUES (seq_seccheck.NEXTVAL, 3, TO_DATE('2025-06-02 13:00','YYYY-MM-DD HH24:MI'), 'Not Cleared', 'Officer Tariq');

-- BAGGAGE
INSERT INTO BAGGAGE VALUES (seq_baggage.NEXTVAL, 1, 1, 'TAG-001', 'Checked', 23.5);
INSERT INTO BAGGAGE VALUES (seq_baggage.NEXTVAL, 2, 1, 'TAG-002', 'Hand',     7.0);
INSERT INTO BAGGAGE VALUES (seq_baggage.NEXTVAL, 3, 2, 'TAG-003', 'Checked', 30.0);

COMMIT;
