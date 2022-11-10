const remoteVideo = document.getElementById("remoteVideo")
const localVideo = document.getElementById("localVideo")

const startConnBtn = document.getElementById("startConn")
const stopConnBtn = document.getElementById("stopConn")
const startVideoBtn = document.getElementById("startVideo")
const screenShareBtn = document.getElementById("screenShare")

let socket = io.connect('http://localhost:5000')
let mediaStream = null;
let remoteStream = null;
let rtpSender = null;
let connection1 = null;
let connection = null;
let screenStream = null;
let tracks = []

let offer, message, audioTrack, videoTrack;
let constraint = {
    video: true,
    audio: true
}

socket.on("signal", async (data) => {
    message = JSON.parse(data)
    if (message.rejected) {
        alert("offer is rejected ")
    } else if (message.answer) {
        console.log("received answer ");
        await connection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.offer) {

        console.log("received offer", message.offer)
        if (!connection) {
            await createConnection()
        }
        await connection.setRemoteDescription(new RTCSessionDescription(message.offer))
        var answer = await connection.createAnswer();
        await connection.setLocalDescription(answer)

        socket.emit("signal", JSON.stringify({answer: connection.localDescription}))

    } else if (message.iceCandidate) {
        console.log('iceCandidate', message.iceCandidate);
        if (!connection) {
            await createConnection();
        }
        try {
            await connection.addIceCandidate(message.iceCandidate);
        } catch (e) {
            console.log(e);
        }
    }
})
let createOffer = async () => {
    offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    console.log("offer", offer)
    console.log("sdp", connection.localDescription)
    socket.emit("signal", JSON.stringify({"offer": connection.localDescription}))
}

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
        if (!remoteStream) remoteStream = new MediaStream()

        // if (streams.length > 0 && !remoteVideo.srcObject) {
        //     remoteVideo.srcObject = streams[0];
        //     console.log("added remote successfully");
        // }
        if (track.kind === 'video') {
            remoteStream.getVideoTracks().forEach(t => remoteStream.removeTrack(t));
        }
        remoteStream.addTrack(track)
        remoteVideo.srcObject = null;
        remoteVideo.srcObject = remoteStream;
        remoteVideo.load();

        return false
    }


}

startConnBtn.onclick = async (ev) => {
    console.log("started connection")
    await createConnection()
}
startVideoBtn.onclick = async (ev) => {
    console.log("started video")
    if (connection)
        await startVideo()

}
screenShareBtn.onclick = async (ev) => {
    if (!screenStream) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                frameRate: 1
            }
        })
    }
    try {
        localVideo.srcObject = null
        localVideo.srcObject = screenStream
        if (rtpSender && connection && connection.track)
            connection.replaceTrack(screenStream.getVideoTracks()[0])

        rtpSender = connection.addTrack(screenStream.getVideoTracks()[0])


    } catch (ev) {
        console.log(ev)
    }

}

const startVideo = async () => {
    let currtrack = null;
    if (videoTrack) {
        videoTrack.stop();
        videoTrack = null;
        localVideo.srcObject = null;
        startVideoBtn.innerText = "start video";


        if (rtpSender && connection) {
            connection.removeTrack(_rtpSender);
            _rtpSender = null;
        }
        return;
    }
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraint)
        localVideo.srcObject = mediaStream
        audioTrack = (mediaStream.getAudioTracks()[0])
        videoTrack = (mediaStream.getVideoTracks()[0])
        currtrack = videoTrack
        startVideoBtn.innerText = "stop video"

        mediaStream.getTracks().forEach(track => {
            rtpSender = connection.addTrack(track, mediaStream);
        });
    } catch (e) {
        console.log("could not get media streams", e)

    }

}

