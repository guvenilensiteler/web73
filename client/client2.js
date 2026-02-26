// client.js

// 1. LiveKit Sınıflarını Al
const { Room, RoomEvent } = LivekitClient;

// 2. Socket.io Bağlantısı (Senin Server.js adresin)
// NOT: Burası server.js'in çalıştığı port olmalı (Genelde 3000)
const socket = io('https://signal.ercudensiteler.com:3000');

// --- Rulet Verileri Kısmı ---
let say = 0;
socket.on('message', (message) => {
    if (message.type === 'rulette-number' && say++ % 2 == 1) {
        console.log("Gelen Sayı:", message.number);
        // Ekranda sayıyı güncelleme işlemlerini buraya yazabilirsin
    }
});

// --- Canlı Yayın Kısmı ---

// A) Sayfa açılınca İzleyici Token'ı iste
socket.on('connect', () => {
    console.log("Socket sunucusuna bağlandı, video bileti isteniyor...");
    socket.emit('get-livekit-token', { 
        name: 'Izleyici_' + Math.floor(Math.random() * 10000), 
        isPublisher: false // <--- ÖNEMLİ: İzleyici olduğumuzu belirtiyoruz
    });
});

// B) Token geldiğinde LiveKit'i başlat
socket.on('token-ready', (data) => {
    console.log("Token alındı, yayına bağlanılıyor...");
    startLiveKitStream(data.token);
});

async function startLiveKitStream(token) {
    const room = new Room({
        // İzleyici için otomatik kalite ayarı (Adaptive Stream)
        adaptiveStream: true,
        dynacast: true
    });

    // Vultr LiveKit Sunucu Adresin (Nginx arkasındaki SSL'li adres)
    const wsURL = 'wss://turn.ercudensiteler.com:7880';

    // 1. Olay Dinleyicileri: Yayın geldiğinde ne yapayım?
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'video') {
            console.log("Video akışı yakalandı!");
            
            const videoContainer = document.getElementById('video-container');
            videoContainer.innerHTML = ""; // "Yükleniyor" yazısını temizle
            
            // Video elementini oluştur ve ekrana bas
            const videoElement = track.attach();
            videoContainer.appendChild(videoElement);
        }
    });

    // Yayın kesilirse
    room.on(RoomEvent.Disconnected, () => {
        document.getElementById('video-container').innerHTML = "Yayın Sona Erdi veya Bağlantı Koptu.";
    });

    // 2. Bağlantıyı Başlat
    try {
        await room.connect(wsURL, token);
        console.log("LiveKit Sunucusuna Başarıyla Bağlanıldı!");
    } catch (error) {
        console.error("LiveKit Bağlantı Hatası:", error);
        document.getElementById('video-container').innerHTML = "Bağlantı Hatası: " + error.message;
    }
}