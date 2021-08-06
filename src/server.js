const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const cors = require("cors");

app.use(cors());

app.get("/", (req, res) => {
	res.send("lanq api v2");
});

const players = {};
const questions = require("./data/EnglishQA/index.json");
const langs = ["english", "spanish", "portuguese"];

let availableIndexes = [...questions.keys()];
let currentIndex = Math.floor(Math.random() * availableIndexes.length);
let currentLang = langs[Math.floor(Math.random() * langs.length)];

io.on("connection", (socket) => {
	const player = {
		username: "Player",
		score: 0,
	};
	players[socket.id] = player;
	const game = {
		players: players,
		playerId: socket.id,
		thumbnail: questions[currentIndex].thumbnail,
        lang: currentLang
	};
	console.log(`Player ${socket.id} joined`);
	socket.emit("start", game);

	socket.on("message", (data) => {
		console.log(`Player ${socket.id} sent '${data.text}'`);
		if (data.text.toLowerCase() === questions[currentIndex].answer[currentLang]) {
			players[socket.id].score++;
			currentIndex = Math.floor(Math.random() * availableIndexes.length);
            currentLang = langs[Math.floor(Math.random() * langs.length)];
			io.emit("message", {
				text: data.text,
				author: players[socket.id].username,
				isCorrect: true,
			});
			io.emit("update", {
				players: players,
				playerId: socket.id,
				thumbnail: questions[currentIndex].thumbnail,
                lang: currentLang
			});
		} else {
			io.emit("message", {
				text: data.text,
				author: players[socket.id].username,
				isCorrect: false,
			});
		}
	});

	socket.on("disconnect", () => {
		delete players[socket.id];
		io.emit("update", {
			players: players,
			playerId: socket.id,
			thumbnail: questions[currentIndex].thumbnail,
            lang: currentLang
		});
		console.log(`Player ${socket.id} left`);
	});
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
	console.log(`Listening to ${PORT}`);
});
