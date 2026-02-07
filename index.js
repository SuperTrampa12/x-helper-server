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

    const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
You generate replies to tweets for X (Twitter).

Rules:
- Generate EXACTLY 3 different replies
- Each reply must be ONE sentence
- Replies must sound like real people on X
- No motivational or inspirational tone
- No explanations
- No numbering
- No emojis unless they feel very natural
- Separate each reply with a new line
`,
    },
    {
      role: "user",
      content: tweetText,
    },
  ],
  temperature: 0.9,
  max_tokens: 150,
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
