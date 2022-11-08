const remoteVideo = document.getElementById("remoteVideo")
const localVideo = document.getElementById("localVideo")

const startConnBtn = document.getElementById("startConn")
const stopConnBtn = document.getElementById("stopConn")
const startVideoBtn = document.getElementById("startVideo")


let socket = io.connect('http://localhost:5000')
let mediaStream = null;
let remoteStream = null;
let rtpSender = null;
let connection = null;
let tracks = []


let constraint = {
    video: true,
    audio: true
}, offer, message, answer

socket.on("signal", async (data) => {
    message = JSON.parse(data)
    if (message.rejected) {
        alert("offer is rejected ")
    }
    if (message.answer) {
        //todo
        console.log("received answer ");
        await connection.setRemoteDescription(new RTCSessionDescription(message.answer));
    }
    if (message.offer) {
        console.log("received offer", message.offer)
        if (!connection) {
            await createConnection()
        }
        await connection.setRemoteDescription(new RTCSessionDescription(message.offer))
        answer = connection.createAnswer()
        await connection.setLocalDescription(answer)

        socket.emit("signal", JSON.stringify({"answer": connection.localDescription}))

    }
})


let createOffer = async () => {
    offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    console.log("offer", offer)
    console.log("sdp", connection.localDescription)
    socket.emit("signal", JSON.stringify({"offer": connection.localDescription}))
}, audioTrack, videoTrack

async function createConnection() {
    connection = new RTCPeerConnection(null)

    connection.onicecandidate = (e) => {
        // console.log("onIceCandidateEvent", e.candidate)
        if (e.candidate) socket.emit("signal", JSON.stringify({"iceCandidate": e.candidate}))
    }

    connection.onicecandidateerror = ev => {
        // console.log("On ice candidate event error", ev)
    }
    connection.onicegatheringstatechange = ev => {
        // console.log("On onicegatheringstatechange", ev)
    }
    connection.oniceconnectionstatechange = ev => {
        // console.log("On ice oniceconnectionstatechange", ev)
    }
    connection.onconnectionstatechange = ev => {
        // console.log("On ice oniceconnectionstatechange", ev)
        if (connection.connectionState === "connected") {
            console.log('connected')
        }
    }
    connection.onnegotiationneeded = ev => {
        console.log("On onnegotiationneeded", ev)
        createOffer()
    }

    connection.ontrack = ({track, streams}) => {
        console.log("the track is added")

        // don't set srcObject again if it is already set.
        if (remoteVideo.srcObject) return;
        if (streams.length > 0) {
            remoteVideo.srcObject = streams[0];
            console.log("added remote successfully");
        }

    }


}

startConnBtn.onclick = async (ev) => {
    console.log("started connection")
    await createConnection()
}


startVideoBtn.onclick = async (ev) => {
    console.log("started video")
    await startVideo()

}

const startVideo = async () => {
//    get video streams from camera and display it on local video
    let currtrack = null;
    if (startVideoBtn.innerText === "stop video") {
        console.log('Ending call');
        // connection.close();
        // connection = null
        const videoTracks = mediaStream.getVideoTracks();
        videoTracks.forEach(videoTrack => {
            videoTrack.stop();
            mediaStream.removeTrack(videoTrack);
        });
        localVideo.srcObject = null;
        localVideo.srcObject = mediaStream;
        return
    }
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraint)
        localVideo.srcObject = mediaStream
        audioTrack = (mediaStream.getAudioTracks()[0])
        videoTrack = (mediaStream.getVideoTracks()[0])
        currtrack = videoTrack
        startVideoBtn.innerText = startVideoBtn.innerText === "stop video" ? "start video" : "stop video"

        mediaStream.getTracks().forEach(track => {
            connection.addTrack(track, mediaStream);
        });

        // if (rtpSender && rtpSender.track && currtrack && connection) {
        //     await rtpSender.replaceTrack(currtrack);
        // } else {
        //     if (currtrack && connection)
        //         rtpSender = connection.addTrack(currtrack);
        // }
    } catch (e) {
        console.log("could not get media streams", e)

    }

}

