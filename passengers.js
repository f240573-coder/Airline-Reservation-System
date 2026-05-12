// routes/passengers.js — Full CRUD for PASSENGER + subtypes
const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const oracledb = require('oracledb');

// ── READ ALL ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const result = await conn.execute(
      `SELECT p.PASSENGERID, p.F_NAME, p.L_NAME, p.PHONE, p.ADDRESS,
              p.NIC, TO_CHAR(p.DOB,'YYYY-MM-DD') AS DOB, p.GENDER, p.PASSENGERTYPE,
              bp.SEATINGNO, bp.LOUNGEACCESS, bp.EXTRABAGAGELIMIT,
              ep.MEALTYPE, ep.SEATNUMBER,
              vp.VIPLEVEL, vp.PERSONALASSISTANT, vp.PRIORITYSECURITY
       FROM PASSENGER p
       LEFT JOIN BUSINESS_PASSENGER bp ON p.PASSENGERID = bp.PASSENGERID
       LEFT JOIN ECONOMY_PASSENGER  ep ON p.PASSENGERID = ep.PASSENGERID
       LEFT JOIN VIP_PASSENGER      vp ON p.PASSENGERID = vp.PASSENGERID
       ORDER BY p.PASSENGERID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ── READ ONE ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const result = await conn.execute(
      `SELECT p.PASSENGERID, p.F_NAME, p.L_NAME, p.PHONE, p.ADDRESS,
              p.NIC, TO_CHAR(p.DOB,'YYYY-MM-DD') AS DOB, p.GENDER, p.PASSENGERTYPE,
              bp.SEATINGNO, bp.LOUNGEACCESS, bp.EXTRABAGAGELIMIT,
              ep.MEALTYPE, ep.SEATNUMBER,
              vp.VIPLEVEL, vp.PERSONALASSISTANT, vp.PRIORITYSECURITY
       FROM PASSENGER p
       LEFT JOIN BUSINESS_PASSENGER bp ON p.PASSENGERID = bp.PASSENGERID
       LEFT JOIN ECONOMY_PASSENGER  ep ON p.PASSENGERID = ep.PASSENGERID
       LEFT JOIN VIP_PASSENGER      vp ON p.PASSENGERID = vp.PASSENGERID
       WHERE p.PASSENGERID = :id`,
      [req.params.id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ── CREATE ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  let conn;
  try {
    const {
      f_name, l_name, phone, address, nic, dob, gender, passengerType,
      // Business
      loungeAccess, seatingNo, extraBaggageLimit,
      // Economy
      mealType, seatNumber,
      // VIP
      vipLevel, personalAssistant, prioritySecurity
    } = req.body;

    conn = await db.getConnection();

    // Insert parent row
    const pidResult = await conn.execute(
      `INSERT INTO PASSENGER (PASSENGERID, F_NAME, L_NAME, PHONE, ADDRESS, NIC, DOB, GENDER, PASSENGERTYPE)
       VALUES (seq_passenger.NEXTVAL, :fn, :ln, :ph, :addr, :nic,
               TO_DATE(:dob,'YYYY-MM-DD'), :gen, :ptype)
       RETURNING PASSENGERID INTO :pid`,
      {
        fn: f_name, ln: l_name, ph: phone, addr: address, nic,
        dob, gen: gender, ptype: passengerType,
        pid: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: false }
    );
    const newId = pidResult.outBinds.pid[0];

    // Insert subtype
    if (passengerType === 'Business') {
      await conn.execute(
        `INSERT INTO BUSINESS_PASSENGER VALUES (:id, :la, :sn, :eb)`,
        { id: newId, la: loungeAccess || 'Yes', sn: seatingNo, eb: extraBaggageLimit || null },
        { autoCommit: false }
      );
    } else if (passengerType === 'Economy') {
      await conn.execute(
        `INSERT INTO ECONOMY_PASSENGER VALUES (:id, :mt, :sn)`,
        { id: newId, mt: mealType, sn: seatNumber },
        { autoCommit: false }
      );
    } else if (passengerType === 'VIP') {
      await conn.execute(
        `INSERT INTO VIP_PASSENGER VALUES (:id, :vl, :pa, :ps)`,
        { id: newId, vl: vipLevel, pa: personalAssistant, ps: prioritySecurity || 'Yes' },
        { autoCommit: false }
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Passenger created', id: newId });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ── UPDATE ───────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const {
      f_name, l_name, phone, address, nic, dob, gender,
      loungeAccess, seatingNo, extraBaggageLimit,
      mealType, seatNumber,
      vipLevel, personalAssistant, prioritySecurity
    } = req.body;

    conn = await db.getConnection();

    await conn.execute(
      `UPDATE PASSENGER SET F_NAME=:fn, L_NAME=:ln, PHONE=:ph, ADDRESS=:addr,
              NIC=:nic, DOB=TO_DATE(:dob,'YYYY-MM-DD'), GENDER=:gen
       WHERE PASSENGERID=:id`,
      { fn: f_name, ln: l_name, ph: phone, addr: address, nic, dob, gen: gender, id },
      { autoCommit: false }
    );

    // Update subtype (best effort — update whichever exists)
    await conn.execute(
      `UPDATE BUSINESS_PASSENGER SET LOUNGEACCESS=:la, SEATINGNO=:sn, EXTRABAGAGELIMIT=:eb WHERE PASSENGERID=:id`,
      { la: loungeAccess, sn: seatingNo, eb: extraBaggageLimit || null, id },
      { autoCommit: false }
    );
    await conn.execute(
      `UPDATE ECONOMY_PASSENGER SET MEALTYPE=:mt, SEATNUMBER=:sn WHERE PASSENGERID=:id`,
      { mt: mealType, sn: seatNumber, id },
      { autoCommit: false }
    );
    await conn.execute(
      `UPDATE VIP_PASSENGER SET VIPLEVEL=:vl, PERSONALASSISTANT=:pa, PRIORITYSECURITY=:ps WHERE PASSENGERID=:id`,
      { vl: vipLevel, pa: personalAssistant, ps: prioritySecurity, id },
      { autoCommit: false }
    );

    await conn.commit();
    res.json({ message: 'Passenger updated' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// ── DELETE ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const { id } = req.params;

    // Delete subtypes first (FK constraint)
    await conn.execute(`DELETE FROM BUSINESS_PASSENGER WHERE PASSENGERID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM ECONOMY_PASSENGER  WHERE PASSENGERID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM VIP_PASSENGER      WHERE PASSENGERID=:id`, [id], { autoCommit: false });

    // Delete boarding passes / baggage referencing this passenger
    const bpIds = await conn.execute(
      `SELECT PASSID FROM BOARDING_PASS WHERE PASSENGERID=:id`, [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    for (const row of bpIds.rows) {
      await conn.execute(`DELETE FROM SECURITY_CHECK WHERE PASSID=:pid`, [row.PASSID], { autoCommit: false });
    }
    await conn.execute(`DELETE FROM BOARDING_PASS WHERE PASSENGERID=:id`, [id], { autoCommit: false });
    await conn.execute(`DELETE FROM BAGGAGE       WHERE PASSENGERID=:id`, [id], { autoCommit: false });

    const result = await conn.execute(
      `DELETE FROM PASSENGER WHERE PASSENGERID=:id`, [id], { autoCommit: false }
    );
    await conn.commit();
    if (!result.rowsAffected) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Passenger deleted' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
