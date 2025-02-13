require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

const QuoteSchema = new mongoose.Schema({
  text: String,
  author: { type: String, default: "Anonymous" },
  likes: { type: Number, default: 0 },
});

const Quote = mongoose.model("Quote", QuoteSchema);

app.get("/random-quote", async (req, res) => {
  try {
    const quotes = await Quote.find();
    if (quotes.length === 0) {
      return res.json({ text: "No quotes available. Add some!", author: "Anonymous" });
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    res.json(quotes[randomIndex]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/add-quote", async (req, res) => {
  try {
    const { quote, author } = req.body;
    if (!quote) return res.status(400).json({ error: "Quote is required" });

    const newQuote = new Quote({ text: quote, author: author || "Anonymous" });
    await newQuote.save();
    res.json({ message: "Quote added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/like-quote", async (req, res) => {
  try {
    const { id } = req.body;
    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });

    quote.likes += 1;
    await quote.save();
    res.json({ message: "Quote liked!", likes: quote.likes });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
