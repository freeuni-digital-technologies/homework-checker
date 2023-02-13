import {ArgumentParser} from "argparse";
import {sendEmails} from "classroom-api";
import fse from "fs-extra";
import { ProjectsInfo } from "../types/projectsInfo";
import {summarizeResults} from "./sumResults";
import {ProjectGroup} from "../modules/groupProject";
import {
    ProjectResult,
    flattenProjectResults
} from './sumProjectResults';
import {defaultPaths} from "../config";


const maxScore = 60
const defaultScores = {
    functionality: 5,
    design: 5,
    concept: 4,
    report: 6,
}

function notifyResults(projectScoresPath = defaultPaths.project.scores,
                       projectsInfoPath = defaultPaths.project.info,
                       projectFilesPath = defaultPaths.project.files) {
    const parser = new ArgumentParser({
        addHelp: true
    })
    parser.addArgument(['-t', '--trial'], {help: 'dont save output/print emails not send'})
    parser.addArgument(['-c', '--continue'], {help: 'continue from email id'})
    const args = parser.parseArgs()
    const results = JSON.parse(fse.readFileSync(projectScoresPath, 'utf-8'))
        .map((e: any) => new ProjectResult(e))
    const pi = new ProjectsInfo(projectsInfoPath, projectFilesPath)
    const summariesWithoutBonus = summarizeResults(false)
    const summariesWithBonus = summarizeResults(true)
    const emails = getEmails(results, pi, summariesWithoutBonus, summariesWithBonus)
    const continueFromAddress = args.continue + '@freeuni.edu.ge'
    const continueFrom = args.continue ? emails.map(e => e.to).indexOf(continueFromAddress) : 0
    const emailsToSend = emails.slice(continueFrom, emails.length)
    if (args.trial) {
        console.log(emailsToSend)
    } else {
        sendEmails(emailsToSend, 2000)

    }
}

function getEmails(results: ProjectResult[], pi: ProjectsInfo, summariesWithoutBonus: any, summariesWithBonus: any) {
    return flattenProjectResults(results, pi)
       .map(r => {
           const { result, emailId } = r
           const body = template(result, pi.findTeamWithId(result.groupId)!, summariesWithoutBonus[emailId], summariesWithBonus[emailId])
           return {
               to: emailId + '@freeuni.edu.ge',
               subject: 'პროექტის და შუალედური შეფასება - შესავალი ციფრულ ტექნოლოგიებში',
               text: body
           }
       })
}

function template(result: ProjectResult, pj: ProjectGroup, summariesWithoutBonus: any, summariesWithBonus: any) {
    return `
    <p>გამარჯობა,</p>
    ${projectScore(result)}
    ${message(result)}
    ${totalScore(summariesWithoutBonus, summariesWithBonus)}
    <p>წარმატებები,</p>
    <p>ია</p>
`
}


function totalScore(scoresWithoutBonus: any, scoresWithBonus: any) {
    const bonusPart = `<p>დამატებით, მიღებული გაქვს ${scoresWithBonus.total_bonus} ბონუს ქულა. 
აქ შედის დისკუსიის და პროექტის ბონუსიც.</p>
    <p>ეს ქულები გადანაწილდება საგნის დანარჩენ კომპონენტებზე და ემისზე შევა შემდეგნაირად:</p>
    <p>
    ${Object.keys(scoresWithBonus)
        .filter(s => s.startsWith('hw') || s.startsWith('project') || s.startsWith('quiz'))
        .map(s => `${s} - ${scoresWithBonus[s]}`)
        .join('<br>')}
    </p>
    <p>${getBonusMessage(scoresWithBonus.before_exam + scoresWithBonus.total_bonus)}</p>`

    return `
    <p>დავალებებში, ქვიზებსა და პროექტში დააგროვე ${scoresWithBonus.before_exam} ქულა:</p>
    <p>
    ${Object.keys(scoresWithoutBonus)
            .filter(s => s.startsWith('hw') || s.startsWith('project') || s.startsWith('quiz'))
            .map(s => `${s} - ${scoresWithoutBonus[s]}`)
            .join('<br>')}
    </p>
    ${scoresWithBonus.total_bonus > 0 ? bonusPart : ''}
`
}

function getBonusMessage(sum: number) {
    const diff = sum - maxScore
    if (diff <= 0) {
        return ''
    }
    return `ბონუს ქულები არის
    შუალედური შეფასების ნაწილი და ემატება მხოლოდ დავალებებში, ქვიზში, ან პროექტში დაკლებულ ქულებს. მაქსიმალური შუალედური შეფასება 
    ${maxScore} ქულაა, ამიტომ ${maxScore}-ს ზემოთ ბონუს ქულები ვერ აისახება საბოლოო შეფასებაში 
    (ფინალურ გამოცდას არ ემატება).`
}

function projectScore(result: ProjectResult) {
    return `
    <p>პროექტის შეფასება: <br>
        იდეა: ${result.concept} ქულა ${defaultScores.concept}-დან<br> 
        დიზაინი: ${result.design} ქულა ${defaultScores.design}-დან<br>
        ფუნქციონალი: ${result.functionality} ქულა ${defaultScores.functionality}-დან<br>
        report: ${result.report} ქულა ${defaultScores.report}-დან<br>
    </p>
    `
}

function message(result: ProjectResult) {
    if (result.comment.trim().length == 0) {
        return ``
    }
    return `
        <p>შენმა პროექტმა ასევე მიიღო ეს დამატებითი კომენტარი:</p>
        <p><em><strong>${result.comment}</strong></em></p>
        `
}


if (require.main == module) {
    notifyResults()
}