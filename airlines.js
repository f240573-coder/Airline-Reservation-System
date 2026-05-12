// routes/airlines.js
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(`SELECT * FROM AIRLINE ORDER BY AIRLINEID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { name, contactNo, country } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO AIRLINE (AIRLINEID,NAME,CONTACTNO,COUNTRY)
       VALUES (seq_airline.NEXTVAL,:n,:c,:co)
       RETURNING AIRLINEID INTO :newid`,
      { n: name, c: contactNo, co: country,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Airline created', id: r.outBinds.newid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { name, contactNo, country } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE AIRLINE SET NAME=:n, CONTACTNO=:c, COUNTRY=:co WHERE AIRLINEID=:id`,
      { n: name, c: contactNo, co: country, id: req.params.id }, { autoCommit: true }
    );
    res.json({ message: 'Airline updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute(`DELETE FROM AIRLINE WHERE AIRLINEID=:id`, [req.params.id], { autoCommit: true });
    res.json({ message: 'Airline deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
