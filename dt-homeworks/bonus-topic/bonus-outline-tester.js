const {expect} = require("chai");

let extractId = elem => {return elem.id.substring(0, elem.id.indexOf('-'))}

module.exports.assertions = [
    document => {
        const divs = document.getElementsByTagName("div")
        return expect(divs).length(9, 'დოკუმენტში უნდა იყოს ცხრა სატესტო ელემენტი')
    },
    document => {
        const divs = document.getElementsByTagName("div")
        const titles = divs.filter(elem => {
            return extractId(elem) === "title"
        })
        return expect(titles).length(3, 'დოკუმენტში უნდა იყოს სამი თემის სათაური')
    },
    document => {
        const divs = document.getElementsByTagName("div")
        const motivations = divs.filter(elem => {
            return extractId(elem) === "motivation"
        })
        return expect(motivations).length(3, 'დოკუმენტში უნდა იყოს სამი მოტივაციის პარაგრაფი')
    },
    document => {
        const divs = document.getElementsByTagName("div")
        const resources = divs.filter(elem => {
            return extractId(elem) === "resources"
        })
        return expect(resources).length(3, 'დოკუმენტში უნდა იყოს სამი რესურსების ჩამონათვალი')
    },
    document => {
        const titles = document.getElementsByTagName("div").filter(elem => {
            return extractId(elem) === "title"
        })

        const headings = titles.filter(title => {
            let motivationCount = 0;
            let resourceCount = 0;
            let currTitle = title.nextElementSibling;
            while(extractId(currTitle) !== 'title') {
                let titleId = extractId(currTitle)
                if(titleId === 'motivation') {
                    if(motivationCount > 0) {
                        return false
                    } else {
                        motivationCount++;
                    }
                }

                if(titleId === 'resources') {
                    if(resourceCount > 0) {
                        return false
                    } else {
                        resourceCount++;
                    }
                }

                if(currTitle.nextElementSibling === null)
                    break

                currTitle = currTitle.nextElementSibling
            }
            return true;
        })

        return expect(headings).length(3, 'თითოეულ თემაში არის მხოლოდ ერთი რესურები და ერთი მოტივაცია')
    },
    document => {
        let motivations = document.getElementsByTagName("div").filter(elem => {
            return extractId(elem) === "motivation"
        })

        motivations = motivations.filter(motivation => {
            let currElem = motivation.nextElementSibling
            let childArray = []
            while(extractId(currElem) !== 'resources') {
                if(currElem.innerText !== '')
                    childArray.push(currElem)
                currElem = currElem.nextElementSibling
            }
            return childArray.length > 0
        })

        return expect(motivations).length(3, 'თითოეული მოტივაცია არ უნდა იყოს ცარიელი')
    },
    document => {
        let resources = document.getElementsByTagName("div").filter(elem => {
            return extractId(elem) === "resources"
        })

        resources = resources.filter(resource => {
                if (resource.nextElementSibling === null) {
                    return false
                }

                if (resource.nextElementSibling.rawTagName !== 'ol')
                    return false

                let uniqueArr = []

                resource.nextElementSibling.childNodes.forEach(elem => {
                    if (elem.rawTagName === 'li') {
                        if (uniqueArr.indexOf(elem.innerText) === -1) {
                            uniqueArr.push(elem.innerText)
                        }
                    }
                })

                return uniqueArr.length === 3;
            }
        )

        return expect(resources).to.have.length.above(2, 'ყოველ რესურსების ელემენტში არის 3 უნიკალური ლინკი')
    },
]