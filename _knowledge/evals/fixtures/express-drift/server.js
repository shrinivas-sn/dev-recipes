const express = require('express');

const app = express();
app.use(express.json());

// A route that awaits something and can reject. What this project needs is the
// correct error-handling approach for the Express major it actually installs.
app.get('/v1/report/:id', async (req, res) => {
  const report = await loadReport(req.params.id);
  res.json(report);
});

async function loadReport(id) {
  if (!/^\d+$/.test(id)) throw new Error(`bad report id: ${id}`);
  return { id: Number(id), rows: [] };
}

module.exports = app;
