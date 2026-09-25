const express = require('express');
const Airtable = require('airtable');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure connection to your Airtable Base
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID);

app.use(express.static(path.join(__dirname, 'public')));

// Secure API endpoint to fetch player data safely
app.get('/api/player/:email', async (req, res) => {
    try {
        const records = await base('Players').select({
            filterByFormula: `{Stripe Email} = '${req.params.email}'`,
            maxRecords: 1
        }).firstPage();

        if (records.length === 0) {
            return res.status(404).json({ error: 'Player profile not found.' });
        }

        const player = records[0].fields;
        res.json({
            playerId: player['Player ID'],
            goldCoins: player['Gold Coins'] || 0,
            sweepCoins: player['Sweep Coins'] || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed.' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
