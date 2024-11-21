

const loadingDone = () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.visibility = 'hidden'; 
}

const loading = () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.opacity = '1';
    loadingOverlay.style.visibility = 'shown'; 
}
