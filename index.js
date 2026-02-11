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
    .replace(/[-–—]/g, "") // убираем любые тире
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  return text.split(" ").filter(Boolean).length;
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

  // до 3 попыток попасть в диапазон слов
  for (let attempt = 0; attempt < 3; attempt++) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 1.15,
      presence_penalty: 0.8,
      frequency_penalty: 0.6,
      max_tokens: 80,
      messages: [
        ...fewShotMessages,
        {
          role: "system",
          content:
            "Reply in 2 to 20 words. No dashes. Natural, sharp, sarcastic, provocative if relevant. No explanations.",
        },
        {
          role: "user",
          content: tweetText,
        },
      ],
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || "";
    text = cleanText(text);

    const count = wordCount(text);

    if (count >= 2 && count <= 20) {
      return text;
    }
  }

  return "interesting timing.";
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
      replies.push(reply);
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
