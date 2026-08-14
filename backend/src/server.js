//server.js

const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', scanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SBOM backend running on :${PORT}`));