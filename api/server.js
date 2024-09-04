// server.js
const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes');

const app = express();

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Use the routes
app.use(routes);

// Start the Express server
app.listen(3000, () => console.log('Server running on port 3000'));
