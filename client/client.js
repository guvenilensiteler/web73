const socket = io('https://signal.ercudensiteler.com:3000');
const ROOM_ID = 'roulette-room-1';
const remoteVideo = document.getElementById('remoteVideo');
let peerConnection;

const iceConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
            urls: [
                'turn:turn.ercudensiteler.com:3478?transport=udp',
                'turn:turn.ercudensiteler.com:3478?transport=tcp',
                'turns:turn.ercudensiteler.com:5349?transport=tcp'
            ], 
            username: 'ercumentcozer', 
            credential: 'saygi12' 
        }
    ]
};

socket.emit('join-room', ROOM_ID);
socket.emit('message', {
    type: 'request-stream',
    roomId: ROOM_ID
});

socket.on('message', async (data) => {
    // console.log("Mesaj geldi:", data.type);
    if (data.type === 'rulette-number') {
        document.getElementById('numberLabel').innerText = data.value;
    } else if (data.type === 'offer') {
        startConnection(data.sdp);
    } else if (data.type === 'candidate' && peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

async function startConnection(sdp) {
    peerConnection = new RTCPeerConnection(iceConfiguration);

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('message', { type: 'candidate', candidate: event.candidate, roomId: ROOM_ID });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('message', { type: 'answer', sdp: answer.sdp, roomId: ROOM_ID });
}