// server.js — main Express entry point
const express = require('express');
const cors    = require('cors');
const db      = require('./db/connection');

const passengerRoutes    = require('./routes/passengers');
const flightRoutes       = require('./routes/flights');
const crewRoutes         = require('./routes/crew');
const boardingPassRoutes = require('./routes/boardingPasses');
const securityRoutes     = require('./routes/security');
const baggageRoutes      = require('./routes/baggage');
const airlineRoutes      = require('./routes/airlines');
const airportRoutes      = require('./routes/airports');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));   // serve the HTML UI

// ── API Routes ──────────────────────────────────────────────
app.use('/api/passengers',    passengerRoutes);
app.use('/api/flights',       flightRoutes);
app.use('/api/crew',          crewRoutes);
app.use('/api/boarding-passes', boardingPassRoutes);
app.use('/api/security',      securityRoutes);
app.use('/api/baggage',       baggageRoutes);
app.use('/api/airlines',      airlineRoutes);
app.use('/api/airports',      airportRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Boot ─────────────────────────────────────────────────────
(async () => {
  try {
    await db.initialize();
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
