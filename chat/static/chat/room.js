const SIGNALING_SERVER = window.SIGNALING_SERVER;
const socket = io(SIGNALING_SERVER);
const roomName = window.ROOM_NAME;

let localStream;
let peerConnections = {};

const rtcConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};


// ===============================
// CAMERA + MICROPHONE
// ===============================

async function startMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        const localVideo = document.getElementById("localVideo");
        localVideo.srcObject = localStream;

        socket.emit("join-room", roomName);

    } catch (error) {
        console.error("Camera/microphone error:", error);

        alert(
            "Unable to access camera or microphone. " +
            "Please allow the browser permissions and try again."
        );
    }
}


// ===============================
// CREATE PEER CONNECTION
// ===============================

function createPeerConnection(remoteSocketId) {

    // Reuse an existing connection if we already have one
    if (peerConnections[remoteSocketId]) {
        return peerConnections[remoteSocketId];
    }

    const peerConnection = new RTCPeerConnection(
        rtcConfiguration
    );

    peerConnections[remoteSocketId] = peerConnection;


    // Add local camera/audio tracks
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }


    // ICE candidates
    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("ice-candidate", {
                target: remoteSocketId,
                candidate: event.candidate
            });
        }
    };


    // Remote video/audio
    peerConnection.ontrack = (event) => {

        let remoteVideo =
            document.getElementById(`remote-${remoteSocketId}`);

        if (!remoteVideo) {

            remoteVideo = document.createElement("video");

            remoteVideo.id =
                `remote-${remoteSocketId}`;

            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;

            document
                .getElementById("remoteVideos")
                .appendChild(remoteVideo);
        }

        remoteVideo.srcObject = event.streams[0];

        console.log(
            "Remote media received from:",
            remoteSocketId
        );
    };


    peerConnection.onconnectionstatechange = () => {

        console.log(
            `Connection ${remoteSocketId}:`,
            peerConnection.connectionState
        );
    };


    return peerConnection;
}


// ===============================
// CREATE OFFER
// ===============================

async function createAndSendOffer(remoteSocketId) {

    const peerConnection =
        peerConnections[remoteSocketId];

    if (!peerConnection) {
        return;
    }

    try {

        const offer =
            await peerConnection.createOffer();

        await peerConnection.setLocalDescription(offer);

        socket.emit("offer", {
            target: remoteSocketId,
            offer: peerConnection.localDescription
        });

        console.log(
            "Offer sent to:",
            remoteSocketId
        );

    } catch (error) {

        console.error(
            "Error creating offer:",
            error
        );
    }
}


// ===============================
// USER JOINED
// ===============================

socket.on("user-joined", async ({ socketId }) => {

    console.log(
        "New user joined:",
        socketId
    );

    createPeerConnection(socketId);

    await createAndSendOffer(socketId);
});


// ===============================
// RECEIVE OFFER
// ===============================

socket.on("offer", async ({ sender, offer }) => {

    console.log(
        "Received offer from:",
        sender
    );

    const peerConnection =
        createPeerConnection(sender);

    try {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        const answer =
            await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        socket.emit("answer", {
            target: sender,
            answer: peerConnection.localDescription
        });

        console.log(
            "Answer sent to:",
            sender
        );

    } catch (error) {

        console.error(
            "Error handling offer:",
            error
        );
    }
});


// ===============================
// RECEIVE ANSWER
// ===============================

socket.on("answer", async ({ sender, answer }) => {

    console.log(
        "Received answer from:",
        sender
    );

    const peerConnection =
        peerConnections[sender];

    if (!peerConnection) {
        return;
    }

    try {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        console.log(
            "Remote description updated:",
            sender
        );

    } catch (error) {

        console.error(
            "Error setting remote description:",
            error
        );
    }
});


// ===============================
// ICE CANDIDATE
// ===============================

socket.on(
    "ice-candidate",
    async ({ sender, candidate }) => {

        const peerConnection =
            peerConnections[sender];

        if (
            peerConnection &&
            candidate
        ) {

            try {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

            } catch (error) {

                console.error(
                    "Error adding ICE candidate:",
                    error
                );
            }
        }
    }
);


// ===============================
// SCREEN SHARING
// ===============================

const shareScreenButton =
    document.getElementById("shareScreenButton");

const stopScreenButton =
    document.getElementById("stopScreenButton");

let cameraTrack = null;
let screenTrack = null;


console.log(
    "Share Screen button:",
    shareScreenButton
);


// ===============================
// START SCREEN SHARING
// ===============================

shareScreenButton.addEventListener(
    "click",
    async () => {

        try {

            const screenStream =
                await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });

            screenTrack =
                screenStream.getVideoTracks()[0];

            cameraTrack =
                localStream.getVideoTracks()[0];


            // Replace camera with screen
            for (
                const remoteSocketId
                in peerConnections
            ) {

                const peerConnection =
                    peerConnections[remoteSocketId];

                const sender =
                    peerConnection
                        .getSenders()
                        .find(
                            sender =>
                                sender.track &&
                                sender.track.kind === "video"
                        );

                if (sender) {

                    await sender.replaceTrack(
                        screenTrack
                    );

                    console.log(
                        "Screen track replaced camera for:",
                        remoteSocketId
                    );

                    // Renegotiate
                    await createAndSendOffer(
                        remoteSocketId
                    );
                }
            }


            // Show screen locally
            const localVideo =
                document.getElementById("localVideo");

            localVideo.srcObject =
                screenStream;


            shareScreenButton.style.display =
                "none";

            stopScreenButton.style.display =
                "inline-block";


            // If browser stops sharing
            screenTrack.onended = () => {
                stopScreenSharing();
            };


        } catch (error) {

            console.error(
                "Screen sharing error:",
                error
            );
        }
    }
);


// ===============================
// STOP SCREEN SHARING
// ===============================

async function stopScreenSharing() {

    if (!screenTrack) {
        return;
    }


    screenTrack.stop();


    for (
        const remoteSocketId
        in peerConnections
    ) {

        const peerConnection =
            peerConnections[remoteSocketId];

        const sender =
            peerConnection
                .getSenders()
                .find(
                    sender =>
                        sender.track &&
                        sender.track.kind === "video"
                );


        if (
            sender &&
            cameraTrack
        ) {

            await sender.replaceTrack(
                cameraTrack
            );

            console.log(
                "Camera track restored for:",
                remoteSocketId
            );

            // Renegotiate again
            await createAndSendOffer(
                remoteSocketId
            );
        }
    }


    // Restore local camera preview
    const localVideo =
        document.getElementById("localVideo");

    localVideo.srcObject =
        localStream;


    screenTrack = null;


    shareScreenButton.style.display =
        "inline-block";

    stopScreenButton.style.display =
        "none";
}


stopScreenButton.addEventListener(
    "click",
    stopScreenSharing
);


// ===============================
// START
// ===============================

startMedia();

// ===============================
// REAL-TIME CHAT
// ===============================

const chatInput = document.getElementById("chatInput");
const sendChatButton = document.getElementById("sendChatButton");
const chatMessages = document.getElementById("chatMessages");

function addChatMessage(username, message, timestamp) {
    const messageElement = document.createElement("div");

    messageElement.className = "chat-message";

    const time = timestamp
        ? new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
          })
        : "";

    messageElement.innerHTML = `
        <strong>${username}</strong>
        <span>: ${message}</span>
        <small style="opacity: 0.6; margin-left: 8px;">
            ${time}
        </small>
    `;

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// Receive chat messages
socket.on("chat-message", (data) => {
    addChatMessage(
        data.username,
        data.message,
        data.timestamp
    );
});


// ===================================
// REAL-TIME FILE SHARING
// ===================================

const fileInput = document.getElementById("fileInput");
const sendFileButton = document.getElementById("sendFileButton");
const fileStatus = document.getElementById("fileStatus");
const sharedFiles = document.getElementById("sharedFiles");

const MAX_FILE_SIZE = 512 * 1024; // 512 KB

sendFileButton.addEventListener("click", async () => {
    console.log("Share File button clicked");
    const file = fileInput.files[0];

    if (!file) {
        fileStatus.textContent = "Please select a file first.";
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        fileStatus.textContent =
            "Please choose a file smaller than 512 KB.";
        return;
    }

    try {
        sendFileButton.disabled = true;
        fileStatus.textContent = "Preparing file...";

        const reader = new FileReader();

        reader.onload = () => {
            socket.emit("share-file", {
                roomName: roomName,
                username: window.USERNAME,
                fileName: file.name,
                fileType: file.type || "application/octet-stream",
                fileData: reader.result,
                fileSize: file.size
            });

            fileStatus.textContent = "File shared successfully.";
            fileInput.value = "";
            sendFileButton.disabled = false;
        };

        reader.onerror = () => {
            fileStatus.textContent = "Could not read the file.";
            sendFileButton.disabled = false;
        };

        reader.readAsDataURL(file);
    } catch (error) {
        console.error("File sharing error:", error);
        fileStatus.textContent = "File sharing failed.";
        sendFileButton.disabled = false;
    }
});

function displaySharedFile(data) {
    const item = document.createElement("div");
    item.className = "shared-file-item";

    const info = document.createElement("p");
    info.textContent =
        `${data.username} shared ${data.fileName}`;

    const downloadLink = document.createElement("a");
    downloadLink.href = data.fileData;
    downloadLink.download = data.fileName;
    downloadLink.textContent = "Download file";

    item.appendChild(info);
    item.appendChild(downloadLink);
    sharedFiles.appendChild(item);
}

socket.on("shared-file", displaySharedFile);

// Send chat message
function sendChatMessage() {

    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    socket.emit("chat-message", {
        roomName: roomName,
        username: window.USERNAME,
        message: message
    });

    chatInput.value = "";
    chatInput.focus();
}


// Send button
sendChatButton.addEventListener(
    "click",
    sendChatMessage
);


// Press Enter to send
chatInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendChatMessage();
        }
    }
);