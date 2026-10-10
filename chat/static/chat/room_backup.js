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


function createPeerConnection(remoteSocketId) {

    const peerConnection = new RTCPeerConnection(
        rtcConfiguration
    );

    peerConnections[remoteSocketId] = peerConnection;

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = (event) => {

        if (event.candidate) {

            socket.emit("ice-candidate", {
                target: remoteSocketId,
                candidate: event.candidate
            });
        }
    };

    peerConnection.ontrack = (event) => {

        let remoteVideo =
            document.getElementById(
                `remote-${remoteSocketId}`
            );

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

        remoteVideo.srcObject =
            event.streams[0];
    };

    return peerConnection;
}


socket.on("user-joined", async ({ socketId }) => {

    console.log("New user joined:", socketId);

    const peerConnection =
        createPeerConnection(socketId);

    const offer =
        await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", {
        target: socketId,
        offer: offer
    });
});


socket.on("offer", async ({ sender, offer }) => {

    console.log("Received offer from:", sender);

    const peerConnection =
        createPeerConnection(sender);

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
    );

    const answer =
        await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", {
        target: sender,
        answer: answer
    });
});


socket.on("answer", async ({ sender, answer }) => {

    console.log("Received answer from:", sender);

    const peerConnection =
        peerConnections[sender];

    if (peerConnection) {

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );
    }
});


socket.on(
    "ice-candidate",
    async ({ sender, candidate }) => {

        const peerConnection =
            peerConnections[sender];

        if (peerConnection && candidate) {
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


startMedia();

const shareScreenButton =
    document.getElementById("shareScreenButton");
    
console.log("Share Screen button:", shareScreenButton);

const stopScreenButton =
    document.getElementById("stopScreenButton");

let cameraTrack = null;
let screenTrack = null;


shareScreenButton.addEventListener("click", async () => {
    try {
        const screenStream =
            await navigator.mediaDevices.getDisplayMedia({
                video: true
            });

        screenTrack =
            screenStream.getVideoTracks()[0];

        cameraTrack =
            localStream.getVideoTracks()[0];

        // Replace camera with screen for every peer
        for (const remoteSocketId in peerConnections) {

            const peerConnection =
                peerConnections[remoteSocketId];

            const sender =
                peerConnection
                    .getSenders()
                    .find(
                        (sender) =>
                            sender.track &&
                            sender.track.kind === "video"
                    );

            if (sender) {
                await sender.replaceTrack(screenTrack);
            }
        }

        // Show screen locally
        const localVideo =
            document.getElementById("localVideo");

        localVideo.srcObject = screenStream;

        shareScreenButton.style.display = "none";
        stopScreenButton.style.display = "inline-block";

        // If the user stops sharing using
        // the browser's "Stop sharing" button
        screenTrack.onended = () => {
            stopScreenSharing();
        };

    } catch (error) {

        console.error(
            "Screen sharing error:",
            error
        );
    }
});


async function stopScreenSharing() {

    if (!screenTrack) {
        return;
    }

    screenTrack.stop();

    // Restore camera for every peer
    for (const remoteSocketId in peerConnections) {

        const peerConnection =
            peerConnections[remoteSocketId];

        const sender =
            peerConnection
                .getSenders()
                .find(
                    (sender) =>
                        sender.track &&
                        sender.track.kind === "video"
                );

        if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack);
        }
    }

    // Restore local camera
    const localVideo =
        document.getElementById("localVideo");

    localVideo.srcObject = localStream;

    screenTrack = null;

    shareScreenButton.style.display = "inline-block";
    stopScreenButton.style.display = "none";
}


stopScreenButton.addEventListener(
    "click",
    stopScreenSharing
);