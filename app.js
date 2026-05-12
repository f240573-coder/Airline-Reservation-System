/* ============================================================
   app.js — AeroBase Frontend Logic
   Airline Management System — Phase 2
   ============================================================ */

const API = 'http://localhost:3000/api';

/* ── UTILITY ─────────────────────────────────────────────── */

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

function toast(msg, type = 'success') {
  const el    = document.getElementById('toast');
  const dot   = document.getElementById('toastDot');
  const label = document.getElementById('toastMsg');
  label.textContent = msg;
  dot.className     = 'toast-dot ' + type;
  el.className      = 'show ' + type;
  setTimeout(() => { el.className = ''; }, 3000);
}

function badge(text, cls = 'blue') {
  return `<span class="badge badge-${cls}">${text}</span>`;
}

function typeBadge(text) {
  const map = {
    Business: 'amber', Economy: 'blue',  VIP: 'purple',
    Pilot: 'amber',    CabinCrew: 'blue',
    Scheduled: 'blue', Boarding: 'green', Departed: 'green',
    Arrived: 'green',  Cancelled: 'red',  Delayed: 'amber',
    Cleared: 'green',  'Not Cleared': 'red',
    Hand: 'blue',      Checked: 'amber',
    Active: 'green',   Inactive: 'red',   Maintenance: 'amber',
  };
  return badge(text, map[text] || 'blue');
}

function monoCell(text) {
  return `<span class="mono">${text ?? '-'}</span>`;
}

function filterTable(tbodyId, query) {
  const rows = document.getElementById(tbodyId)?.querySelectorAll('tr');
  if (!rows) return;
  const q = query.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ── MODAL ───────────────────────────────────────────────── */

function openModal(title, bodyHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHtml;
  document.getElementById('overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('overlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

/* ── NAVIGATION ──────────────────────────────────────────── */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    renderSection(this.dataset.section);
  });
});

async function renderSection(name) {
  const main = document.getElementById('mainContent');
  main.innerHTML = '<div class="empty"><div class="e-icon">⏳</div>Loading...</div>';

  try {
    if (name === 'dashboard') { await renderDashboard(); return; }

    const endpointMap = {
      passengers: '/passengers',
      flights:    '/flights',
      crew:       '/crew',
      boarding:   '/boarding-passes',
      security:   '/security',
      baggage:    '/baggage',
      airlines:   '/airlines',
      airports:   '/airports',
    };

    const data = await apiFetch(endpointMap[name]);

    const rendererMap = {
      passengers: renderPassengers,
      flights:    renderFlights,
      crew:       renderCrew,
      boarding:   renderBoarding,
      security:   renderSecurity,
      baggage:    renderBaggage,
      airlines:   renderAirlines,
      airports:   renderAirports,
    };

    rendererMap[name](data);
  } catch (err) {
    main.innerHTML = `
      <div class="empty">
        <div class="e-icon">❌</div>
        <p>${err.message}</p>
        <p style="margin-top:8px;font-size:12px">Is the backend running? → <code>node server.js</code></p>
      </div>`;
  }
}

/* ── DASHBOARD ───────────────────────────────────────────── */

async function renderDashboard() {
  const main = document.getElementById('mainContent');
  try {
    const [pax, flights, crew, boarding, security, baggage, airlines, airports] =
      await Promise.all([
        apiFetch('/passengers'),
        apiFetch('/flights'),
        apiFetch('/crew'),
        apiFetch('/boarding-passes'),
        apiFetch('/security'),
        apiFetch('/baggage'),
        apiFetch('/airlines'),
        apiFetch('/airports'),
      ]);

    main.innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <p class="page-sub">// Overview of all entities in the airline database</p>

      <div class="dash-grid">
        ${dashCard('🧳', 'Passengers',     pax.length,      'passengers')}
        ${dashCard('✈️', 'Flights',         flights.length,  'flights')}
        ${dashCard('👨‍✈️','Crew Members',    crew.length,     'crew')}
        ${dashCard('🎫', 'Boarding Passes', boarding.length, 'boarding')}
        ${dashCard('🔒', 'Security Checks', security.length, 'security')}
        ${dashCard('📦', 'Baggage',         baggage.length,  'baggage')}
        ${dashCard('🏢', 'Airlines',        airlines.length, 'airlines')}
        ${dashCard('🌍', 'Airports',        airports.length, 'airports')}
      </div>

      <div class="dash-two-col">
        <div>
          <div class="section-bar"><h2>Recent Flights</h2></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Route</th><th>Status</th><th>Departure</th></tr></thead>
              <tbody>
                ${flights.slice(0, 5).map(f => `
                  <tr>
                    <td>${f.SOURCE} → ${f.DESTINATION}</td>
                    <td>${typeBadge(f.STATUS)}</td>
                    <td>${monoCell(f.DEPARTURETIME)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div class="section-bar"><h2>Recent Passengers</h2></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>Phone</th></tr></thead>
              <tbody>
                ${pax.slice(0, 5).map(p => `
                  <tr>
                    <td>${p.F_NAME} ${p.L_NAME}</td>
                    <td>${typeBadge(p.PASSENGERTYPE)}</td>
                    <td>${monoCell(p.PHONE)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

  } catch (err) {
    main.innerHTML = `
      <div class="empty">
        <div class="e-icon">❌</div>
        <p>Could not load dashboard: ${err.message}</p>
        <p style="margin-top:8px;font-size:12px">Make sure backend is running → <code>cd backend &amp;&amp; node server.js</code></p>
      </div>`;
  }
}

function dashCard(icon, label, num, section) {
  return `
    <div class="dash-card" onclick="navTo('${section}')">
      <div class="dc-icon">${icon}</div>
      <div class="dc-num">${num}</div>
      <div class="dc-label">${label}</div>
    </div>`;
}

function navTo(section) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });
  renderSection(section);
}

/* ── PASSENGERS ──────────────────────────────────────────── */

function renderPassengers(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Passengers</h1>
    <p class="page-sub">// CRUD — Business · Economy · VIP specialisation</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search passengers..."
             oninput="filterTable('pax-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openPassengerForm()">+ Add Passenger</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Type</th><th>NIC</th>
            <th>Phone</th><th>Gender</th><th>DOB</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="pax-tbody">
          ${data.map(p => `
            <tr>
              <td>${monoCell(p.PASSENGERID)}</td>
              <td><strong>${p.F_NAME} ${p.L_NAME}</strong></td>
              <td>${typeBadge(p.PASSENGERTYPE)}</td>
              <td>${monoCell(p.NIC)}</td>
              <td>${p.PHONE ?? '-'}</td>
              <td>${p.GENDER ?? '-'}</td>
              <td>${monoCell(p.DOB)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openPassengerForm(${JSON.stringify(p)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deletePassenger(${p.PASSENGERID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function subtypeFields(type, p = null) {
  if (type === 'Business') return `
    <div class="subtype-section">
      <h4>Business Passenger Details</h4>
      <div class="form-grid">
        <div>
          <label>Seating No</label>
          <input id="f_seatno" value="${p?.SEATINGNO ?? ''}"/>
        </div>
        <div>
          <label>Extra Baggage Limit (kg)</label>
          <input type="number" id="f_ebl" value="${p?.EXTRABAGAGELIMIT ?? ''}"/>
        </div>
        <div>
          <label>Lounge Access</label>
          <select id="f_la">
            <option ${p?.LOUNGEACCESS === 'Yes' ? 'selected' : ''}>Yes</option>
            <option ${p?.LOUNGEACCESS === 'No'  ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>
    </div>`;

  if (type === 'Economy') return `
    <div class="subtype-section">
      <h4>Economy Passenger Details</h4>
      <div class="form-grid">
        <div>
          <label>Meal Type</label>
          <input id="f_meal" value="${p?.MEALTYPE ?? ''}"/>
        </div>
        <div>
          <label>Seat Number</label>
          <input id="f_eseat" value="${p?.SEATNUMBER ?? ''}"/>
        </div>
      </div>
    </div>`;

  return `
    <div class="subtype-section">
      <h4>VIP Passenger Details</h4>
      <div class="form-grid">
        <div>
          <label>VIP Level</label>
          <input id="f_viplvl" value="${p?.VIPLEVEL ?? ''}"/>
        </div>
        <div>
          <label>Personal Assistant</label>
          <input id="f_pa" value="${p?.PERSONALASSISTANT ?? ''}"/>
        </div>
        <div>
          <label>Priority Security</label>
          <select id="f_ps">
            <option ${p?.PRIORITYSECURITY === 'Yes' ? 'selected' : ''}>Yes</option>
            <option ${p?.PRIORITYSECURITY === 'No'  ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>
    </div>`;
}

function openPassengerForm(p = null) {
  const isEdit = !!p;
  const type   = p?.PASSENGERTYPE ?? 'Business';

  openModal(isEdit ? 'Edit Passenger' : 'Add Passenger', `
    <div class="form-grid">
      <div><label>First Name</label><input id="f_fn" value="${p?.F_NAME ?? ''}"/></div>
      <div><label>Last Name</label> <input id="f_ln" value="${p?.L_NAME ?? ''}"/></div>
      <div><label>Phone</label>     <input id="f_ph" value="${p?.PHONE  ?? ''}"/></div>
      <div><label>NIC</label>       <input id="f_nic" value="${p?.NIC   ?? ''}"/></div>
      <div>
        <label>Gender</label>
        <select id="f_gen">
          <option ${p?.GENDER === 'Male'   ? 'selected' : ''}>Male</option>
          <option ${p?.GENDER === 'Female' ? 'selected' : ''}>Female</option>
          <option ${p?.GENDER === 'Other'  ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div>
        <label>Date of Birth</label>
        <input type="date" id="f_dob" value="${p?.DOB ?? ''}"/>
      </div>
      <div class="full">
        <label>Address</label>
        <input id="f_addr" value="${p?.ADDRESS ?? ''}"/>
      </div>
      <div class="full">
        <label>Passenger Type</label>
        <select id="f_ptype" onchange="refreshSubtype()" ${isEdit ? 'disabled' : ''}>
          <option ${type === 'Business' ? 'selected' : ''}>Business</option>
          <option ${type === 'Economy'  ? 'selected' : ''}>Economy</option>
          <option ${type === 'VIP'      ? 'selected' : ''}>VIP</option>
        </select>
      </div>
    </div>
    <div id="subtypeSection">${subtypeFields(type, p)}</div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${isEdit ? `savePassenger(${p.PASSENGERID})` : 'createPassenger()'}">
        ${isEdit ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

function refreshSubtype() {
  const type = document.getElementById('f_ptype').value;
  document.getElementById('subtypeSection').innerHTML = subtypeFields(type);
}

function gatherPassenger() {
  const type = document.getElementById('f_ptype').value;
  const data = {
    f_name:        document.getElementById('f_fn').value,
    l_name:        document.getElementById('f_ln').value,
    phone:         document.getElementById('f_ph').value,
    nic:           document.getElementById('f_nic').value,
    gender:        document.getElementById('f_gen').value,
    dob:           document.getElementById('f_dob').value,
    address:       document.getElementById('f_addr').value,
    passengerType: type,
  };
  if (type === 'Business') {
    data.seatingNo         = document.getElementById('f_seatno')?.value ?? '';
    data.extraBaggageLimit = document.getElementById('f_ebl')?.value    ?? null;
    data.loungeAccess      = document.getElementById('f_la')?.value     ?? 'Yes';
  } else if (type === 'Economy') {
    data.mealType   = document.getElementById('f_meal')?.value  ?? '';
    data.seatNumber = document.getElementById('f_eseat')?.value ?? '';
  } else {
    data.vipLevel          = document.getElementById('f_viplvl')?.value ?? '';
    data.personalAssistant = document.getElementById('f_pa')?.value     ?? '';
    data.prioritySecurity  = document.getElementById('f_ps')?.value     ?? 'Yes';
  }
  return data;
}

async function createPassenger() {
  try {
    await apiFetch('/passengers', { method: 'POST', body: JSON.stringify(gatherPassenger()) });
    toast('Passenger created!');
    closeModal();
    renderSection('passengers');
  } catch (e) { toast(e.message, 'error'); }
}

async function savePassenger(id) {
  try {
    await apiFetch('/passengers/' + id, { method: 'PUT', body: JSON.stringify(gatherPassenger()) });
    toast('Passenger updated!');
    closeModal();
    renderSection('passengers');
  } catch (e) { toast(e.message, 'error'); }
}

async function deletePassenger(id) {
  if (!confirm('Delete this passenger and all related records?')) return;
  try {
    await apiFetch('/passengers/' + id, { method: 'DELETE' });
    toast('Passenger deleted!');
    renderSection('passengers');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── FLIGHTS ─────────────────────────────────────────────── */

function renderFlights(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Flights</h1>
    <p class="page-sub">// Schedule · Status · Gate Assignment</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search flights..."
             oninput="filterTable('fl-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openFlightForm()">+ Add Flight</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Route</th><th>Airline</th><th>Gate</th>
            <th>Departure</th><th>Arrival</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="fl-tbody">
          ${data.map(f => `
            <tr>
              <td>${monoCell(f.FLIGHTID)}</td>
              <td><strong>${f.SOURCE} → ${f.DESTINATION}</strong></td>
              <td>${f.AIRLINE ?? '-'}</td>
              <td>${f.GATENO ?? '-'}</td>
              <td>${monoCell(f.DEPARTURETIME)}</td>
              <td>${monoCell(f.ARRIVALTIME)}</td>
              <td>${typeBadge(f.STATUS)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openFlightForm(${JSON.stringify(f)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteFlight(${f.FLIGHTID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

const FLIGHT_STATUSES = ['Scheduled','Boarding','Departed','Arrived','Cancelled','Delayed'];

function openFlightForm(f = null) {
  openModal(f ? 'Edit Flight' : 'Add Flight', `
    <div class="form-grid">
      <div><label>Source</label>     <input id="ff_src" value="${f?.SOURCE ?? ''}"/></div>
      <div><label>Destination</label><input id="ff_dst" value="${f?.DESTINATION ?? ''}"/></div>
      <div>
        <label>Departure (YYYY-MM-DD HH:MM)</label>
        <input id="ff_dep" value="${f?.DEPARTURETIME ?? ''}" placeholder="2025-06-01 08:00"/>
      </div>
      <div>
        <label>Arrival (YYYY-MM-DD HH:MM)</label>
        <input id="ff_arr" value="${f?.ARRIVALTIME ?? ''}" placeholder="2025-06-01 11:00"/>
      </div>
      <div><label>Gate ID</label>   <input type="number" id="ff_gid" value="${f?.GATEID ?? ''}"/></div>
      <div><label>Airline ID</label><input type="number" id="ff_aid" value="${f?.AIRLINEID ?? ''}"/></div>
      <div class="full">
        <label>Status</label>
        <select id="ff_sts">
          ${FLIGHT_STATUSES.map(s =>
            `<option ${f?.STATUS === s ? 'selected' : ''}>${s}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${f ? `saveFlight(${f.FLIGHTID})` : 'createFlight()'}">
        ${f ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

function gatherFlight() {
  return {
    source:        document.getElementById('ff_src').value,
    destination:   document.getElementById('ff_dst').value,
    departureTime: document.getElementById('ff_dep').value,
    arrivalTime:   document.getElementById('ff_arr').value,
    gateId:        document.getElementById('ff_gid').value    || null,
    airlineId:     document.getElementById('ff_aid').value    || null,
    status:        document.getElementById('ff_sts').value,
  };
}

async function createFlight() {
  try {
    await apiFetch('/flights', { method: 'POST', body: JSON.stringify(gatherFlight()) });
    toast('Flight created!'); closeModal(); renderSection('flights');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveFlight(id) {
  try {
    await apiFetch('/flights/' + id, { method: 'PUT', body: JSON.stringify(gatherFlight()) });
    toast('Flight updated!'); closeModal(); renderSection('flights');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteFlight(id) {
  if (!confirm('Delete this flight and related boarding passes?')) return;
  try {
    await apiFetch('/flights/' + id, { method: 'DELETE' });
    toast('Flight deleted!'); renderSection('flights');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── CREW ────────────────────────────────────────────────── */

function renderCrew(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Crew</h1>
    <p class="page-sub">// Pilot · Cabin Crew specialisation</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search crew..."
             oninput="filterTable('cr-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openCrewForm()">+ Add Crew</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Type</th><th>Phone</th>
            <th>Salary (PKR)</th><th>Exp. Yrs</th><th>Subtype Info</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="cr-tbody">
          ${data.map(c => `
            <tr>
              <td>${monoCell(c.CREWID)}</td>
              <td><strong>${c.F_NAME} ${c.L_NAME}</strong></td>
              <td>${typeBadge(c.CREWTYPE)}</td>
              <td>${c.PHONE ?? '-'}</td>
              <td class="mono">${Number(c.SALARY ?? 0).toLocaleString()}</td>
              <td>${c.EXPERIENCE_YEAR ?? '-'}</td>
              <td style="font-size:12px;color:var(--muted)">
                ${c.CREWTYPE === 'Pilot'
                  ? `Lic: ${c.LICENSENO ?? '-'} | ${c.RANK ?? '-'} | ${c.FLYINGHOURS ?? 0}h`
                  : `Role: ${c.ROLE ?? '-'} | ${c.SERVICEYEAR ?? 0}yr | Steward: ${c.STEWARD ?? '-'}`}
              </td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openCrewForm(${JSON.stringify(c)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteCrew(${c.CREWID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function crewSubtypeFields(type, c = null) {
  if (type === 'Pilot') return `
    <div class="subtype-section">
      <h4>Pilot Details</h4>
      <div class="form-grid">
        <div><label>License No</label>   <input id="cf_lic"  value="${c?.LICENSENO   ?? ''}"/></div>
        <div><label>Rank</label>         <input id="cf_rank" value="${c?.RANK        ?? ''}"/></div>
        <div><label>Flying Hours</label> <input type="number" id="cf_fh" value="${c?.FLYINGHOURS ?? ''}"/></div>
      </div>
    </div>`;
  return `
    <div class="subtype-section">
      <h4>Cabin Crew Details</h4>
      <div class="form-grid">
        <div><label>Role</label>          <input id="cf_role" value="${c?.ROLE ?? ''}"/></div>
        <div><label>Service Years</label> <input type="number" id="cf_sy" value="${c?.SERVICEYEAR ?? ''}"/></div>
        <div>
          <label>Steward?</label>
          <select id="cf_stew">
            <option ${c?.STEWARD === 'Yes' ? 'selected' : ''}>Yes</option>
            <option ${c?.STEWARD !== 'Yes' ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>
    </div>`;
}

function openCrewForm(c = null) {
  const isPilot = (c?.CREWTYPE ?? 'Pilot') === 'Pilot';
  openModal(c ? 'Edit Crew Member' : 'Add Crew Member', `
    <div class="form-grid">
      <div><label>First Name</label>    <input id="cf_fn"  value="${c?.F_NAME ?? ''}"/></div>
      <div><label>Last Name</label>     <input id="cf_ln"  value="${c?.L_NAME ?? ''}"/></div>
      <div><label>Phone</label>         <input id="cf_ph"  value="${c?.PHONE  ?? ''}"/></div>
      <div><label>Salary (PKR)</label>  <input type="number" id="cf_sal" value="${c?.SALARY ?? ''}"/></div>
      <div><label>Experience Years</label><input type="number" id="cf_exp" value="${c?.EXPERIENCE_YEAR ?? ''}"/></div>
      <div>
        <label>Crew Type</label>
        <select id="cf_ct" onchange="refreshCrewSubtype()" ${c ? 'disabled' : ''}>
          <option ${isPilot  ? 'selected' : ''}>Pilot</option>
          <option ${!isPilot ? 'selected' : ''}>CabinCrew</option>
        </select>
      </div>
    </div>
    <div id="crewSubtype">${crewSubtypeFields(c?.CREWTYPE ?? 'Pilot', c)}</div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${c ? `saveCrew(${c.CREWID})` : 'createCrew()'}">
        ${c ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

function refreshCrewSubtype() {
  const type = document.getElementById('cf_ct').value;
  document.getElementById('crewSubtype').innerHTML = crewSubtypeFields(type);
}

function gatherCrew() {
  const type = document.getElementById('cf_ct').value;
  return {
    fName:          document.getElementById('cf_fn').value,
    lName:          document.getElementById('cf_ln').value,
    phone:          document.getElementById('cf_ph').value,
    salary:         document.getElementById('cf_sal').value  || null,
    experienceYear: document.getElementById('cf_exp').value  || null,
    crewType:       type,
    licenseNo:      document.getElementById('cf_lic')?.value  ?? '',
    rank:           document.getElementById('cf_rank')?.value ?? '',
    flyingHours:    document.getElementById('cf_fh')?.value   || null,
    role:           document.getElementById('cf_role')?.value ?? '',
    serviceYear:    document.getElementById('cf_sy')?.value   || null,
    steward:        document.getElementById('cf_stew')?.value ?? 'No',
  };
}

async function createCrew() {
  try {
    await apiFetch('/crew', { method: 'POST', body: JSON.stringify(gatherCrew()) });
    toast('Crew added!'); closeModal(); renderSection('crew');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveCrew(id) {
  try {
    await apiFetch('/crew/' + id, { method: 'PUT', body: JSON.stringify(gatherCrew()) });
    toast('Crew updated!'); closeModal(); renderSection('crew');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteCrew(id) {
  if (!confirm('Delete this crew member?')) return;
  try {
    await apiFetch('/crew/' + id, { method: 'DELETE' });
    toast('Crew deleted!'); renderSection('crew');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── BOARDING PASSES ─────────────────────────────────────── */

function renderBoarding(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Boarding Passes</h1>
    <p class="page-sub">// Passenger check-in records</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search..."
             oninput="filterTable('bp-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openBoardingForm()">+ Add Boarding Pass</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pass ID</th><th>Passenger</th><th>Flight</th>
            <th>Seat</th><th>Gate</th><th>Group</th><th>Boarding Time</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="bp-tbody">
          ${data.map(b => `
            <tr>
              <td>${monoCell(b.PASSID)}</td>
              <td>${b.PASSENGER_NAME}</td>
              <td style="font-size:12px">${b.FLIGHT_ROUTE ?? b.FLIGHTID}</td>
              <td>${b.SEATNO ?? '-'}</td>
              <td>${b.GATENO ?? '-'}</td>
              <td>${b.BOARDINGGROUP ?? '-'}</td>
              <td>${monoCell(b.BOARDINGTIME)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openBoardingForm(${JSON.stringify(b)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteBoarding(${b.PASSID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openBoardingForm(b = null) {
  const isEdit = !!b;
  openModal(isEdit ? 'Edit Boarding Pass' : 'New Boarding Pass', `
    <div class="form-grid">
      ${!isEdit ? `
        <div><label>Passenger ID</label><input type="number" id="bpf_pid"/></div>
        <div><label>Flight ID</label>   <input type="number" id="bpf_fid"/></div>
        <div><label>Terminal ID</label> <input type="number" id="bpf_tid"/></div>` : ''}
      <div><label>Seat No</label>     <input id="bpf_sn" value="${b?.SEATNO ?? ''}"/></div>
      <div><label>Gate No</label>     <input id="bpf_gn" value="${b?.GATENO ?? ''}"/></div>
      <div><label>Boarding Group</label><input id="bpf_bg" value="${b?.BOARDINGGROUP ?? ''}"/></div>
      <div class="full">
        <label>Boarding Time (YYYY-MM-DD HH:MM)</label>
        <input id="bpf_bt" value="${b?.BOARDINGTIME ?? ''}" placeholder="2025-06-01 07:30"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${isEdit ? `saveBoarding(${b.PASSID})` : 'createBoarding()'}">
        ${isEdit ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

async function createBoarding() {
  try {
    await apiFetch('/boarding-passes', {
      method: 'POST',
      body: JSON.stringify({
        passengerId:   document.getElementById('bpf_pid').value,
        flightId:      document.getElementById('bpf_fid').value,
        terminalId:    document.getElementById('bpf_tid').value || null,
        seatNo:        document.getElementById('bpf_sn').value,
        gateNo:        document.getElementById('bpf_gn').value,
        boardingGroup: document.getElementById('bpf_bg').value,
        boardingTime:  document.getElementById('bpf_bt').value,
      }),
    });
    toast('Boarding pass created!'); closeModal(); renderSection('boarding');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveBoarding(id) {
  try {
    await apiFetch('/boarding-passes/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        seatNo:        document.getElementById('bpf_sn').value,
        gateNo:        document.getElementById('bpf_gn').value,
        boardingGroup: document.getElementById('bpf_bg').value,
        boardingTime:  document.getElementById('bpf_bt').value,
      }),
    });
    toast('Updated!'); closeModal(); renderSection('boarding');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteBoarding(id) {
  if (!confirm('Delete boarding pass and its security check?')) return;
  try {
    await apiFetch('/boarding-passes/' + id, { method: 'DELETE' });
    toast('Deleted!'); renderSection('boarding');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── SECURITY CHECKS ─────────────────────────────────────── */

function renderSecurity(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Security Checks</h1>
    <p class="page-sub">// Cleared · Not Cleared status tracking</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search..."
             oninput="filterTable('sc-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openSecurityForm()">+ Add Check</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Check ID</th><th>Pass ID</th><th>Passenger</th>
            <th>Officer</th><th>Check Time</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="sc-tbody">
          ${data.map(s => `
            <tr>
              <td>${monoCell(s.CHECKID)}</td>
              <td>${monoCell(s.PASSID)}</td>
              <td>${s.PASSENGER_NAME}</td>
              <td>${s.SECURITYOFFICERNAME ?? '-'}</td>
              <td>${monoCell(s.CHECKTIME)}</td>
              <td>${typeBadge(s.STATUS)}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openSecurityForm(${JSON.stringify(s)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteSecurity(${s.CHECKID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openSecurityForm(s = null) {
  const isEdit = !!s;
  openModal(isEdit ? 'Edit Security Check' : 'Add Security Check', `
    <div class="form-grid">
      ${!isEdit ? `
        <div class="full">
          <label>Boarding Pass ID</label>
          <input type="number" id="scf_pid"/>
        </div>` : ''}
      <div>
        <label>Officer Name</label>
        <input id="scf_on" value="${s?.SECURITYOFFICERNAME ?? ''}"/>
      </div>
      <div>
        <label>Status</label>
        <select id="scf_sts">
          <option ${s?.STATUS === 'Cleared'     ? 'selected' : ''}>Cleared</option>
          <option ${s?.STATUS === 'Not Cleared' ? 'selected' : ''}>Not Cleared</option>
        </select>
      </div>
      <div class="full">
        <label>Check Time (YYYY-MM-DD HH:MM)</label>
        <input id="scf_ct" value="${s?.CHECKTIME ?? ''}" placeholder="2025-06-01 07:00"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${isEdit ? `saveSecurity(${s.CHECKID})` : 'createSecurity()'}">
        ${isEdit ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

async function createSecurity() {
  try {
    await apiFetch('/security', {
      method: 'POST',
      body: JSON.stringify({
        passId:              document.getElementById('scf_pid').value,
        securityOfficerName: document.getElementById('scf_on').value,
        status:              document.getElementById('scf_sts').value,
        checkTime:           document.getElementById('scf_ct').value,
      }),
    });
    toast('Security check added!'); closeModal(); renderSection('security');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveSecurity(id) {
  try {
    await apiFetch('/security/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        status:              document.getElementById('scf_sts').value,
        securityOfficerName: document.getElementById('scf_on').value,
      }),
    });
    toast('Updated!'); closeModal(); renderSection('security');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteSecurity(id) {
  if (!confirm('Delete this security check?')) return;
  try {
    await apiFetch('/security/' + id, { method: 'DELETE' });
    toast('Deleted!'); renderSection('security');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── BAGGAGE ─────────────────────────────────────────────── */

function renderBaggage(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Baggage</h1>
    <p class="page-sub">// Hand · Checked — weight tracking</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search..."
             oninput="filterTable('bg-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openBaggageForm()">+ Add Baggage</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Passenger</th><th>Airline</th>
            <th>Tag No</th><th>Type</th><th>Weight (kg)</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="bg-tbody">
          ${data.map(b => `
            <tr>
              <td>${monoCell(b.BAGGAGEID)}</td>
              <td>${b.PASSENGER_NAME}</td>
              <td>${b.AIRLINE_NAME ?? '-'}</td>
              <td class="mono">${b.TAGNO ?? '-'}</td>
              <td>${typeBadge(b.TYPE)}</td>
              <td>${b.WEIGHT ?? '-'}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openBaggageForm(${JSON.stringify(b)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteBaggage(${b.BAGGAGEID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openBaggageForm(b = null) {
  const isEdit = !!b;
  openModal(isEdit ? 'Edit Baggage' : 'Add Baggage', `
    <div class="form-grid">
      ${!isEdit ? `
        <div><label>Passenger ID</label><input type="number" id="bgf_pid"/></div>
        <div><label>Airline ID</label>  <input type="number" id="bgf_aid"/></div>` : ''}
      <div><label>Tag No</label><input id="bgf_tn" value="${b?.TAGNO ?? ''}"/></div>
      <div>
        <label>Type</label>
        <select id="bgf_tp">
          <option ${b?.TYPE === 'Hand'    ? 'selected' : ''}>Hand</option>
          <option ${b?.TYPE === 'Checked' ? 'selected' : ''}>Checked</option>
        </select>
      </div>
      <div>
        <label>Weight (kg)</label>
        <input type="number" step="0.1" id="bgf_wt" value="${b?.WEIGHT ?? ''}"/>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${isEdit ? `saveBaggage(${b.BAGGAGEID})` : 'createBaggage()'}">
        ${isEdit ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

async function createBaggage() {
  try {
    await apiFetch('/baggage', {
      method: 'POST',
      body: JSON.stringify({
        passengerId: document.getElementById('bgf_pid').value,
        airlineId:   document.getElementById('bgf_aid').value || null,
        tagNo:       document.getElementById('bgf_tn').value,
        type:        document.getElementById('bgf_tp').value,
        weight:      document.getElementById('bgf_wt').value  || null,
      }),
    });
    toast('Baggage added!'); closeModal(); renderSection('baggage');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveBaggage(id) {
  try {
    await apiFetch('/baggage/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        tagNo:  document.getElementById('bgf_tn').value,
        type:   document.getElementById('bgf_tp').value,
        weight: document.getElementById('bgf_wt').value || null,
      }),
    });
    toast('Updated!'); closeModal(); renderSection('baggage');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteBaggage(id) {
  if (!confirm('Delete this baggage record?')) return;
  try {
    await apiFetch('/baggage/' + id, { method: 'DELETE' });
    toast('Deleted!'); renderSection('baggage');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── AIRLINES ────────────────────────────────────────────── */

function renderAirlines(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Airlines</h1>
    <p class="page-sub">// Registered airlines in the system</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search..."
             oninput="filterTable('al-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openAirlineForm()">+ Add Airline</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Country</th><th>Contact</th><th>Actions</th></tr></thead>
        <tbody id="al-tbody">
          ${data.map(a => `
            <tr>
              <td>${monoCell(a.AIRLINEID)}</td>
              <td><strong>${a.NAME}</strong></td>
              <td>${a.COUNTRY ?? '-'}</td>
              <td>${a.CONTACTNO ?? '-'}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openAirlineForm(${JSON.stringify(a)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteAirline(${a.AIRLINEID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openAirlineForm(a = null) {
  openModal(a ? 'Edit Airline' : 'Add Airline', `
    <div class="form-grid">
      <div class="full"><label>Name</label>      <input id="alf_n"  value="${a?.NAME      ?? ''}"/></div>
      <div><label>Country</label>    <input id="alf_co" value="${a?.COUNTRY   ?? ''}"/></div>
      <div><label>Contact No</label> <input id="alf_cn" value="${a?.CONTACTNO ?? ''}"/></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${a ? `saveAirline(${a.AIRLINEID})` : 'createAirline()'}">
        ${a ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

async function createAirline() {
  try {
    await apiFetch('/airlines', {
      method: 'POST',
      body: JSON.stringify({
        name:      document.getElementById('alf_n').value,
        country:   document.getElementById('alf_co').value,
        contactNo: document.getElementById('alf_cn').value,
      }),
    });
    toast('Airline created!'); closeModal(); renderSection('airlines');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveAirline(id) {
  try {
    await apiFetch('/airlines/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        name:      document.getElementById('alf_n').value,
        country:   document.getElementById('alf_co').value,
        contactNo: document.getElementById('alf_cn').value,
      }),
    });
    toast('Updated!'); closeModal(); renderSection('airlines');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteAirline(id) {
  if (!confirm('Delete this airline?')) return;
  try {
    await apiFetch('/airlines/' + id, { method: 'DELETE' });
    toast('Deleted!'); renderSection('airlines');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── AIRPORTS ────────────────────────────────────────────── */

function renderAirports(data) {
  document.getElementById('mainContent').innerHTML = `
    <h1 class="page-title">Airports</h1>
    <p class="page-sub">// Airport directory</p>
    <div class="section-bar">
      <input class="search-box" placeholder="🔍  Search..."
             oninput="filterTable('ap-tbody', this.value)"/>
      <div class="ml-auto"></div>
      <button class="btn btn-accent" onclick="openAirportForm()">+ Add Airport</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>City</th><th>Country</th><th>Contact</th><th>Actions</th></tr>
        </thead>
        <tbody id="ap-tbody">
          ${data.map(a => `
            <tr>
              <td>${monoCell(a.AIRPORTID)}</td>
              <td><strong>${a.NAME}</strong></td>
              <td>${a.CITY    ?? '-'}</td>
              <td>${a.COUNTRY ?? '-'}</td>
              <td>${a.CONTACTNO ?? '-'}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-edit"
                    onclick='openAirportForm(${JSON.stringify(a)})'>Edit</button>
                  <button class="btn btn-danger"
                    onclick="deleteAirport(${a.AIRPORTID})">Delete</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function openAirportForm(a = null) {
  openModal(a ? 'Edit Airport' : 'Add Airport', `
    <div class="form-grid">
      <div class="full"><label>Name</label>      <input id="apf_n"  value="${a?.NAME      ?? ''}"/></div>
      <div><label>City</label>       <input id="apf_ci" value="${a?.CITY      ?? ''}"/></div>
      <div><label>Country</label>    <input id="apf_co" value="${a?.COUNTRY   ?? ''}"/></div>
      <div><label>Contact No</label> <input id="apf_cn" value="${a?.CONTACTNO ?? ''}"/></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-accent"
        onclick="${a ? `saveAirport(${a.AIRPORTID})` : 'createAirport()'}">
        ${a ? 'Save Changes' : 'Create'}
      </button>
    </div>`);
}

async function createAirport() {
  try {
    await apiFetch('/airports', {
      method: 'POST',
      body: JSON.stringify({
        name:      document.getElementById('apf_n').value,
        city:      document.getElementById('apf_ci').value,
        country:   document.getElementById('apf_co').value,
        contactNo: document.getElementById('apf_cn').value,
      }),
    });
    toast('Airport created!'); closeModal(); renderSection('airports');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveAirport(id) {
  try {
    await apiFetch('/airports/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        name:      document.getElementById('apf_n').value,
        city:      document.getElementById('apf_ci').value,
        country:   document.getElementById('apf_co').value,
        contactNo: document.getElementById('apf_cn').value,
      }),
    });
    toast('Updated!'); closeModal(); renderSection('airports');
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteAirport(id) {
  if (!confirm('Delete this airport?')) return;
  try {
    await apiFetch('/airports/' + id, { method: 'DELETE' });
    toast('Deleted!'); renderSection('airports');
  } catch (e) { toast(e.message, 'error'); }
}

/* ── CONNECTION CHECK ────────────────────────────────────── */

async function checkConnection() {
  try {
    await fetch(API + '/health');
    document.getElementById('statusDot').classList.add('connected');
    document.getElementById('statusLabel').textContent = 'Connected';
  } catch {
    document.getElementById('statusDot').classList.remove('connected');
    document.getElementById('statusLabel').textContent = 'Disconnected — start backend';
  }
}

/* ── INIT ────────────────────────────────────────────────── */
checkConnection();
renderSection('dashboard');
