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

function getRandomExamples(arr, count = 2) { // ↓ было 4
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function cleanText(text) {
  return text
    .replace(/[-–—]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateReplies(tweetText) {
  const moods = [
    "calm confidence",
    "friendly sharpness",
    "playful skepticism",
    "market-wise calm",
    "quiet optimism",
    "light sarcasm",
    "empathetic realism"
  ];

  const mood = moods[Math.floor(Math.random() * moods.length)];
  const selected = getRandomExamples(examples, 2);

  const fewShotMessages = [];

  selected.forEach(example => {
    fewShotMessages.push({ role: "user", content: example.tweet });
    fewShotMessages.push({ role: "assistant", content: example.reply });
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 1.1,        // чуть стабильнее
    max_tokens: 25,          // ↓ было 60
    n: 3,                    // 3 варианта за 1 запрос
    messages: [
      {
        role: "system",
        content: `
Cheerful crypto Twitter user.
Warm, playful, emotionally aware.
Support the author naturally.
Under 7 words.
Max 1 emoji.
No hashtags.
Mood: ${mood}
`.trim(),
      },
      ...fewShotMessages,
      {
        role: "user",
        content: tweetText,
      },
    ],
  });

  const replies = completion.choices.map(choice => {
    let text = choice.message?.content?.trim() || "";
    text = cleanText(text);

    const words = text.split(" ").filter(Boolean);
    if (words.length > 7) {
      text = words.slice(0, 7).join(" ");
    }

    return text;
  });

  return replies;
}

app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    if (!tweetText) {
      return res.json({ replies: ["(no tweet text received)"] });
    }

    const replies = await generateReplies(tweetText);
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