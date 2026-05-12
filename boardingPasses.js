// routes/boardingPasses.js
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT bp.PASSID, bp.PASSENGERID, p.F_NAME||' '||p.L_NAME AS PASSENGER_NAME,
              bp.FLIGHTID, f.SOURCE||' → '||f.DESTINATION AS FLIGHT_ROUTE,
              bp.TERMINALID, bp.SEATNO,
              TO_CHAR(bp.BOARDINGTIME,'YYYY-MM-DD HH24:MI') AS BOARDINGTIME,
              bp.GATENO, bp.BOARDINGGROUP
       FROM BOARDING_PASS bp
       JOIN PASSENGER p ON bp.PASSENGERID = p.PASSENGERID
       JOIN FLIGHT    f ON bp.FLIGHTID    = f.FLIGHTID
       ORDER BY bp.PASSID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { passengerId, flightId, terminalId, seatNo, boardingTime, gateNo, boardingGroup } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO BOARDING_PASS (PASSID,PASSENGERID,FLIGHTID,TERMINALID,SEATNO,BOARDINGTIME,GATENO,BOARDINGGROUP)
       VALUES (seq_boardpass.NEXTVAL,:pid,:fid,:tid,:sn,
               TO_DATE(:bt,'YYYY-MM-DD HH24:MI'),:gn,:bg)
       RETURNING PASSID INTO :newid`,
      { pid: passengerId, fid: flightId, tid: terminalId||null, sn: seatNo, bt: boardingTime,
        gn: gateNo, bg: boardingGroup,
        newid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Boarding pass created', id: r.outBinds.newid[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { seatNo, boardingTime, gateNo, boardingGroup } = req.body;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE BOARDING_PASS SET SEATNO=:sn, BOARDINGTIME=TO_DATE(:bt,'YYYY-MM-DD HH24:MI'),
              GATENO=:gn, BOARDINGGROUP=:bg WHERE PASSID=:id`,
      { sn: seatNo, bt: boardingTime, gn: gateNo, bg: boardingGroup, id: req.params.id },
      { autoCommit: true }
    );
    res.json({ message: 'Boarding pass updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.execute(`DELETE FROM SECURITY_CHECK WHERE PASSID=:id`, [req.params.id], { autoCommit: false });
    await conn.execute(`DELETE FROM BOARDING_PASS  WHERE PASSID=:id`, [req.params.id], { autoCommit: false });
    await conn.commit();
    res.json({ message: 'Boarding pass deleted' });
  } catch (e) { if (conn) await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
