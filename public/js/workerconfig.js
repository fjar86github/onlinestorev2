if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/onlinestorev2/public/service-worker.js')  // Pastikan path menuju service-worker.js adalah benar
            .then(function(registration) {
                console.log('Service Worker Registered:', registration);
            })
            .catch(function(error) {
                console.log('Service Worker Registration Failed:', error);
            });
    });
}
