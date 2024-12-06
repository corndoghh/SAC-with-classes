document.querySelector('#editForm').addEventListener('submit', async (e) => {
    e.preventDefault()

    const fetchData = new FormData()

    const formData = Object.fromEntries(new FormData(e.target))
    formData['image'].name ? fetchData.append('image', formData['image']) : formData['image'] = '';
    fetchData.append('json', JSON.stringify(formData))
    console.log(fetchData)

    const response = await fetch(window.location.pathname, {
        method: "post",
        credentials: "same-origin",
        body: fetchData
    })

    const message = document.querySelector('#message')
    message.textContent = ''

    if (response.status !== 200) { message.textContent = (await response.json())["error"]; return }

    window.location.href = (await response.json()).location
    // const formJson = Object.fromEntries(new FormData(e.target))

    // console.log(formJson)

    // const response = await fetch('/blog/edit', {
    //     method: 'post',
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     credentials: "same-origin",
    //     body: JSON.stringify(formJson)
    // })

    // console.log(await response.json())

})