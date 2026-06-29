const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let dashboardData = {
  summary: {
    totalVehicles: { value: 48, trend: '+3 this month', isPositive: true },
    activeNow: { value: 31, trend: '64.6% utilization', isPositive: true },
    maintenanceDue: { value: 7, trend: '2 overdue', isPositive: false },
    monthlyExpense: { value: '₹4.2L', trend: '+8% vs last month', isPositive: false },
    fuelEfficiency: { value: '11.4', unit: 'km/L', trend: 'improved 5%', isPositive: true }
  },
  liveTracking: {
    status: '31 live',
    markers: [
      { id: 'T1', label: 'T1', x: 25, y: 35, status: 'moving' },
      { id: 'T2', label: 'T2', x: 80, y: 40, status: 'moving' },
      { id: 'T5', label: 'T5', x: 45, y: 55, status: 'moving' },
      { id: 'T6', label: 'T6', x: 48, y: 85, status: 'stopped' },
      { id: 'T8', label: 'T8', x: 75, y: 25, status: 'idle' },
      { id: 'ALERT-1', label: '!', x: 30, y: 70, status: 'alert' }
    ],
    recentTrips: [
      { id: 1, vehicle: 'AP05-T123', route: 'Vizag Port ➔ APSEZ', distance: '42 km', status: 'Active' },
      { id: 2, vehicle: 'AP05-T087', route: 'Gajuwaka ➔ Pendurthi', distance: '28 km', status: 'Idle 12m' },
      { id: 3, vehicle: 'AP05-T201', route: 'BHPV Gate ➔ Simhachalam', distance: '18 km', status: 'Done' }
    ]
  },
  aiIntelligence: [
    {
      id: 1,
      type: 'alert',
      message: 'AP05-T043 engine temp abnormal — predict failure in 48 hrs',
      subtext: 'Predictive maintenance · Schedule now',
      severity: 'danger'
    },
    {
      id: 2,
      type: 'cost',
      message: 'Fuel cost 10% above forecast for Zone B vehicles this week',
      subtext: 'Cost anomaly · Review idle patterns',
      severity: 'warning'
    },
    {
      id: 3,
      type: 'saving',
      message: 'Route optimization saved 340 km vs last week',
      subtext: 'AI routing · Saving ₹8,200/week',
      severity: 'success'
    },
    {
      id: 4,
      type: 'inventory',
      message: '5 vehicles due for tyre rotation within 500 km',
      subtext: 'Inventory: 12 tyres in stock · Sufficient',
      severity: 'info'
    }
  ],
  maintenanceSchedule: [
    {
      id: 1,
      name: 'Oil Change',
      vehicle: 'AP05-T043',
      details: 'Last done: 3,200 km ago · 5W-30 grade',
      status: 'Overdue',
      severity: 'danger'
    },
    {
      id: 2,
      name: 'Tyre Replacement',
      vehicle: 'AP05-T089',
      details: 'Wear index: 92% · Front pair critical',
      status: 'Overdue',
      severity: 'danger'
    },
    {
      id: 3,
      name: 'Battery Check',
      vehicle: 'AP05-T112',
      details: 'AI predicts replacement needed in 3 wks',
      status: 'In 18 days',
      severity: 'warning'
    },
    {
      id: 4,
      name: 'Brake Service',
      vehicle: 'AP05-T047',
      details: 'Brake pad thickness: 3mm · Wear alert',
      status: 'In 25 days',
      severity: 'info'
    }
  ],
  assetInventory: {
    categories: [
      { name: 'TRUCKS', count: 22, available: 18, percentage: 81 },
      { name: 'VANS', count: 14, available: 9, percentage: 64 },
      { name: 'CARS', count: 12, available: 11, percentage: 91 }
    ],
    sparePartsCount: 342,
    toolsCount: 89
  },
  expenses: {
    mtd: '₹4.2L',
    budget: '₹4.0L',
    overBy: '₹20K',
    categories: [
      { name: 'Fuel', amount: 182000, color: '#3b82f6', percentage: 75 },
      { name: 'Maintenance', amount: 94000, color: '#f59e0b', percentage: 48 },
      { name: 'Driver pay', amount: 112000, color: '#10b981', percentage: 65 },
      { name: 'Tolls/Tax', amount: 24000, color: '#6b7280', percentage: 20 },
      { name: 'Insurance', amount: 8000, color: '#8b5cf6', percentage: 10 }
    ],
    forecast: 'AI forecast: ₹4.5L by month-end · 12.5% over budget'
  }
};

app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

app.post('/api/vehicles', (req, res) => {
  const { type } = req.body;
  dashboardData.summary.totalVehicles.value += 1;
  dashboardData.summary.totalVehicles.trend = `+${dashboardData.summary.totalVehicles.value - 45} this month`;
  if (type === 'TRUCK') {
    dashboardData.assetInventory.categories[0].count += 1;
  } else if (type === 'VAN') {
    dashboardData.assetInventory.categories[1].count += 1;
  } else if (type === 'CAR') {
    dashboardData.assetInventory.categories[2].count += 1;
  }
  const newMarkerId = `T${dashboardData.summary.totalVehicles.value}`;
  dashboardData.liveTracking.markers.push({
    id: newMarkerId,
    label: newMarkerId,
    x: Math.floor(Math.random() * 70) + 15,
    y: Math.floor(Math.random() * 70) + 15,
    status: 'moving'
  });
  res.status(201).json({ success: true, message: 'Vehicle added successfully', summary: dashboardData.summary });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
