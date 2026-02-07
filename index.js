import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("X Helper server is alive");
});

app.post("/generate", async (req, res) => {
  try {
    const { tweetText } = req.body;

    if (!tweetText) {
      return res.status(400).json({ error: "No tweet text" });
    }

    const moods = [
      "calmly confident",
      "friendly and sharp",
      "playfully skeptical",
      "market-wise amused",
      "quietly optimistic",
      "kind and supportive",
      "light humor, good vibes"
    ];

    const mood = moods[Math.floor(Math.random() * moods.length)];

    const messages = [
      {
        role: "system",
        content: `
You are a cheerful, kind crypto enthusiast on Twitter.
You react like a real human, not an analyst.

Style:
- friendly
- funny
- emotionally aware
- supportive
- internet-native

Tone:
- light humor
- warm
- positive energy
- never toxic

Rules:
- short lines
- natural Twitter phrasing
- unfinished thoughts OK
- emojis allowed (0–1)
- no hashtags
- no explanations

Mood: ${mood}

Return exactly 3 replies.
Each reply under 7 words.
Each reply on a new line.
`
      },
      {
        role: "user",
        content: tweetText
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages,
          temperature: 0.9
        })
      }
    );

    const data = await response.json();

    const raw = data.choices?.[0]?.message?.content || "";
    const replies = raw
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ replies });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
