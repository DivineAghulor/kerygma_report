import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// --- SUPABASE CONFIGURATION ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Key in environment variables.");
    process.exit(1);
}

// Initialize the client
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ROUTES ---

// 1. Submit a Report
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

        // Using Supabase SDK instead of SQL
        // Make sure your table columns match these keys EXACTLY
        const { data, error } = await supabase
            .from('school_devotion_reports') // Your table name
            .insert([
                {
                    meeting_date: date,
                    coordinator: coordinator,
                    hall: hall,
                    total_attendees: attendees,
                    new_attendees: new_attendees,
                    testimonies: testimonies,
                    attendee_names: names
                }
            ])
            .select(); // Returns the inserted data

        if (error) throw error;

        res.status(201).json({
            message: 'Report submitted successfully!',
            data: data[0]
        });

    } catch (err) {
        console.error('Supabase Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Login Endpoint (Simple Auth)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;

    if (!adminUser || !adminPass) {
        console.error("❌ Admin credentials not set in environment.");
        return res.status(500).json({ error: "Server misconfiguration" });
    }

    if (username === adminUser && password === adminPass) {
        // In a real app, generate a JWT. Here we use a simple secret token.
        return res.json({ success: true, token: 'kerygma-secret-admin-token' });
    } else {
        return res.status(401).json({ error: "Invalid credentials" });
    }
});

// 3. View All Reports (Protected & Filterable)
app.get('/api/reports', async (req, res) => {
    try {
        // --- SECURITY CHECK ---
        const token = req.headers['x-admin-token'];
        if (token !== 'kerygma-secret-admin-token') {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        // --- FILTERING PARAMS ---
        const { start_date, end_date, hall } = req.query;

        let query = supabase
            .from('school_devotion_reports') // Changed from kerygma_reports to match the POST route (assuming consistent table name is desired, or user can correct)
            .select('*')
            .order('meeting_date', { ascending: false });

        if (start_date) {
            query = query.gte('meeting_date', start_date);
        }
        if (end_date) {
            query = query.lte('meeting_date', end_date);
        }
        if (hall) {
            query = query.eq('hall', hall);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Supabase Error:', err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});