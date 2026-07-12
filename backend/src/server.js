require('dotenv').config();
const express = require('express');
const cors = require('cors');
const locationsRouter = require('./routes/locations');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/locations', locationsRouter);

// Central error handler - keeps route handlers free of try/catch boilerplate for
// unexpected errors (validation/geocode errors are already handled per-route)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Sri Lanka locations API listening on http://localhost:${PORT}`);
});
