// routes/flights.js — Full CRUD for FLIGHT
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

// READ ALL
router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT f.FLIGHTID, f.SOURCE, f.DESTINATION,
              TO_CHAR(f.DEPARTURETIME,'YYYY-MM-DD HH24:MI') AS DEPARTURETIME,
              TO_CHAR(f.ARRIVALTIME,'YYYY-MM-DD HH24:MI')   AS ARRIVALTIME,
              f.STATUS, g.GATENO, a.NAME AS AIRLINE
       FROM FLIGHT f
       LEFT JOIN GATE    g ON f.GATEID    = g.GATEID
       LEFT JOIN AIRLINE a ON f.AIRLINEID = a.AIRLINEID
       ORDER BY f.FLIGHTID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

// READ ONE
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT f.FLIGHTID, f.GATEID, f.AIRLINEID, f.SOURCE, f.DESTINATION,
              TO_CHAR(f.DEPARTURETIME,'YYYY-MM-DD HH24:MI') AS DEPARTURETIME,
              TO_CHAR(f.ARRIVALTIME,'YYYY-MM-DD HH24:MI')   AS ARRIVALTIME,
              f.STATUS
       FROM FLIGHT f WHERE f.FLIGHTID=:id`,
      [req.params.id], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

// CREATE
router.post('/', async (req, res) => {
  let conn;
  try {
    const { gateId, airlineId, departureTime, arrivalTime, source, destination, status } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO FLIGHT (FLIGHTID,GATEID,AIRLINEID,DEPARTURETIME,ARRIVALTIME,SOURCE,DESTINATION,STATUS)
       VALUES (seq_flight.NEXTVAL,:gid,:aid,
               TO_DATE(:dep,'YYYY-MM-DD HH24:MI'),
               TO_DATE(:arr,'YYYY-MM-DD HH24:MI'),
               :src,:dst,:sts)
       RETURNING FLIGHTID INTO :fid`,
      { gid: gateId||null, aid: airlineId||null, dep: departureTime, arr: arrivalTime,
        src: source, dst: destination, sts: status||'Scheduled',
        fid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Flight created', id: r.outBinds.fid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

// UPDATE
router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { gateId, airlineId, departureTime, arrivalTime, source, destination, status } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE FLIGHT SET GATEID=:gid, AIRLINEID=:aid,
              DEPARTURETIME=TO_DATE(:dep,'YYYY-MM-DD HH24:MI'),
              ARRIVALTIME=TO_DATE(:arr,'YYYY-MM-DD HH24:MI'),
              SOURCE=:src, DESTINATION=:dst, STATUS=:sts
       WHERE FLIGHTID=:id`,
      { gid: gateId||null, aid: airlineId||null, dep: departureTime, arr: arrivalTime,
        src: source, dst: destination, sts: status, id: req.params.id },
      { autoCommit: true }
    );
    res.json({ message: 'Flight updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { id } = req.params;
    await conn.execute(`DELETE FROM CREW_FLIGHT WHERE FLIGHTID=:id`, [id], { autoCommit: false });
    // boarding passes + security checks cascade
    const bps = await conn.execute(`SELECT PASSID FROM BOARDING_PASS WHERE FLIGHTID=:id`, [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT });
    for (const row of bps.rows)
      await conn.execute(`DELETE FROM SECURITY_CHECK WHERE PASSID=:pid`, [row.PASSID], { autoCommit: false });
    await conn.execute(`DELETE FROM BOARDING_PASS WHERE FLIGHTID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM FLIGHT WHERE FLIGHTID=:id`, [id], { autoCommit: false });
    await conn.commit();
    res.json({ message: 'Flight deleted' });
  } catch (e) { if (conn) await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
