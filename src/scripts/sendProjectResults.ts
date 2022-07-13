import {ArgumentParser} from "argparse";
import {sendEmails} from "classroom-api";
import fse from "fs-extra";
import { ProjectsInfo } from "../types/projectsInfo";
import {summarizeResults} from "./sumResults";
import {ProjectGroup} from "../modules/groupProject";
import {
    ProjectResult,
    logProjectResults,
    projectsPath,
    projectFilesPath,
    flattenProjectResults
} from './sumProjectResults';



function notifyResults() {
    const parser = new ArgumentParser({
        addHelp: true
    })
    parser.addArgument(['-t', '--trial'], {help: 'dont save output/print emails not send'})
    parser.addArgument(['-c', '--continue'], {help: 'continue from email id'})
    const args = parser.parseArgs()
    const results = JSON.parse(fse.readFileSync('/Users/ia/dev/data/manualResults/project_scores.json', 'utf-8'))
        .map((e: any) => new ProjectResult(e))
    const pi = new ProjectsInfo(projectsPath + '/projects.json', projectFilesPath)
    logProjectResults(results, pi)
    const summaries = summarizeResults()
    const emails = getEmails(results, pi, summaries)
    const continueFromAddress = args.continue + '@freeuni.edu.ge'
    const continueFrom = args.continue ? emails.map(e => e.to).indexOf(continueFromAddress) : 0
    const emailsToSend = emails.slice(continueFrom, emails.length)
    if (args.trial) {
        console.log(emailsToSend)
    } else {
        sendEmails(emailsToSend, 2000)

    }
}

function getEmails(results: ProjectResult[], pi: ProjectsInfo, summaries: any) {
    return flattenProjectResults(results, pi)
       .map(r => {
           const { result, emailId } = r
           const body = template(result, pi.findTeamWithId(result.groupId)!, summaries[emailId])
           return {
               to: emailId + '@freeuni.edu.ge',
               subject: 'პროექტის და შუალედური შეფასება - შესავალი ციფრულ ტექნოლოგიებში',
               text: body
           }
       })
}

function template(result: ProjectResult, pj: ProjectGroup, summary: any) {
    return `
    <p>გამარჯობა,</p>
    ${info}
    ${projectScore(result)}
    ${message(result)}
    ${totalScore(summary)}
    <p>წარმატებები,</p>
    <p>ია</p>
`
}


function totalScore(scores: any) {
    let message = `შენი შუალედური შეფასება პროექტთან ერთად არის ${Math.min(scores.sum, 70)}.`
    if (scores.sum > 70) {
         message = message + ` (ბონუსებით სულ დაგროვებული გაქვს გაქვს ${scores.sum}, მაქსიმალურ შეფასებაზე მეტი).`
    }
    return `
    <p>${message}</p>
    <p>
    ${Object.keys(scores)
            .filter(s => s != 'sum')
            .map(s => `${scores[s]} - ${s}`)
            .join('<br>')}
    </p>
    <p>${getBonusMessage(scores.sum)}</p>
`
}

function getBonusMessage(sum: number) {
    const diff = sum - 70
    if (diff <= 0) {
        return ''
    }
    const disclaimer = `როგორც რამდენჯერმე ვთქვი და ასევე დაკონკრეტებულია სილაბუსში, ბონუს ქულები არის
    შუალედური შეფასების ნაწილი. ასევე არის ინფორმაცია საიტზე, სადაც ბონუს ქულებით სარგებლობა 
    განსაზღვრულია მხოლოდ დავალების ან ქვიზის ქულების აღსადგენად. მაქსიმალური შუალედური შეფასება 
    70 ქულაა, ამიტომ 70-ს ზემოთ ბონუს ქულები ვერ აისახება საბოლოო შეფასებაში (ფინალურ გამოცდას არ ემატება).
    შენ მაქსიმალურზე მეტი ქულა გაქვს აღებული, მიხარია თუ საინტერესო იყო ეს საგანი და მადლობა მინდა გადაგიხადო
     მონდომებისთვის და მოტივაციისთვის.
    `
    if (diff >= 5) {
        return disclaimer + `ასევე, მინდა აღვნიშნო, რომ შენ განსაკუთრებით ბევრი ბონუსი გაქვს (მხოლოდ ორი სტუდენტი ხართ ასეთი).`
    }
   return disclaimer
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

const info = `
 <div>
    <p>ქვემოთ იხილავ პროექტის შეფასებას და ჯამურ შუალედურ ქულას. ამ მეილებს ვგზავნი ეტაპობრივად, სხვებს მოგვიანებით 
    მიუვათ.
    <strong>აუცილებელია, </strong> რომ გადაამოწმო ყველა კომპონენტის შეფასება და დამიკავშირდე, თუ
    რამე არასწორია. ძირითადად ასეთი შემთხვევები არის სტუდენტის მიერ ინსტრუქციის დარღვევის, მუდლის, იშვიათად
    პროგრამის ან ბონუსის ჩანიშვნის დავიწყების. ასევე, რამდენიმე შემთხვევა იყო საპატიო მიზეზის გამო 
    დაგვიანებით ჩათვლილი დავალების და შეიძლება ხელით შეყვანისას email id შემშლოდა. 
    გამოგზავნამდე მაქსიმალურად ვამოწმებ ამ ყველაფერს და ინდივიდუალურადაც დავუკავშირდი ზოგ სტუდენტს დეტალების 
    დასაზუსტებლად, მაგრამ მაინც მჭირდება დახმარება.
    </p>
    <p>ემისზე ქულებს (შუალედურ შეფასებას და გამოცდას) შევიყვან 1 ან 2 კვირაში.</p>
 </div>
`

function message(result: ProjectResult) {
    if (result.comment.trim().length == 0) {
        return ``
    }
    return `
        <p>შენმა პროექტმა ასევე მიიღო ეს დამატებითი კომენტარი:</p>
        <p><em><strong>${result.comment}</strong></em></p>
        `
}

const defaultScores = {
    functionality: 7,
    design: 7,
    concept: 5,
    report: 5,
}

if (require.main == module) {
    notifyResults()
}