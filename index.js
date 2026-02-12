import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { examples } from "./examples.js";

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

function getRandomExamples(arr, count = 4) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function cleanText(text) {
  return text
    .replace(/[-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateOne(tweetText) {

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
  const selected = getRandomExamples(examples, 4);

  const fewShotMessages = [];

  selected.forEach(example => {
    fewShotMessages.push({
      role: "user",
      content: example.tweet,
    });
    fewShotMessages.push({
      role: "assistant",
      content: example.reply,
    });
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 1.25,               // немного выше
    presence_penalty: 0.9,           // сильнее толкает к новизне
    frequency_penalty: 0.7,
    max_tokens: 60,
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
- always finish the sentence naturally
- never end mid-thought
- casual human expressions allowed
- emojis allowed max 1
- no explanations
- no hashtags

Mood: ${mood}

Reply in under 7 words.
`.trim(),
      },
      ...fewShotMessages,
      {
        role: "user",
        content: tweetText,
      },
    ],
  });

  let text = completion.choices?.[0]?.message?.content?.trim() || "";

  text = cleanText(text);

  const words = text.split(" ").filter(Boolean);
  if (words.length > 7) {
    text = words.slice(0, 7).join(" ");
  }

  return text;
}

app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    console.log("Incoming tweetText:", tweetText);

    if (!tweetText) {
      return res.json({ replies: ["(no tweet text received)"] });
    }

    const replies = [];

    for (let i = 0; i < 3; i++) {
      const reply = await generateOne(tweetText);
      console.log(`Reply ${i + 1}:`, reply);
      replies.push(reply);
    }

    console.log("Final replies:", replies);
    console.log("----");

    res.json({ replies });

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ replies: ["(server error)"] });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
