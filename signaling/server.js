const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.get("/", (req, res) => {
    res.send("RealTimeChat signaling server is running.");
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", (roomName) => {
        socket.join(roomName);

        const room = io.sockets.adapter.rooms.get(roomName);
        const participantCount = room ? room.size : 0;

        console.log(
            `User ${socket.id} joined room ${roomName}. Participants: ${participantCount}`
        );

        socket.to(roomName).emit("user-joined", {
            socketId: socket.id,
        });
    });

    socket.on("offer", ({ target, offer }) => {
        io.to(target).emit("offer", {
            sender: socket.id,
            offer,
        });
    });

    socket.on("answer", ({ target, answer }) => {
        io.to(target).emit("answer", {
            sender: socket.id,
            answer,
        });
    });

    socket.on("ice-candidate", ({ target, candidate }) => {
        io.to(target).emit("ice-candidate", {
            sender: socket.id,
            candidate,
        });
    });

    socket.on("chat-message", ({ roomName, username, message }) => {
        if (!roomName || !username || !message) {
            return;
        }

        io.to(roomName).emit("chat-message", {
            username,
            message,
            timestamp: new Date().toISOString()
        });
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });

    
    socket.on("share-file", (data) => {
        if (!data || !data.roomName || !data.fileName || !data.fileData) {
            return;
        }

        // Relay the file to the other participants in this room.
        socket.to(data.roomName).emit("shared-file", data);

        console.log(
            `${data.username} shared ${data.fileName} in ${data.roomName}`
        );
    });

    // ===============================
    // FILE SHARING
    // ===============================
    socket.on("share-file", (data) => {
        console.log("Received share-file event from:", socket.id);
        
        if (!data || !data.roomName || !data.fileName || !data.fileData) {
            console.log("Invalid file-sharing data received.");
            return;
        }

        // Only accept files from a socket that joined this room
        const room = io.sockets.adapter.rooms.get(data.roomName);

        if (!room || !room.has(socket.id)) {
            console.log("File-sharing rejected: user is not in the room.");
            return;
        }

        const sharedFile = {
            username: String(data.username || "User"),
            fileName: String(data.fileName),
            fileType: String(data.fileType || "application/octet-stream"),
            fileData: data.fileData,
            fileSize: Number(data.fileSize || 0)
        };

        // Send the file to everyone in the room, including the sender
        io.to(data.roomName).emit("shared-file", sharedFile);

        console.log(
            `File shared: ${sharedFile.fileName} in room ${data.roomName}`
        );
    });

});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Signaling server running at http://localhost:${PORT}`);
});