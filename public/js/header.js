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

