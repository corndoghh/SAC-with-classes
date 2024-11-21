
const toggleMode = async () => {

    const isDarkMode = !document.querySelector('body').classList.contains('dark-mode')

    const response = await fetch('/profile/dark-mode', {
        method: "post",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            'darkMode': isDarkMode
        })
    })


    console.log("DOES IT HAVE IT", response, document.querySelector('body').classList.contains('dark-mode'))

    document.querySelector('body').classList.toggle('dark-mode')

    if (isDarkMode) { document.querySelector('#dark-mode-icon').setAttribute("class", "fa-regular fa-moon") }
    else { document.querySelector('#dark-mode-icon').setAttribute("class", "fa-regular fa-sun") }

    console.log("Does it have it now?", document.querySelector('body').classList.contains('dark-mode'))
    

}


document.getElementById("dark-mode-icon").onclick = async () => { await toggleMode(); };


const isDarkMode = async () => {    

    const loading = new Loading()
    
    const darkModeResponse = await fetch('/profile/dark-mode', {
        method: 'get',
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin"
    });
    
    const darkMode = (await darkModeResponse.json())['isDarkMode'];
    
    console.log("isDarkMode: ", darkMode);
    
    if (darkMode && !document.querySelector('body').classList.contains('dark-mode')) {
        document.querySelector('body').classList.add('dark-mode');
        document.querySelector('#dark-mode-icon').setAttribute("class", "fa-regular fa-moon")
    } else { document.querySelector('#dark-mode-icon').setAttribute("class", "fa-regular fa-sun") }
    
    loading.destroy()
    
    try {
        document.querySelector('#dark-mode-input').checked = darkMode;
    } catch {
    }
}

isDarkMode()

