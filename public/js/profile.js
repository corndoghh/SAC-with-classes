const previewImage = (event) => {
    const preview = document.getElementById('profile-pic-preview');
    preview.src = URL.createObjectURL(event.target.files[0]);
}


const confirmDelete = () => {
    const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmation) {
        alert("Your account has been deleted."); // Replace with actual delete logic.
    }
}

document.getElementById("dark-mode-input").onclick = () => toggleMode();

document.getElementById("two-factor-auth").onclick = async () => {

    


}

const start = async () => {

    const loading = new Loading()

    const requestHeaders = {
        "Content-Type": "application/json"
    };

    const response = await fetch('/profile/details', {
        method: "get",
        headers: requestHeaders,
        credentials: "same-origin"
    })

    const jsonData = await response.json()


    const FirstName = document.querySelector('#FirstName')
    const LastName = document.querySelector('#LastName')
    const Username = document.querySelector('#Username')
    const TwoFactor = document.querySelector('#two-factor-auth')
    const Language = document.querySelector('#Language')


    TwoFactor.checked = jsonData["TwoFactor"] === "on" ? true : false
    TwoFactor.disabled = TwoFactor.checked ? true : false
    FirstName.placeholder = jsonData.FirstName
    LastName.placeholder = jsonData.LastName
    Username.placeholder = jsonData.Username

    Language.selectedIndex = {
        'en': 0,
        'es': 1,
        'fr': 2,
        'de': 3
    }[jsonData.Language]

    loading.destroy()

    const form = document.querySelector(`#form`)

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('kep')
            form.requestSubmit()
            
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const fetchData = new FormData()

        if (e.submitter !== null && e.submitter.id === 'remove-pfp') { fetchData.append('json', JSON.stringify({ 'remove-pfp': true })) }
        else {
            const formData = Object.fromEntries(new FormData(e.target))

            !formData['TwoFactor'] ? formData['TwoFactor'] = 'off' : formData['TwoFactor'] = 'on';
            formData['ProfilePic'].name ? fetchData.append('ProfilePic', formData['ProfilePic']) : formData['ProfilePic'] = '';

            fetchData.append('json', JSON.stringify(formData))

            console.log(fetchData)
        }

        const loading = new Loading()

        const response = await fetch('/profile/details', {
            method: "post",
            credentials: "same-origin",
            headers: {
                "Embedded": 'true'
            },
            body: fetchData
        })

        loading.destroy()

        const message = document.querySelector('#message')
        message.textContent = ''

        console.log(response)

        if (response.status !== 200) { message.textContent = (await response.json())["error"]; return }

        window.location.href = "/profile"
    })
}




start() 