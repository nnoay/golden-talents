const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const FILE = path.join(__dirname, 'data.json');

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get reservations
app.get('/reservations', (req, res) => {
  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
  res.json(data);
});

// Add a reservation
app.post('/reserve', (req, res) => {
  const newRes = req.body;

  // Validate input, now including field
  if (!newRes.name || !newRes.phone || !newRes.date || !newRes.time || !newRes.field) {
    return res.status(400).json({ message: 'Missing data' });
  }

  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];

  const newStart = new Date(`${newRes.date}T${newRes.time}`);
  const newEnd = new Date(newStart.getTime() + 90 * 60000); // 1h30

  // Check conflicts only on the same field
  const conflict = data.some(r => {
    if (r.field !== newRes.field) return false; // different field, ignore
    const rStart = new Date(`${r.date}T${r.time}`);
    const rEnd = new Date(rStart.getTime() + 90 * 60000);
    return (newStart < rEnd && newEnd > rStart);
  });

  if (conflict) {
    return res.status(409).json({ message: 'Slot already reserved on this field' });
  }

  data.push(newRes);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.status(201).json({ message: 'Reservation saved' });
});

// Delete a reservation
app.delete('/delete', (req, res) => {
  const { date, time, field } = req.body;
  if (!date || !time || !field) {
    return res.status(400).json({ message: 'Missing date, time, or field' });
  }

  let data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE)) : [];
  const initialLength = data.length;

  data = data.filter(r => !(r.date === date && r.time === time && r.field === field));

  if (data.length === initialLength) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.status(200).json({ message: 'Reservation deleted' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
