const loadPage = async () => {

    const jsonData = await (await fetch('../json/about-us.json')).json()

    console.log(jsonData)

    jsonData.forEach(element => {
        addChildrenToID(element)
        
    });


}


loadPage()