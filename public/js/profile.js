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

document.getElementById("dark-mode-input").onclick = async () => { await toggleMode(); };


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

    if ((await fetch('/profile/pfp', {
        method: 'get',
        headers: {
            "Content-Type": "image/png"
        },
        credentials: "same-origin"
    })).status !== 404) { document.querySelector('#profile-pic-preview').src = '/profile/pfp' }

    TwoFactor.checked = jsonData["TwoFactor"] === "on" ? true : false
    FirstName.placeholder = jsonData.FirstName
    LastName.placeholder = jsonData.LastName
    Username.placeholder = jsonData.Username

    loading.destroy()

    document.querySelector(`#form`).addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = Object.fromEntries(new FormData(e.target))

        const message = document.querySelector('#message')

        if (!formData['TwoFactor']) { formData['TwoFactor'] = 'off' }

        if (formData.NewPassword && !formData.OldPassword) { message.textContent = 'You need to enter your old password before updating it'; return }

        if (!formData.NewPassword && formData.OldPassword) { message.textContent = 'No new password provided'; return }

        for (item in formData) {
            console.log(item, formData.hasOwnProperty(item) && !!formData[item])

            if (item === "language" || item === 'TwoFactor') { continue }

            if (!(formData.hasOwnProperty(item) && !!formData[item])) { continue }
            if (!jsonData.hasOwnProperty(item)) { continue }

            if (jsonData[item] === formData[item]) {
                message.textContent = 'You cannot update a value to the existing value'
                return
            }

        }

        if (formData.NewPassword && formData.OldPassword === formData.NewPassword) { message.textContent = 'New password cannot be the same as the old one'; return }

        if (formData['ProfilePic'].name !== '') {
            const imageData = new FormData();
            imageData.append('image', formData['ProfilePic']);

            await fetch('/upload-picture', {
                method: 'post',
                body: imageData,
                credentials: 'same-origin'
            })

        }

        message.textContent = ''

        console.log(formData.language)

        const loading = new Loading()

        const response = await fetch('/update-details', {
            method: "post",
            headers: requestHeaders,
            credentials: "same-origin",
            body: JSON.stringify(formData)
        })

        loading.destroy()

        if (response.status === 409) { message.textContent = (await response.json())["error"]; return }

        window.location.href = "/profile"

    })
}




start() 