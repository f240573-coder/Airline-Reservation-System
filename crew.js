// routes/crew.js — Full CRUD for CREW + subtypes
const express  = require('express');
const router   = express.Router();
const db       = require('../db/connection');
const oracledb = require('oracledb');

router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT c.CREWID, c.F_NAME, c.L_NAME, c.SALARY, c.PHONE, c.EXPERIENCE_YEAR, c.CREWTYPE,
              p.LICENSENO, p.RANK, p.FLYINGHOURS,
              cc.ROLE, cc.SERVICEYEAR, cc.STEWARD
       FROM CREW c
       LEFT JOIN PILOT      p  ON c.CREWID = p.CREWID
       LEFT JOIN CABIN_CREW cc ON c.CREWID = cc.CREWID
       ORDER BY c.CREWID`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const r = await conn.execute(
      `SELECT c.CREWID, c.F_NAME, c.L_NAME, c.SALARY, c.PHONE, c.EXPERIENCE_YEAR, c.CREWTYPE,
              p.LICENSENO, p.RANK, p.FLYINGHOURS,
              cc.ROLE, cc.SERVICEYEAR, cc.STEWARD
       FROM CREW c
       LEFT JOIN PILOT      p  ON c.CREWID = p.CREWID
       LEFT JOIN CABIN_CREW cc ON c.CREWID = cc.CREWID
       WHERE c.CREWID=:id`,
      [req.params.id], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const { fName, lName, salary, phone, experienceYear, crewType,
            licenseNo, rank, flyingHours, role, serviceYear, steward } = req.body;
    conn = await db.getConnection();
    const r = await conn.execute(
      `INSERT INTO CREW (CREWID,F_NAME,L_NAME,SALARY,PHONE,EXPERIENCE_YEAR,CREWTYPE)
       VALUES (seq_crew.NEXTVAL,:fn,:ln,:sal,:ph,:exp,:ct)
       RETURNING CREWID INTO :cid`,
      { fn: fName, ln: lName, sal: salary||null, ph: phone, exp: experienceYear||null, ct: crewType,
        cid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: false }
    );
    const newId = r.outBinds.cid[0];
    if (crewType === 'Pilot') {
      await conn.execute(
        `INSERT INTO PILOT (CREWID,LICENSENO,RANK,FLYINGHOURS) VALUES (:id,:ln,:rk,:fh)`,
        { id: newId, ln: licenseNo, rk: rank, fh: flyingHours||null }, { autoCommit: false }
      );
    } else {
      await conn.execute(
        `INSERT INTO CABIN_CREW (CREWID,ROLE,SERVICEYEAR,STEWARD) VALUES (:id,:ro,:sy,:st)`,
        { id: newId, ro: role, sy: serviceYear||null, st: steward||'No' }, { autoCommit: false }
      );
    }
    await conn.commit();
    res.status(201).json({ message: 'Crew created', id: newId });
  } catch (e) { if (conn) await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { fName, lName, salary, phone, experienceYear,
            licenseNo, rank, flyingHours, role, serviceYear, steward } = req.body;
    const { id } = req.params;
    conn = await db.getConnection();
    await conn.execute(
      `UPDATE CREW SET F_NAME=:fn,L_NAME=:ln,SALARY=:sal,PHONE=:ph,EXPERIENCE_YEAR=:exp WHERE CREWID=:id`,
      { fn: fName, ln: lName, sal: salary||null, ph: phone, exp: experienceYear||null, id },
      { autoCommit: false }
    );
    await conn.execute(
      `UPDATE PILOT SET LICENSENO=:ln,RANK=:rk,FLYINGHOURS=:fh WHERE CREWID=:id`,
      { ln: licenseNo, rk: rank, fh: flyingHours||null, id }, { autoCommit: false }
    );
    await conn.execute(
      `UPDATE CABIN_CREW SET ROLE=:ro,SERVICEYEAR=:sy,STEWARD=:st WHERE CREWID=:id`,
      { ro: role, sy: serviceYear||null, st: steward||'No', id }, { autoCommit: false }
    );
    await conn.commit();
    res.json({ message: 'Crew updated' });
  } catch (e) { if (conn) await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { id } = req.params;
    await conn.execute(`DELETE FROM CREW_FLIGHT WHERE CREWID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM PILOT      WHERE CREWID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM CABIN_CREW WHERE CREWID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM CREW       WHERE CREWID=:id`, [id], { autoCommit: false });
    await conn.commit();
    res.json({ message: 'Crew deleted' });
  } catch (e) { if (conn) await conn.rollback(); res.status(500).json({ error: e.message }); }
  finally { if (conn) await conn.close(); }
});

module.exports = router;
