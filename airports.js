// routes/airports.js
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(`SELECT * FROM AIRPORT ORDER BY AIRPORTID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { name, city, country, contactNo } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO AIRPORT (AIRPORTID,NAME,CITY,COUNTRY,CONTACTNO)
       VALUES (seq_airport.NEXTVAL,:n,:ci,:co,:cn)
       RETURNING AIRPORTID INTO :newid`,
      { n: name, ci: city, co: country, cn: contactNo,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Airport created', id: r.outBinds.newid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { name, city, country, contactNo } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE AIRPORT SET NAME=:n, CITY=:ci, COUNTRY=:co, CONTACTNO=:cn WHERE AIRPORTID=:id`,
      { n: name, ci: city, co: country, cn: contactNo, id: req.params.id }, { autoCommit: true }
    );
    res.json({ message: 'Airport updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute(`DELETE FROM AIRPORT WHERE AIRPORTID=:id`, [req.params.id], { autoCommit: true });
    res.json({ message: 'Airport deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
