const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const messaging = req.body.entry?.[0]?.messaging?.[0];
  const senderId = messaging?.sender?.id;
  const message = messaging?.message?.text;

  if (message) {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }, {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    });

    const reply = response.data.choices[0].message.content;

    await axios.post(`https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_TOKEN}`, {
      recipient: { id: senderId },
      message: { text: reply },
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Chatbot đang chạy ở cổng 3000"));