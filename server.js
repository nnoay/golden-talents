const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const PORT = 3000;

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://admin:tuttiperesperanza1919@reservations.wboeh7b.mongodb.net/?retryWrites=true&w=majority&appName=reservations', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Reservation schema
const reservationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  date: String,
  time: String,
  field: String
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Get all reservations
app.get('/reservations', async (req, res) => {
  try {
    const data = await Reservation.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a reservation
app.post('/reserve', async (req, res) => {
  const newRes = req.body;

  if (!newRes.name || !newRes.phone || !newRes.date || !newRes.time || !newRes.field) {
    return res.status(400).json({ message: 'Missing data' });
  }

  const newStart = new Date(`${newRes.date}T${newRes.time}`);
  const newEnd = new Date(newStart.getTime() + 90 * 60000); // 1h30

  try {
    const existing = await Reservation.find({ field: newRes.field, date: newRes.date });

    const conflict = existing.some(r => {
      const rStart = new Date(`${r.date}T${r.time}`);
      const rEnd = new Date(rStart.getTime() + 90 * 60000);
      return newStart < rEnd && newEnd > rStart;
    });

    if (conflict) {
      return res.status(409).json({ message: 'Slot already reserved on this field' });
    }

    const saved = new Reservation(newRes);
    await saved.save();

    res.status(201).json({ message: 'Reservation saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a reservation
app.delete('/delete', async (req, res) => {
  const { date, time, field } = req.body;
  if (!date || !time || !field) {
    return res.status(400).json({ message: 'Missing date, time, or field' });
  }

  try {
    const result = await Reservation.findOneAndDelete({ date, time, field });

    if (!result) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json({ message: 'Reservation deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
