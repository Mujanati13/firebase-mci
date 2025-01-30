const express = require("express");
const admin = require("firebase-admin");
const axios = require("axios");
const app = express();
const port = 3006;
var cors = require('cors')


app.use(cors());
app.use(express.json());

const serviceAccount = require("./services-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const sendFCMNotification = async (deviceToken, messagePayload) => {
  const projectId = "mci-v1"; // Replace with your Firebase project ID
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const accessToken = await admin.credential.cert(serviceAccount).getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken.access_token}`,
  };

  const body = {
    message: {
      token: deviceToken,
      notification: {
        title: messagePayload.title,
        body: messagePayload.body,
      },
      data: messagePayload.data, 
    },
  };

  try {
    const response = await axios.post(url, body, { headers });
    console.log("Notification sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending notification:", error.response ? error.response.data : error.message);
    throw error;
  }
};

app.post("/send-notification", async (req, res) => {
  const { deviceToken, messagePayload } = req.body;
    
  if (!deviceToken || !messagePayload) {
    return res.status(400).json({ error: "Device token and message payload are required." });
  }

  try {
    const response = await sendFCMNotification(deviceToken, messagePayload);
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
