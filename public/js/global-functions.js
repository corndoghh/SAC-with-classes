
class Loading {

    loadingOverlay
    spinner
    constructor() {
        this.loadingOverlay = document.createElement('div')
        this.loadingOverlay.setAttribute('class', 'loading-overlay')
        this.loadingOverlay.setAttribute('id', 'loading-overlay')
        this.spinner = document.createElement('div')
        this.spinner.setAttribute('class', 'spinner')
        this.loadingOverlay.appendChild(this.spinner)

        document.body.appendChild(this.loadingOverlay)
    }

    destroy = async () => {
        this.loadingOverlay.style.opacity = '0';
        this.loadingOverlay.style.visibility = 'hidden'; 

        await (new Promise(resolve => setTimeout(resolve, 1200)))

        document.body.removeChild(this.loadingOverlay)

    }
}

// const loadingDone = () => {
//     const loadingOverlay = document.getElementById('loading-overlay');
//     loadingOverlay.style.opacity = '0';
//     loadingOverlay.style.visibility = 'hidden'; 
// }

// const loading = () => {
//     const loadingOverlay = document.getElementById('loading-overlay');
//     loadingOverlay.style.opacity = '1';
//     loadingOverlay.style.visibility = 'shown'; 
// }

const addChildrenToID = async (entry, element = undefined) => {
    if (element === undefined) { element = document.getElementById(entry.id) }

    entry.children.forEach(child => {
        const childElement = document.createElement(child.type)

        Object.entries(child).forEach(([attribute, value]) => {
            if (attribute === 'type') { return }
            if (attribute === 'children') {
                addChildrenToID(child, childElement)
                return
            }

            
            childElement[attribute] = value;
            childElement.setAttribute(attribute, value)
        })


        element.appendChild(childElement)
    });

    console.log(element)

}