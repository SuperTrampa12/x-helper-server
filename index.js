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
            "You write short, natural, human-like replies to tweets. No emojis unless appropriate. Max 2 sentences.",
        },
        {
          role: "user",
          content: tweetText,
        },
      ],
      temperature: 0.7,
      max_tokens: 120,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.json({
        replies: ["(AI returned empty response)"],
      });
    }

    // 🔑 ВАЖНО: всегда массив строк
    res.json({
      replies: text
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  } catch (err) {
    console.error("Generate error:", err);
    res.json({
      replies: ["(server error)"],
    });
  }
});


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
