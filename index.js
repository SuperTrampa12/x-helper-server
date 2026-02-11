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

app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    if (!tweetText) {
      return res.json({ replies: ["(no tweet text received)"] });
    }

    const selected = getRandomExamples(examples, 5);

    // 💥 формируем реальные few-shot сообщения
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
      temperature: 0.6, // ниже = ближе к стилю
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: `
Reply exactly in the same tone, structure, and intensity 
as the previous assistant messages.

Do not soften the style.
Do not summarize.
Do not explain.
Just respond naturally.
          `.trim(),
        },
        ...fewShotMessages,
        {
          role: "user",
          content: tweetText,
        },
      ],
    });

    const rawText = completion.choices?.[0]?.message?.content?.trim();

    let replies = [];

    if (rawText) {
      replies = rawText
        .split("\n")
        .map(r => r.trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    if (!replies.length) {
      replies = ["seen this before."];
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
