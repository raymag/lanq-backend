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
		username: `${generateUID()}`,
		id: socket.id,
		score: 0,
	};
	players[socket.id] = player;
	const game = {
		players: players,
		playerId: socket.id,
		thumbnail: questions[currentIndex].thumbnail,
		lang: currentLang,
	};
	console.log(`Player ${socket.id} joined`);
	socket.emit("start", game);
	socket.broadcast.emit("playerConnect", {
		players: players,
	});

	socket.on("message", (data) => {
		console.log(`Player ${socket.id} sent '${data.text}'`);
		if (
			data.text.toLowerCase() === questions[currentIndex].answer[currentLang]
		) {
			console.log(`${socket.id} is right`);
			players[socket.id].score++;
			currentIndex = Math.floor(Math.random() * availableIndexes.length);
			currentLang = langs[Math.floor(Math.random() * langs.length)];

			console.log(`Message from ${socket.id}`);
			io.emit("message", {
				text: data.text,
				author: players[socket.id].username,
				isCorrect: true,
			});

			console.log(`Game update`);
			io.emit("update", {
				players: players,
				playerId: socket.id,
				thumbnail: questions[currentIndex].thumbnail,
				lang: currentLang,
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
			lang: currentLang,
		});
		console.log(`Player ${socket.id} left`);
	});
});

function generateUID() {
    var firstPart = (Math.random() * 46656) | 0;
    var secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
}

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => {
	console.log(`Listening to ${PORT}`);
});
