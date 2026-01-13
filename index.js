import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses JSON bodies

// Database Configuration
const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test DB Connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL database'))
    .catch(err => console.error('❌ Database connection error', err.stack));

// ROUTES

// 1. Submit a Report (POST)
app.post('/api/reports', async (req, res) => {
    try {
        const { 
            date, 
            coordinator, 
            hall, 
            attendees, 
            new_attendees, 
            testimonies, 
            names 
        } = req.body;

        const query = `
            INSERT INTO reports 
            (meeting_date, coordinator, hall, total_attendees, new_attendees, testimonies, attendee_names)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;

        const values = [date, coordinator, hall, attendees, new_attendees, testimonies, names];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({ 
            message: 'Report submitted successfully!', 
            data: result.rows[0] 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. View All Reports (GET) - Optional, for checking data
app.get('/api/reports', async (req, res) => {
    try {
        const allReports = await pool.query('SELECT * FROM reports ORDER BY meeting_date DESC');
        res.json(allReports.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});