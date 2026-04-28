const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/events', require('./routes/events'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/landing-pages', require('./routes/landingPages'));
app.use('/api/donate', require('./routes/publicDonate'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, '0.0.0.0', () => console.log(`🕎 Tiferet Backend on port ${PORT}`));
module.exports = app;
