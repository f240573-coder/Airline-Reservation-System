// routes/baggage.js
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT b.BAGGAGEID, b.PASSENGERID, p.F_NAME||' '||p.L_NAME AS PASSENGER_NAME,
              b.AIRLINEID, a.NAME AS AIRLINE_NAME, b.TAGNO, b.TYPE, b.WEIGHT
       FROM BAGGAGE b
       JOIN PASSENGER p ON b.PASSENGERID = p.PASSENGERID
       LEFT JOIN AIRLINE a ON b.AIRLINEID = a.AIRLINEID
       ORDER BY b.BAGGAGEID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { passengerId, airlineId, tagNo, type, weight } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO BAGGAGE (BAGGAGEID,PASSENGERID,AIRLINEID,TAGNO,TYPE,WEIGHT)
       VALUES (seq_baggage.NEXTVAL,:pid,:aid,:tn,:tp,:wt)
       RETURNING BAGGAGEID INTO :newid`,
      { pid: passengerId, aid: airlineId||null, tn: tagNo, tp: type, wt: weight||null,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Baggage created', id: r.outBinds.newid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { tagNo, type, weight } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE BAGGAGE SET TAGNO=:tn, TYPE=:tp, WEIGHT=:wt WHERE BAGGAGEID=:id`,
      { tn: tagNo, tp: type, wt: weight||null, id: req.params.id }, { autoCommit: true }
    );
    res.json({ message: 'Baggage updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute(`DELETE FROM BAGGAGE WHERE BAGGAGEID=:id`, [req.params.id], { autoCommit: true });
    res.json({ message: 'Baggage deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
