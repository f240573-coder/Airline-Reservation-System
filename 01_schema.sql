-- ============================================================
-- AIRLINE MANAGEMENT SYSTEM — Oracle XE 11.2
-- Phase 2 | DB Systems | Schema Creation Script
-- Run this FIRST before 02_seed.sql
-- ============================================================

-- Drop tables in reverse FK order (ignore errors if they don't exist yet)
BEGIN
  FOR t IN (
    SELECT table_name FROM user_tables
    WHERE table_name IN (
      'BAGGAGE','SECURITY_CHECK','BOARDING_PASS','ECONOMY_PASSENGER',
      'BUSINESS_PASSENGER','VIP_PASSENGER','PASSENGER',
      'CABIN_CREW','PILOT','CREW',
      'FLIGHT','GATE','TERMINAL','AIRPORT','AIRLINE'
    )
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- ============================================================
-- AIRLINE
-- ============================================================
CREATE TABLE AIRLINE (
  AirlineID   NUMBER(10)    PRIMARY KEY,
  Name        VARCHAR2(100) NOT NULL,
  ContactNo   VARCHAR2(20),
  Country     VARCHAR2(60)
);

-- ============================================================
-- AIRPORT
-- ============================================================
CREATE TABLE AIRPORT (
  AirportID   NUMBER(10)    PRIMARY KEY,
  Name        VARCHAR2(100) NOT NULL,
  City        VARCHAR2(60),
  Country     VARCHAR2(60),
  ContactNo   VARCHAR2(20)
);

-- ============================================================
-- TERMINAL  (belongs to Airport)
-- ============================================================
CREATE TABLE TERMINAL (
  TerminalID  NUMBER(10)    PRIMARY KEY,
  AirportID   NUMBER(10)    NOT NULL,
  T_Name      VARCHAR2(60)  NOT NULL,
  FloorCount  NUMBER(3),
  Capacity    NUMBER(6),
  CONSTRAINT fk_terminal_airport FOREIGN KEY (AirportID) REFERENCES AIRPORT(AirportID)
);

-- ============================================================
-- GATE  (belongs to Terminal)
-- ============================================================
CREATE TABLE GATE (
  GateID      NUMBER(10)    PRIMARY KEY,
  TerminalID  NUMBER(10)    NOT NULL,
  GateNo      VARCHAR2(10)  NOT NULL,
  Status      VARCHAR2(20)  DEFAULT 'Active'
    CONSTRAINT chk_gate_status CHECK (Status IN ('Active','Inactive','Maintenance')),
  CONSTRAINT fk_gate_terminal FOREIGN KEY (TerminalID) REFERENCES TERMINAL(TerminalID)
);

-- ============================================================
-- FLIGHT  (assigned to Gate via GateID)
-- ============================================================
CREATE TABLE FLIGHT (
  FlightID        NUMBER(10)    PRIMARY KEY,
  GateID          NUMBER(10),
  AirlineID       NUMBER(10),
  DepartureTime   DATE,
  ArrivalTime     DATE,
  Source          VARCHAR2(100),
  Destination     VARCHAR2(100),
  Status          VARCHAR2(30)  DEFAULT 'Scheduled'
    CONSTRAINT chk_flight_status CHECK (Status IN ('Scheduled','Boarding','Departed','Arrived','Cancelled','Delayed')),
  CONSTRAINT fk_flight_gate    FOREIGN KEY (GateID)    REFERENCES GATE(GateID),
  CONSTRAINT fk_flight_airline FOREIGN KEY (AirlineID) REFERENCES AIRLINE(AirlineID)
);

-- ============================================================
-- CREW  (parent — disjoint specialisation into Pilot / CabinCrew)
-- ============================================================
CREATE TABLE CREW (
  CrewID          NUMBER(10)    PRIMARY KEY,
  F_Name          VARCHAR2(60)  NOT NULL,
  L_Name          VARCHAR2(60)  NOT NULL,
  Salary          NUMBER(12,2),
  Phone           VARCHAR2(20),
  Experience_Year NUMBER(3),
  CrewType        VARCHAR2(15)  NOT NULL
    CONSTRAINT chk_crew_type CHECK (CrewType IN ('Pilot','CabinCrew'))
);

-- ============================================================
-- PILOT  (specialisation of CREW)
-- ============================================================
CREATE TABLE PILOT (
  CrewID       NUMBER(10) PRIMARY KEY,
  LicenseNo    VARCHAR2(40) NOT NULL,
  Rank         VARCHAR2(30),
  FlyingHours  NUMBER(7,1),
  ConfID       NUMBER(10),  -- self-referencing confidence lead pilot (optional)
  CONSTRAINT fk_pilot_crew FOREIGN KEY (CrewID) REFERENCES CREW(CrewID)
);

-- ============================================================
-- CABIN CREW  (specialisation of CREW)
-- ============================================================
CREATE TABLE CABIN_CREW (
  CrewID       NUMBER(10)   PRIMARY KEY,
  Role         VARCHAR2(30),
  ServiceYear  NUMBER(3),
  Steward      VARCHAR2(3)  DEFAULT 'No'
    CONSTRAINT chk_steward CHECK (Steward IN ('Yes','No')),
  CONSTRAINT fk_cabincrew_crew FOREIGN KEY (CrewID) REFERENCES CREW(CrewID)
);

-- ============================================================
-- CREW <-> FLIGHT assignment (M:N)
-- ============================================================
CREATE TABLE CREW_FLIGHT (
  CrewID    NUMBER(10) NOT NULL,
  FlightID  NUMBER(10) NOT NULL,
  PRIMARY KEY (CrewID, FlightID),
  CONSTRAINT fk_cf_crew   FOREIGN KEY (CrewID)   REFERENCES CREW(CrewID),
  CONSTRAINT fk_cf_flight FOREIGN KEY (FlightID) REFERENCES FLIGHT(FlightID)
);

-- ============================================================
-- PASSENGER  (disjoint specialisation d: Business / Economy / VIP)
-- ============================================================
CREATE TABLE PASSENGER (
  PassengerID     NUMBER(10)    PRIMARY KEY,
  F_Name          VARCHAR2(60)  NOT NULL,
  L_Name          VARCHAR2(60)  NOT NULL,
  Phone           VARCHAR2(20),
  Address         VARCHAR2(200),
  NIC             VARCHAR2(20),
  DOB             DATE,
  Gender          VARCHAR2(10)
    CONSTRAINT chk_gender CHECK (Gender IN ('Male','Female','Other')),
  PassengerType   VARCHAR2(15)  NOT NULL
    CONSTRAINT chk_ptype CHECK (PassengerType IN ('Business','Economy','VIP'))
);

-- ============================================================
-- BUSINESS PASSENGER  (specialisation)
-- ============================================================
CREATE TABLE BUSINESS_PASSENGER (
  PassengerID      NUMBER(10) PRIMARY KEY,
  LoungeAccess     VARCHAR2(3) DEFAULT 'Yes',
  SeatingNo        VARCHAR2(10),
  ExtraBaggageLimit NUMBER(5),
  CONSTRAINT fk_bp_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID)
);

-- ============================================================
-- ECONOMY PASSENGER  (specialisation)
-- ============================================================
CREATE TABLE ECONOMY_PASSENGER (
  PassengerID  NUMBER(10) PRIMARY KEY,
  MealType     VARCHAR2(30),
  SeatNumber   VARCHAR2(10),
  CONSTRAINT fk_ep_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID)
);

-- ============================================================
-- VIP PASSENGER  (specialisation)
-- ============================================================
CREATE TABLE VIP_PASSENGER (
  PassengerID       NUMBER(10) PRIMARY KEY,
  VIPLevel          VARCHAR2(20),
  PersonalAssistant VARCHAR2(100),
  PrioritySecurity  VARCHAR2(3) DEFAULT 'Yes',
  CONSTRAINT fk_vp_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID)
);

-- ============================================================
-- BOARDING PASS  (weak entity — PassID, links Passenger+Terminal)
-- Relationship "undergoes" Passenger 1..N  Terminal 1
-- ============================================================
CREATE TABLE BOARDING_PASS (
  PassID        NUMBER(10)   PRIMARY KEY,
  PassengerID   NUMBER(10)   NOT NULL,
  FlightID      NUMBER(10)   NOT NULL,
  TerminalID    NUMBER(10),
  SeatNo        VARCHAR2(10),
  BoardingTime  DATE,
  GateNo        VARCHAR2(10),
  BoardingGroup VARCHAR2(5),
  CONSTRAINT fk_bp_passenger2 FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID),
  CONSTRAINT fk_bp_flight     FOREIGN KEY (FlightID)    REFERENCES FLIGHT(FlightID),
  CONSTRAINT fk_bp_terminal   FOREIGN KEY (TerminalID)  REFERENCES TERMINAL(TerminalID)
);

-- ============================================================
-- SECURITY CHECK  (linked to Boarding Pass)
-- ============================================================
CREATE TABLE SECURITY_CHECK (
  CheckID             NUMBER(10)  PRIMARY KEY,
  PassID              NUMBER(10)  NOT NULL,
  CheckTime           DATE,
  Status              VARCHAR2(15) DEFAULT 'Cleared'
    CONSTRAINT chk_sec_status CHECK (Status IN ('Cleared','Not Cleared')),
  SecurityOfficerName VARCHAR2(100),
  CONSTRAINT fk_sc_pass FOREIGN KEY (PassID) REFERENCES BOARDING_PASS(PassID)
);

-- ============================================================
-- BAGGAGE  (Airline carries N baggage; subtypes: Hand / Checked)
-- ============================================================
CREATE TABLE BAGGAGE (
  BaggageID   NUMBER(10)   PRIMARY KEY,
  PassengerID NUMBER(10)   NOT NULL,
  AirlineID   NUMBER(10),
  TagNo       VARCHAR2(30),
  Type        VARCHAR2(10) NOT NULL
    CONSTRAINT chk_bag_type CHECK (Type IN ('Hand','Checked')),
  Weight      NUMBER(7,2),
  CONSTRAINT fk_bag_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID),
  CONSTRAINT fk_bag_airline   FOREIGN KEY (AirlineID)   REFERENCES AIRLINE(AirlineID)
);

-- ============================================================
-- SEQUENCES  (auto-increment PKs — Oracle XE 11.2 has no IDENTITY)
-- ============================================================
CREATE SEQUENCE seq_airline    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_airport    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_terminal   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_gate       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_flight     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_crew       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_passenger  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_boardpass  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_seccheck   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE seq_baggage    START WITH 1 INCREMENT BY 1 NOCACHE;

COMMIT;
