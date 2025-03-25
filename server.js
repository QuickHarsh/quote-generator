require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Debug logging
console.log(`Starting server on port ${PORT}`);
console.log(`MongoDB URI available: ${MONGO_URI ? "Yes" : "No"}`);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({ error: "Server error", details: err.message });
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongoConnection: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  console.log("Attempting to connect to MongoDB...");
  mongoose
    .connect(MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds
    })
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

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

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
