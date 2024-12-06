const sidebarToggle = document.getElementById('sidebar-toggle')

sidebarToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('#includes header')

    if (sidebar.style.width === '0px' || sidebar.style.width === '') {
        sidebar.style.width = '250px'
        sidebarToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>'
        sidebar.style.borderRightStyle = 'solid'


    } else { 
        sidebar.style.width = '0px'
        sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'
        sidebar.style.borderRightStyle = 'none'


    }

})

const changeLanguage = async (e) => {
    const response = await fetch('/profile/:details?lang=' + e.target.value, {
        method: 'get',
        credentials: 'same-origin'
    })
    if (response.status === 200) { window.location.reload() }
}


const handleScreenChange = (e) => {

    const header = document.querySelector('#includes header')

    if(window.innerWidth >= 900) {
        console.log(window.innerWidth)
        header.style.width = '100%'
    } else {
        header.style.width = '0px'
        header.style.borderRightStyle = 'none'

        
    }
}

window.matchMedia("(min-width: 900px)").addEventListener("change", handleScreenChange);