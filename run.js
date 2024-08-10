import nodemon from "nodemon"

nodemon({ script: "index.js" })
	.on("start", console.clear)
	.on("restart", console.clear)
	.on("quit", () => {
		console.log("App has quit")
		process.exit()
	})
