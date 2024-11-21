const sidebarToggle = document.getElementById('sidebar-toggle')

sidebarToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('#includes header')

    if (sidebar.style.width === '0px' || sidebar.style.width === '') {
        sidebar.style.width = '250px'
        sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>'

    } else { 
        sidebar.style.width = '0px'
        sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'

    }

})

const handleScreenChange = (e) => {

    const header = document.querySelector('#includes header')

    if(window.innerWidth >= 900) {
        console.log(window.innerWidth)
        header.style.width = '100%'
    } else {
        header.style.width = '0px'

        
    }
}

window.matchMedia("(min-width: 900px)").addEventListener("change", handleScreenChange);