import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

// 2. View All Reports
app.get('/api/reports', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('kerygma_reports')
            .select('*')
            .order('meeting_date', { ascending: false });

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