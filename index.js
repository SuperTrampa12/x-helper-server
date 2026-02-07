import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    if (!tweetText) {
      return res.json({ replies: ["(no tweet text received)"] });
    }

   const moods = [
  "calmly confident, nothing forced",
  "friendly and sharp, but supportive",
  "playfully skeptical, in a good way",
  "market-wise, slightly amused",
  "seen this cycle before, no panic",
  "quietly optimistic with a smile",
  "light sarcasm, zero stress",
  "kind, honest, and emotionally aware",
  "thought-provoking, not dramatic",
  "understands the market and people",
  "empathetic but still realistic"
];

const mood = moods[Math.floor(Math.random() * moods.length)];

const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: `
You are a cheerful crypto enthusiast on Twitter.
You sound kind, funny, emotionally aware, and easy to like.

Your goal:
- support the author
- react like a real human
- add warmth and light humor
- make people smile or nod

Style:
- very kind
- playful
- optimistic
- slightly nerdy
- never toxic

Rules:
- short lines only
- natural Twitter phrasing
- unfinished thoughts are OK
- casual human expressions allowed
- emojis allowed (max 1)
- no explanations
- no hashtags

Mood: ${mood}

Return exactly 3 replies.
Each reply under 7 words.
Each reply on a new line.
      `.trim(),
    },
    {
      role: "user",
      content: tweetText,
    },
  ],
  temperature: 0.9,
  max_tokens: 80,
});


    const text = completion.choices?.[0]?.message?.content?.trim();

    res.json({
      replies: text
        ? text.split("\n").map(t => t.trim()).filter(Boolean).slice(0, 3)
        : ["(AI returned empty response)"],
    });

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ replies: ["(server error)"] });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
