const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const Pusher = require("pusher");

const Rooms = require("./dbRooms");
const Message = require("./dbMessages");

const app = express();

const pusher = new Pusher({
  appId: "1857734",
  key: "1c7718a423bea8feb6c1",
  secret: "e8504fee9c2074d0c45d",
  cluster: "ap2",
  useTLS: true,
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

const dbUrl = "mongodb+srv://gtgopinath6:Gopi682001@cluster0.jyao4.mongodb.net/?retryWrites=true&w=majority&appName=whatsappClone";

// Database connection with try-catch
(async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Db connected");

    const db = mongoose.connection;

    const roomCollection = db.collection("rooms");
    const changeStream = roomCollection.watch();

    changeStream.on("change", (change) => {
      try {
        if (change.operationType === "insert") {
          const roomDetails = change.fullDocument;
          pusher.trigger("room", "inserted", roomDetails);
        } else {
          console.log("Unexpected event type");
        }
      } catch (err) {
        console.error("Error in room change stream:", err);
      }
    });

    const msgCollection = db.collection("messages");
    const changeStream1 = msgCollection.watch();

    changeStream1.on("change", (change) => {
      try {
        if (change.operationType === "insert") {
          const messageDetails = change.fullDocument;
          pusher.trigger("messages", "inserted", messageDetails);
        } else {
          console.log("Unexpected event type");
        }
      } catch (err) {
        console.error("Error in message change stream:", err);
      }
    });

  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
})();

app.get("/", (req, res) => {
  try {
    res.send("Hello from backend");
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/group/create", async (req, res) => {
  try {
    const name = req.body.groupName;
    const data = await Rooms.create({ name });
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.post("/messages/new", async (req, res) => {
  try {
    const dbMessage = req.body;
    const data = await Message.create(dbMessage);
    res.status(201).send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/all/rooms", async (req, res) => {
  try {
    const data = await Rooms.find({});
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/room/:id", async (req, res) => {
  try {
    const data = await Rooms.find({ _id: req.params.id });
    res.status(200).send(data[0]);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get("/messages/:roomId", async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId });
    res.status(200).send(messages);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(5000, () => {
  try {
    console.log("Server is listening on port 5000");
  } catch (err) {
    console.error("Error starting the server:", err);
  }
});
