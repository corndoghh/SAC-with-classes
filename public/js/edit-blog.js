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
        headers: {
            "Embedded": true
        },
        body: fetchData
    })

    const message = document.querySelector('#message')
    message.textContent = ''

    if (response.status !== 200) { message.textContent = (await response.json())["error"]; return }

    window.location.href = (await response.json()).location
})

const cancle = () => {
    window.location.href = window.location.pathname === '/blog/edit' ? 
    '/blog' + window.location.search : '/blogs' 
}

const deleteBlog = async () => {
    const response = await fetch('/blog/delete', {
        method: "post",
        credentials: "same-origin",
        headers: {
            'Content-Type': 'application/json',
            "Embedded": true
        },
        body: JSON.stringify({
            "UUID": document.querySelector('#editForm')[3].value 
        })
    })


    const message = document.querySelector('#message')
    message.textContent = ''

    if (response.status !== 200) { message.textContent = (await response.json())["error"]; return }

    window.location.href = (await response.json()).location

}
