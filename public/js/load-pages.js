const loadPage = async () => {

    console.log(window.location.pathname);

    document.querySelector('#language-select').selectedIndex = {
        'en': 0,
        'es': 1,
        'fr': 2,
        'de': 3
    }[document.querySelector('#language-select').getAttribute('current')];

    (await (await fetch(`../json/header.json`)).json()).forEach(element => {
        addChildrenToID(element, undefined, '#includes')
    });   


    const data = await fetch(`../json/${window.location.pathname === '/' ? 'main' : window.location.pathname}.json`)

    if (data.status === 404) { return }
    console.log(data)
    const jsonData = await data.json()

    console.log(jsonData)

    jsonData.forEach(element => {
        addChildrenToID(element, undefined, '#mainPage')
    });

}



loadPage()