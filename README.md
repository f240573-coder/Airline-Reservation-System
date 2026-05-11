✈️ AeroBase — Airline Management System
Phase 2 | DB Systems | Oracle XE 11.2 + Express.js + HTML/CSS/JS
📁 FOLDER STRUCTURE
airline-db/
├── sql/
│   ├── 01_schema.sql        ← Create all tables & sequences
│   └── 02_seed.sql          ← Insert sample data
│
├── backend/
│   ├── server.js            ← Express entry point
│   ├── package.json         ← Node dependencies
│   ├── db/
│   │   └── connection.js    ← Oracle pool config
│   └── routes/
│       ├── passengers.js    ← CRUD: Passenger + subtypes
│       ├── flights.js       ← CRUD: Flight
│       ├── crew.js          ← CRUD: Crew + subtypes
│       ├── boardingPasses.js← CRUD: Boarding Pass
│       ├── security.js      ← CRUD: Security Check
│       ├── baggage.js       ← CRUD: Baggage
│       ├── airlines.js      ← CRUD: Airline
│       └── airports.js      ← CRUD: Airport
│
└── frontend/
    └── index.html           ← Full single-file UI
STEP 1 — ORACLE XE 11.2 SETUP
1.1 Verify Oracle XE is running
Open Command Prompt as Administrator:

lsnrctl status
You should see "The command completed successfully" with status READY.

If not running:

lsnrctl start
1.2 Open SQL*Plus
sqlplus system/YOUR_PASSWORD@localhost:1521/XE
Replace YOUR_PASSWORD with the password you set during Oracle XE installation.

1.3 Create a dedicated schema user (recommended)
In SQL*Plus:

CREATE USER airline_user IDENTIFIED BY airline123;
GRANT CONNECT, RESOURCE TO airline_user;
GRANT CREATE SESSION TO airline_user;
ALTER USER airline_user QUOTA UNLIMITED ON USERS;
EXIT;
Then reconnect as that user:

sqlplus airline_user/airline123@localhost:1521/XE
STEP 2 — RUN SQL SCRIPTS IN ORACLE
2.1 Run the Schema Script
In SQL*Plus (as airline_user):

@C:\path\to\airline-db\sql\01_schema.sql
Example:

@C:\Users\YourName\Desktop\airline-db\sql\01_schema.sql
You should see output like:

Table created.
Table created.
... (many lines)
Sequence created.
Commit complete.
2.2 Run the Seed Data Script
@C:\path\to\airline-db\sql\02_seed.sql
You should see:

1 row created.
... (many rows)
Commit complete.
2.3 Verify Tables Were Created
SELECT table_name FROM user_tables ORDER BY table_name;
Expected output (11 tables):

AIRLINE
AIRPORT
BAGGAGE
BOARDING_PASS
BUSINESS_PASSENGER
CABIN_CREW
CREW
CREW_FLIGHT
ECONOMY_PASSENGER
FLIGHT
GATE
PILOT
SECURITY_CHECK
TERMINAL
VIP_PASSENGER
2.4 Verify Data
SELECT COUNT(*) FROM PASSENGER;   -- Should show 3
SELECT COUNT(*) FROM FLIGHT;      -- Should show 3
SELECT COUNT(*) FROM CREW;        -- Should show 4
STEP 3 — INSTALL NODE.JS DEPENDENCIES
3.1 Install Node.js
Download from: https://nodejs.org (LTS version) After install, verify:

node --version
npm --version
3.2 Install Oracle Instant Client (REQUIRED for oracledb)
Go to: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
Download "Basic Package" — e.g., instantclient-basic-windows.x64-21.9.0.0.0dbru.zip
Extract to: C:\oracle\instantclient_21_9
Add that folder to your Windows PATH:
Search "Environment Variables" in Start
Under System Variables → Path → New → paste: C:\oracle\instantclient_21_9
3.3 Install backend dependencies
Open Command Prompt, navigate to backend folder:

cd C:\path\to\airline-db\backend
npm install
This installs express, oracledb, cors, nodemon.

STEP 4 — CONFIGURE DATABASE CONNECTION
Open backend/db/connection.js and update:

const dbConfig = {
  user:          'airline_user',        // your Oracle username
  password:      'airline123',          // your Oracle password
  connectString: 'localhost:1521/XE',   // Oracle XE connection string
  ...
};
If you used system user directly:

  user:     'system',
  password: 'YOUR_SYSTEM_PASSWORD',
Enable Thick Mode (required for Oracle XE 11.2)
In connection.js, uncomment this line and adjust the path:

oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_9' });
STEP 5 — START THE BACKEND SERVER
cd C:\path\to\airline-db\backend
node server.js
Expected output:

✅ Oracle connection pool created
🚀 Server running at http://localhost:3000
If you get an error like "DPI-1047: Cannot locate a 64-bit Oracle Client library": → Make sure Oracle Instant Client is extracted and PATH is set (Step 3.2)

STEP 6 — OPEN THE FRONTEND
Option A — Direct (simplest): Open frontend/index.html directly in your browser. Double-click the file or drag it into Chrome/Firefox.

Option B — Via Express server: The server already serves the frontend. Visit:

http://localhost:3000
STEP 7 — TEST ALL CRUD OPERATIONS (Demo Checklist)
✅ CREATE — Click any "+ Add" button, fill the form, submit ✅ READ — All tables load automatically; use the search box to filter ✅ UPDATE — Click "Edit" on any row, change values, Save ✅ DELETE — Click "Delete" on any row, confirm

Tables to demo for evaluator:

Passengers (with Business/Economy/VIP subtypes)
Flights (status changes)
Crew (Pilot/CabinCrew subtypes)
Boarding Passes
Security Checks
Baggage
STEP 8 — COMMON ERRORS & FIXES
Error: ORA-00955 Table already exists
Run in SQL*Plus:

-- The schema script auto-drops; if it fails, manually drop:
DROP TABLE BAGGAGE CASCADE CONSTRAINTS;
-- ... (repeat for each table)
Error: NJS-516 thick mode not initialized
Uncomment the initOracleClient line in connection.js with correct path.

Error: ORA-01017 Invalid username/password
Double-check user/password in connection.js.

Error: ECONNREFUSED localhost:3000
Backend isn't running. Run node server.js first.

Error: ORA-12541 No listener
Start Oracle listener:

lsnrctl start
SCHEMA SUMMARY (matches EERD)
Table	EERD Entity	Notes
PASSENGER	Passenger	Parent entity
BUSINESS_PASSENGER	Business Passenger	Subtype (disjoint 'd')
ECONOMY_PASSENGER	Economy Passengers	Subtype
VIP_PASSENGER	VIP Passenger	Subtype
CREW	Crew	Parent entity
PILOT	Pilot	Subtype
CABIN_CREW	CabinCrew	Subtype
CREW_FLIGHT	assigned (M:N)	Crew-Flight relationship
FLIGHT	Flight	Core entity
AIRPORT	Airport	Core entity
TERMINAL	Terminal	Belongs to Airport
GATE	Gate	Belongs to Terminal
AIRLINE	Airline	Core entity
BOARDING_PASS	Boarding Pass	Weak entity (PassID)
SECURITY_CHECK	Security Check	Linked to Boarding Pass
BAGGAGE	Baggage	Hand/Checked (type column)
