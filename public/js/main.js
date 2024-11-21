let slideIndex = 0;
let intervalId; // Variable to store setInterval ID

function moveSlide(n) {
    slideIndex += n;
    showSlide(slideIndex);
}

function showSlide(n) {
    const slides = document.querySelectorAll('#slide');
    if (n >= slides.length) {
        slideIndex = 0;
    } else if (n < 0) {
        slideIndex = slides.length - 1;
    }
    slides.forEach((slide) => {
        slide.style.transform = `translateX(-${slideIndex * 100}%)`;
    });
}

// Function to start autoplay
function startAutoplay() {
    intervalId = setInterval(() => {
        moveSlide(1);
    }, 5000); // Change slide every 3 seconds (adjust as needed)
}

// Function to stop autoplay
function stopAutoplay() {
    clearInterval(intervalId);
}

// Start autoplay when the page loads
startAutoplay();

// Stop autoplay when the carousel is hovered
document.querySelector('#carousel').addEventListener('mouseenter', stopAutoplay);

// Restart autoplay when the carousel is not hovered
document.querySelector('#carousel').addEventListener('mouseleave', startAutoplay);



document.querySelector('#previous').addEventListener('click', () => {
    moveSlide(-1);
});

document.querySelector('#next').addEventListener('click', () => {
    moveSlide(1);
});