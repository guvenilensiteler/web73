const target = document.getElementById('settingsBtn');
const allEvents = ['pointerdown','mouseover','mousedown','keydown','touchstart','focus','pointerup','mouseup','click','drag','dblclick'];
allEvents.forEach(eventType => {
    target.addEventListener(eventType, (e) => {
        target.classList.remove('auto-reveal');
    });
});
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Eğer buton ekranda görünürse
        if (entry.isIntersecting) {
            target.classList.add('auto-reveal');
            setTimeout(() => {
                target.classList.remove('auto-reveal');
            }, 4000);
            observer.unobserve(target);
        }
    });
}, {
    threshold: 1 // Butonun %100'ü göründüğünde tetikle
});
observer.observe(target);