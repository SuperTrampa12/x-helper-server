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

function getRandomExamples(arr, count = 5) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function cleanText(text) {
  return text
    .replace(/[-–—]/g, "") // убираем дефисы и тире
    .replace(/\s+/g, " ")
    .trim();
}

function limitWords(text, min = 2, max = 20) {
  const words = text.split(" ").filter(Boolean);
  if (words.length < min) return text;
  if (words.length > max) {
    return words.slice(0, max).join(" ");
  }
  return text;
}

async function generateOne(tweetText) {
  const selected = getRandomExamples(examples, 5);

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
    temperature: 0.8 + Math.random() * 0.5, // вариативность
    max_tokens: 120,
    messages: [
      ...fewShotMessages,
      {
        role: "user",
        content: tweetText,
      },
    ],
  });

  let text = completion.choices?.[0]?.message?.content?.trim() || "";

  text = cleanText(text);
  text = limitWords(text, 2, 20);

  return text;
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

    const replies = [];

    for (let i = 0; i < 3; i++) {
      const reply = await generateOne(tweetText);
      if (reply) replies.push(reply);
    }

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
