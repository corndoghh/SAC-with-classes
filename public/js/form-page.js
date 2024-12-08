document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = Object.fromEntries(new FormData(e.target))

    console.log(JSON.stringify(formData))

    const response = await fetch(document.getElementById('form').action, {
        method: 'post',
        credentials: 'same-origin',
        headers: {
            "Content-Type": 'application/json',
            "Embedded": true
        },
        body: JSON.stringify(formData)
    })

    const message = document.querySelector('#message')
    message.textContent = ''

    if (response.status !== 200) { message.textContent = (await response.json())["error"]; return }

    const jsonData = await response.json()

    href = jsonData.location 
    if (jsonData.message) { href += '?message='+jsonData.message }

    window.location.href = href
})