const {expect} = require("chai");

let extractId = elem => {return elem.id.substring(0, elem.id.indexOf('-'))}

module.exports.assertions = [
    document => {
        const divs = document.getElementsByTagName("div")
        return expect(divs).length(10, 'დოკუმენტში უნდა იყოს ცხრა სატესტო ელემენტი')
    },
    document => {
        const divs = document.getElementsByTagName("div")
        const titles = divs.filter(elem => {
            return extractId(elem) === "title"
        })
        return expect(titles).length(3, 'დოკუმენტში უნდა იყოს სამი თემის სათაური')
    },
]