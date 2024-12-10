let slideIndex = 0;
let intervalId;

const showSlide = (n) => {
    const slides = document.querySelectorAll('#slide');
    slideIndex = n >= slides.length - 3 ? 0 : n < 0 ? slides.length - 4 : slideIndex
    slides.forEach((slide) => { 
        slide.classList.remove('firstSlide')
        slide.style.transform = `translateX(-${slideIndex * 100}%)`
    });
    slides[slideIndex].classList.add('firstSlide')
}

const moveSlide = (n) => { slideIndex += n; showSlide(slideIndex); }

const startAutoplay = () => { intervalId = setInterval(() => { moveSlide(1); }, 3000) };

const stopAutoplay = () => clearInterval(intervalId);

startAutoplay();

document.querySelector('#carousel').addEventListener('mouseenter', stopAutoplay);

document.querySelector('#carousel').addEventListener('mouseleave', startAutoplay);

document.querySelector('#previous').addEventListener('click', () => moveSlide(-1));

document.querySelector('#next').addEventListener('click', () => moveSlide(1));
