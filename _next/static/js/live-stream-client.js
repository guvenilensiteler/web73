const { Room, RoomEvent } = LivekitClient;
const socket = io('https://signal.ercudensiteler.com:3000');

let say = 0;
socket.on('message', (message) => {
    if (message.type === 'rulette-number' && say++ % 2 == 1) {
        // console.log("Gelen Sayı:", message.number);
        // Ekranda sayıyı güncelleme işlemlerini buraya yazabilirsin
        if (localStorage.getItem('ayar_senkronize') === 'true') {
            document.querySelector('[data-bet-spot-id="'+message.number+'"]').dispatchEvent(new MouseEvent('click'));
            document.querySelector('#rulette-number-last-time b').innerHTML =
            new Intl.DateTimeFormat('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(new Date());
        }
    }
});

// --- Canlı Yayın Kısmı ---
// A) Sayfa açılınca İzleyici Token'ı iste
socket.on('connect', () => {
    socket.emit('get-livekit-token', {
        name: 'Izleyici_' + Math.floor(Math.random() * 10000), 
        isPublisher: false // <--- ÖNEMLİ: İzleyici olduğumuzu belirtiyoruz
    });
});

// B) Token geldiğinde LiveKit'i başlat
socket.on('token-ready', (data) => {
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
            const videoContainer = document.getElementById('video-container');
            videoContainer.innerHTML = ""; // "Yükleniyor" yazısını temizle
            
            // Video elementini oluştur ve ekrana bas
            const videoElement = track.attach();
            videoContainer.appendChild(videoElement);
        }
    });

    let hata_html = `<a href="window.location.reload();">Sayfayı Yenileyebilirsiniz</a>`;

    // Yayın kesilirse
    room.on(RoomEvent.Disconnected, () => {
        document.getElementById('video-container').innerHTML = "Yayın Sona Erdi veya Bağlantı Koptu." + hata_html;
    });

    // 2. Bağlantıyı Başlat
    try {
        await room.connect(wsURL, token);
    } catch (error) {
        console.error("Bağlantı Hatası:", error);
        document.getElementById('video-container').innerHTML = "Bağlantı Hatası: " + error.message + hata_html;
    }
}