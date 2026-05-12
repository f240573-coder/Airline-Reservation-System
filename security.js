// routes/security.js
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT sc.CHECKID, sc.PASSID,
              p.F_NAME||' '||p.L_NAME AS PASSENGER_NAME,
              TO_CHAR(sc.CHECKTIME,'YYYY-MM-DD HH24:MI') AS CHECKTIME,
              sc.STATUS, sc.SECURITYOFFICERNAME
       FROM SECURITY_CHECK sc
       JOIN BOARDING_PASS bp ON sc.PASSID      = bp.PASSID
       JOIN PASSENGER     p  ON bp.PASSENGERID  = p.PASSENGERID
       ORDER BY sc.CHECKID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { passId, checkTime, status, securityOfficerName } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO SECURITY_CHECK (CHECKID,PASSID,CHECKTIME,STATUS,SECURITYOFFICERNAME)
       VALUES (seq_seccheck.NEXTVAL,:pid,TO_DATE(:ct,'YYYY-MM-DD HH24:MI'),:sts,:son)
       RETURNING CHECKID INTO :newid`,
      { pid: passId, ct: checkTime, sts: status||'Cleared', son: securityOfficerName,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Security check created', id: r.outBinds.newid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { status, securityOfficerName } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE SECURITY_CHECK SET STATUS=:sts, SECURITYOFFICERNAME=:son WHERE CHECKID=:id`,
      { sts: status, son: securityOfficerName, id: req.params.id }, { autoCommit: true }
    );
    res.json({ message: 'Security check updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute(`DELETE FROM SECURITY_CHECK WHERE CHECKID=:id`, [req.params.id], { autoCommit: true });
    res.json({ message: 'Security check deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
