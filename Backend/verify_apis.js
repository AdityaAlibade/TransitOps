const { spawn } = require('child_process');
const path = require('path');

// Base URL for the API
const BASE_URL = 'http://localhost:5000';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // 1. Check health route
  console.log('Testing Health Endpoint...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health response:', healthData);
  if (healthData.status !== 'nominal') {
    throw new Error('Health check failed');
  }

  // 2. Test User Login
  console.log('\nTesting Auth Login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'manager@transitops.com',
      password: 'manager123'
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.data?.token) {
    throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.token;
  console.log('Login successful. Token acquired.');

  const authHeader = { 'Authorization': `Bearer ${token}` };
  const jsonHeaders = { 'Content-Type': 'application/json', ...authHeader };

  // 3. Test GET Me
  console.log('\nTesting Auth Me...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: authHeader });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.data?.email !== 'manager@transitops.com') {
    throw new Error(`GET /me failed: ${JSON.stringify(meData)}`);
  }
  console.log('Auth Me validated:', meData.data.name);

  // 4. Test Vehicles Get with filters
  console.log('\nTesting Vehicles retrieval...');
  const vehiclesRes = await fetch(`${BASE_URL}/api/vehicles?status=Available`, { headers: authHeader });
  const vehiclesData = await vehiclesRes.json();
  if (vehiclesRes.status !== 200 || !Array.isArray(vehiclesData.data)) {
    throw new Error('Failed to retrieve vehicles');
  }
  console.log(`Found ${vehiclesData.data.length} Available vehicles.`);

  // Find Tata Prima (id should be seeded, let's find by registration MH-12-PQ-1234)
  const tata = vehiclesData.data.find(v => v.registration_number === 'MH-12-PQ-1234');
  if (!tata) throw new Error('Tata Prima vehicle not found in seeded data');
  console.log('Tata Prima vehicle ID:', tata.id);

  // Find Hero Splender
  const splender = vehiclesData.data.find(v => v.registration_number === 'MH-12-TU-9012');
  if (!splender) throw new Error('Hero Splender vehicle not found');

  // 5. Test Drivers Get with filters
  console.log('\nTesting Drivers retrieval...');
  const driversRes = await fetch(`${BASE_URL}/api/drivers?status=Available`, { headers: authHeader });
  const driversData = await driversRes.json();
  if (driversRes.status !== 200 || !Array.isArray(driversData.data)) {
    throw new Error('Failed to retrieve drivers');
  }
  console.log(`Found ${driversData.data.length} Available drivers.`);

  // Find John Driver
  const john = driversData.data.find(d => d.license_number === 'DL-12345678');
  if (!john) throw new Error('John Driver not found in seeded data');

  // Find Expired Driver (has expired license)
  const allDriversRes = await fetch(`${BASE_URL}/api/drivers`, { headers: authHeader });
  const allDriversData = await allDriversRes.json();
  const expiredDriver = allDriversData.data.find(d => d.license_number === 'DL-55556666');
  if (!expiredDriver) throw new Error('Expired Driver not found');

  // 6. Test Trip business rules
  console.log('\nTesting Trip Business Rules...');

  // Case 6a: Vehicle not found (404)
  console.log('Case 6a: Vehicle not found...');
  const badVehicleRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: 99999,
      driver_id: john.id,
      cargo_weight_kg: 500,
      planned_distance_km: 150
    })
  });
  if (badVehicleRes.status !== 404) {
    throw new Error(`Expected 404 for missing vehicle, got ${badVehicleRes.status}`);
  }
  console.log('Passed missing vehicle check.');

  // Case 6b: Vehicle not available (e.g. Mahindra Bolero which is 'On Trip' in seeds)
  console.log('Case 6b: Vehicle not available...');
  const allVehiclesRes = await fetch(`${BASE_URL}/api/vehicles`, { headers: authHeader });
  const allVehiclesData = await allVehiclesRes.json();
  const boleroVeh = allVehiclesData.data.find(v => v.registration_number === 'MH-12-RS-5678');
  if (!boleroVeh) throw new Error('Bolero Pik-up vehicle not found');

  const navVehRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: boleroVeh.id,
      driver_id: john.id,
      cargo_weight_kg: 500,
      planned_distance_km: 150
    })
  });
  const navVehData = await navVehRes.json();
  if (navVehRes.status !== 400 || navVehData.message !== 'Vehicle is not available for dispatch') {
    throw new Error(`Expected 400 with "Vehicle is not available for dispatch", got ${navVehRes.status}: ${JSON.stringify(navVehData)}`);
  }
  console.log('Passed vehicle availability check.');

  // Case 6c: Driver license expired
  console.log('Case 6c: Driver license expired...');
  const expDriverRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: tata.id,
      driver_id: expiredDriver.id,
      cargo_weight_kg: 500,
      planned_distance_km: 150
    })
  });
  const expDriverData = await expDriverRes.json();
  if (expDriverRes.status !== 400 || expDriverData.message !== 'Driver license has expired and cannot be assigned to a trip') {
    throw new Error(`Expected 400 for expired license, got ${expDriverRes.status}: ${JSON.stringify(expDriverData)}`);
  }
  console.log('Passed expired driver license check.');

  // Case 6d: Cargo weight exceeds capacity
  console.log('Case 6d: Cargo weight exceeds vehicle capacity...');
  const weightRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: splender.id, // Splender max load is 100 kg
      driver_id: john.id,
      cargo_weight_kg: 200, // exceeds 100
      planned_distance_km: 140
    })
  });
  const weightData = await weightRes.json();
  if (weightRes.status !== 400 || !weightData.message.includes('Cargo weight exceeds vehicle maximum load capacity')) {
    throw new Error(`Expected 400 for weight capacity limit, got ${weightRes.status}: ${JSON.stringify(weightData)}`);
  }
  console.log('Passed weight capacity check.');

  // Case 6e: Valid Trip Creation (Draft status)
  console.log('Case 6e: Creating a valid Draft trip...');
  const validTripRes = await fetch(`${BASE_URL}/api/trips`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      source: 'Mumbai',
      destination: 'Pune',
      vehicle_id: tata.id,
      driver_id: john.id,
      cargo_weight_kg: 5000,
      planned_distance_km: 150
    })
  });
  const validTripData = await validTripRes.json();
  if (validTripRes.status !== 201 || validTripData.data.status !== 'Draft') {
    throw new Error(`Failed to create valid trip: ${JSON.stringify(validTripData)}`);
  }
  const tripId = validTripData.data.id;
  console.log(`Valid trip created with ID ${tripId} in Draft status.`);

  // 7. Dispatch Trip
  console.log('\nTesting Dispatch Trip (State transitions)...');
  const dispatchRes = await fetch(`${BASE_URL}/api/trips/${tripId}/dispatch`, {
    method: 'PATCH',
    headers: jsonHeaders
  });
  const dispatchData = await dispatchRes.json();
  if (dispatchRes.status !== 200 || dispatchData.data.status !== 'Dispatched') {
    throw new Error(`Failed to dispatch trip: ${JSON.stringify(dispatchData)}`);
  }
  console.log('Trip status updated to Dispatched.');

  // Verify that Vehicle and Driver status changed to 'On Trip'
  const checkVehRes = await fetch(`${BASE_URL}/api/vehicles/${tata.id}`, { headers: authHeader });
  const checkVehData = await checkVehRes.json();
  const checkDrvRes = await fetch(`${BASE_URL}/api/drivers/${john.id}`, { headers: authHeader });
  const checkDrvData = await checkDrvRes.json();

  if (checkVehData.data.status !== 'On Trip' || checkDrvData.data.status !== 'On Trip') {
    throw new Error(`Vehicle or driver status was not updated to "On Trip". Vehicle status: ${checkVehData.data.status}, Driver status: ${checkDrvData.data.status}`);
  }
  console.log('Verified: Vehicle & Driver status updated to "On Trip".');

  // 8. Complete Trip
  console.log('\nTesting Complete Trip...');
  const completeRes = await fetch(`${BASE_URL}/api/trips/${tripId}/complete`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({
      actual_distance_km: 152,
      fuel_consumed_liters: 46
    })
  });
  const completeData = await completeRes.json();
  if (completeRes.status !== 200 || completeData.data.status !== 'Completed') {
    throw new Error(`Failed to complete trip: ${JSON.stringify(completeData)}`);
  }
  console.log('Trip status updated to Completed.');

  // Verify that Vehicle and Driver status changed back to 'Available' and Odometer increased
  const checkVeh2Res = await fetch(`${BASE_URL}/api/vehicles/${tata.id}`, { headers: authHeader });
  const checkVeh2Data = await checkVeh2Res.json();
  const checkDrv2Res = await fetch(`${BASE_URL}/api/drivers/${john.id}`, { headers: authHeader });
  const checkDrv2Data = await checkDrv2Res.json();

  if (checkVeh2Data.data.status !== 'Available' || checkDrv2Data.data.status !== 'Available') {
    throw new Error(`Vehicle or driver status was not updated back to "Available". Vehicle status: ${checkVeh2Data.data.status}, Driver status: ${checkDrv2Data.data.status}`);
  }
  const oldOdometer = Number(tata.odometer_km);
  const newOdometer = Number(checkVeh2Data.data.odometer_km);
  if (newOdometer !== oldOdometer + 152) {
    throw new Error(`Expected odometer to increment by 152, but went from ${oldOdometer} to ${newOdometer}`);
  }
  console.log('Verified: Vehicle & Driver status returned to "Available". Odometer increased by 152.');

  // 9. Dashboard KPIs
  console.log('\nTesting Dashboard KPIs...');
  const kpisRes = await fetch(`${BASE_URL}/api/dashboard/kpis`, { headers: authHeader });
  const kpisData = await kpisRes.json();
  if (kpisRes.status !== 200 || kpisData.data.totalVehicles === undefined) {
    throw new Error(`KPI retrieval failed: ${JSON.stringify(kpisData)}`);
  }
  console.log('Dashboard KPIs retrieved successfully:', kpisData.data);

  // 10. Reports
  console.log('\nTesting Reports & CSV Export...');
  const costReportRes = await fetch(`${BASE_URL}/api/reports/operational-cost`, { headers: authHeader });
  const costReportData = await costReportRes.json();
  if (costReportRes.status !== 200 || !Array.isArray(costReportData.data)) {
    throw new Error('Failed to retrieve operational cost report');
  }
  console.log('Operational Cost Report items:', costReportData.data.length);

  // CSV Export
  const csvRes = await fetch(`${BASE_URL}/api/reports/export/csv?report=operational-cost`, { headers: authHeader });
  const csvText = await csvRes.text();
  if (csvRes.status !== 200 || !csvText.includes('vehicle_id') || !csvText.includes('total_operational_cost')) {
    throw new Error(`CSV export failed: status ${csvRes.status}, response start: ${csvText.substring(0, 100)}`);
  }
  console.log('CSV Export verified! Header:');
  console.log(csvText.split('\n')[0]);

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

// Start server using local path
const serverPath = path.join(__dirname, 'dist', 'src', 'server.js');
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '5000' }
});

let testsPassed = false;

// Wait for server to start, run tests, and cleanup
(async () => {
  try {
    await wait(3000); // Wait for server to bind
    await runTests();
    testsPassed = true;
  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    console.log('Shutting down backend server...');
    serverProcess.kill('SIGINT');
    await wait(1000);
    process.exit(testsPassed ? 0 : 1);
  }
})();
