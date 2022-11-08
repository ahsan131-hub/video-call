const express = require("express")
const app = express()
const cors = require("cors")
app.use(cors());

app.get("/", (req, res) => {
    res.send('index')
})

server = app.listen(5000)
const io = require("socket.io")(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header"],
            credentials: true
        }
    }
)

io.on("connection", socket => {
    socket.on("signal", data => {
        console.log(data)
        socket.broadcast.emit("signal", data)

    })
})