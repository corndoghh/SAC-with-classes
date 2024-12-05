let slideIndex = 0;
let intervalId;

const showSlide = (n) => {
    const slides = document.querySelectorAll('#slide');
    slideIndex = n >= slides.length - 2 ? 0 : n < 0 ? slides.length - 3 : slideIndex
    slides.forEach((slide) => { 
        slide.style.transform = `translateX(calc(-${slideIndex * 100}% - ${slideIndex * 100}px))`
    });
    slides[slideIndex+1].style.transform += 'translateY(-10px) scale(1.05)'
}



const moveSlide = (n) => { slideIndex += n; showSlide(slideIndex); }

const startAutoplay = () => { intervalId = setInterval(() => { moveSlide(1); }, 3000) };

const stopAutoplay = () => clearInterval(intervalId);



const getBlogs = async () => {


    const blogLoading = new Loading()

    const blogUUIDs = await (await fetch('/blog?UUID=', {
        method: 'get',
        headers: {
            "Content-Type": "application/json"
        }
    })).json()

    const carouselIn = document.querySelector('#carouselIn')

    await Promise.all(blogUUIDs.map(async (UUID) => {
        const blog = await (await fetch(`/blog?UUID=${UUID}`, {
            method: 'get',
            headers: {
                "Content-Type": "application/json"
            }
        })).json()
        const blogElement = document.createElement('article')
        const title = document.createElement('h1')
        const author = document.createElement('a')
        const description = document.createElement('p')
        const img = document.createElement('img')

        title.innerText = blog.title
        author.innerText = `${blog.FirstName}  ${blog.LastName}`
        author.href = 'javascript:void(0)'
        description.innerHTML = blog.description
        img.src = 'assets/handsWithGlobe.jpg'


        blogElement.setAttribute('id', 'slide')
        blogElement.setAttribute('uuid', blog.UUID)
        blogElement.appendChild(title)
        blogElement.appendChild(author)
        blogElement.appendChild(description)
        blogElement.appendChild(img)

        carouselIn.appendChild(blogElement) 

        blogElement.addEventListener('mouseover', (e) => {
            blogElement.style.transform += 'translateY(-10px)'
        }) 
        blogElement.addEventListener('mouseout', (e) => {
            blogElement.style.transform += 'translateY(10px)'
        })

        blogElement.onclick = () => {
            window.location.href = '/blog?UUID='+blogElement.getAttribute('uuid')
        }
    }))

    if (Object.keys(blogUUIDs).length >= 4) {
        startAutoplay();

        document.querySelector('#carousel').addEventListener('mouseenter', stopAutoplay);

        document.querySelector('#carousel').addEventListener('mouseleave', startAutoplay);

        document.querySelector('#previous').addEventListener('click', () => moveSlide(-1));

        document.querySelector('#next').addEventListener('click', () => moveSlide(1));
        carouselIn.children[1].style.transform = 'translateY(-10px) scale(1.05)' 
    }





    blogLoading.destroy()

}

getBlogs()