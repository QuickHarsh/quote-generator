const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/quotesDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected")).catch(err => console.log(err));

const QuoteSchema = new mongoose.Schema({
    text: String,
    author: { type: String, default: "Anonymous" },
    likes: { type: Number, default: 0 }
});

const Quote = mongoose.model('Quote', QuoteSchema);

app.get('/random-quote', async (req, res) => {
    const quotes = await Quote.find();
    if (quotes.length === 0) {
        return res.json({ text: "No quotes available. Add some!", author: "Anonymous" });
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    res.json(quotes[randomIndex]);
});

app.post('/add-quote', async (req, res) => {
    const { quote, author } = req.body;
    if (!quote) return res.status(400).json({ error: "Quote is required" });

    const newQuote = new Quote({ text: quote, author: author || "Anonymous" });
    await newQuote.save();
    res.json({ message: "Quote added successfully!" });
});

app.post('/like-quote', async (req, res) => {
    const { id } = req.body;
    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    quote.likes += 1;
    await quote.save();
    res.json({ message: "Quote liked!", likes: quote.likes });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
