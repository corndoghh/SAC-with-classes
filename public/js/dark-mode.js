
const toggleMode = async () => {

    const isDarkMode = !document.querySelector('body').classList.contains('dark-mode')

    loading()

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

    loadingDone()

    console.log("DOES IT HAVE IT", response, document.querySelector('body').classList.contains('dark-mode'))

    document.querySelector('body').classList.toggle('dark-mode')

    console.log("Does it have it now?", document.querySelector('body').classList.contains('dark-mode'))
    

}


const isDarkMode = async () => {
    loading();  
    
    const startTime = performance.now()
    
    
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
    }
    
    loadingDone();
    
    try {
        document.querySelector('#dark-mode-input').checked = darkMode;
    } catch {
    }
}

isDarkMode()

