import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * ✅ CORS — ОДИН раз и правильно
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// обязательно
app.options("*", cors());

app.use(express.json());

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

/**
 * AI endpoint
 */
app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    if (!tweetText) {
      return res.json({
        replies: ["(no tweet text received)"],
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write short, natural, human-like replies to tweets. Max 2 sentences.",
        },
        {
          role: "user",
          content: tweetText,
        },
      ],
      temperature: 0.7,
      max_tokens: 120,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.json({
        replies: ["(AI returned empty response)"],
      });
    }

    res.json({
      replies: text
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3),
    });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({
      replies: ["(server error)"],
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
