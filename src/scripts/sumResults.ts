import fs from 'fs'
import path from 'path'
import {readHomeworkConfiguration} from '../homework'
import {mergeResults} from '../partitions'
import {logProjectResults, projectFilesPath, ProjectResult, projectsPath} from "./sumProjectResults";
import {ProjectsInfo} from "../types/projectsInfo";
import fse from "fs-extra";
import {defaults} from "../config";

const defaultHwPath = defaults.hwConfigPath
const defaultEmisPath = path.join(defaults.dataDir, '/emis.csv')
const defaultManualResultsPath = path.join(defaults.dataDir, '/manualResults')

const defaultScore = 4
const invalidEntries: any[] = []

/**
 * მოაგროვებს ყველა დავალების ბოლო შედეგს და
 * დაამატებს/გადაწერს ხელით შეყვანილ ქულებს csv ფაილებში
 */
export function summarizeResults(
    emisFileName: string = defaultEmisPath,
    manualResultsPath: string = defaultManualResultsPath,
    homeworksPath: string = defaultHwPath) {
    const studentNames = readStudentList(emisFileName)
    const results: any = {}
    studentNames.forEach(s => results[s] = {sum: 0})
    addHomeworkResults(results, studentNames, homeworksPath)
    try {
        const projectResults = JSON.parse(fse.readFileSync(defaults.projectsPath, 'utf-8'))
            .map((e: any) => new ProjectResult(e))
        const pi = new ProjectsInfo(projectsPath + '/projects.json', projectFilesPath)
        logProjectResults(projectResults, pi)
    } catch {}
    addManualResults(results, studentNames, manualResultsPath)
    studentNames.forEach(emailId => {
        const studentResults = results[emailId]
        // @ts-ignore
        const sum: number = Object.values(studentResults).reduce((a: number, b: number) => a + b, 0)
        studentResults.sum = Number(sum.toFixed(2))
    })
    const invalidList = invalidEntries.map(e => `${e.name},${e.emailId}`).join('\n')
    fs.writeFileSync(path.resolve(process.cwd(), '../../invalid.csv'), invalidList)
    return results;
}

function addManualResults(results: any, studentNames: String[], manualResultsPath: string) {
    fs
        .readdirSync(manualResultsPath)
        .filter(f => f.includes('.csv'))
        .forEach(f => {
            if (f.includes("quiz") && !f.includes('users')) {
                addQuizCsvResults(results, studentNames, manualResultsPath, f)
            } else {
                addSimpleCsvResults(results, studentNames, manualResultsPath, f)
            }
        })
}

function addSimpleCsvResults(results: any, studentNames: String[], manualResultsPath: string, resultsFile: string) {
    const name = resultsFile.split('.')[0].trim()
    studentNames.forEach(n => {
        // @ts-ignore
        if (!results[n][name]) {
            // @ts-ignore
            results[n][name] = 0
        }
    })
    readCsv(manualResultsPath, resultsFile)
        .forEach(line => {
            const emailId = line[0].toLowerCase().trim()
            const score = Number(line[1])
            if (studentNames.includes(emailId)) {
                results[emailId][name] = score
            } else {
                invalidEntries.push({
                    name: name,
                    emailId: emailId
                })
            }
        })
}

function readCsv(manualResultsPath: string, resultsFile: string) {
    return fs.readFileSync(`${manualResultsPath}/${resultsFile}`, 'utf-8')
        .split('\n')
        .filter(l => l != '')
        .map(l => l.split(','));
}

function addQuizCsvResults(results: any, studentNames: String[], manualResultsPath: string, resultsFile: string) {
    const quizId = resultsFile.split('quiz ')[1].split('-')[0]
    const name = 'quiz' + quizId
    // @ts-ignore
    studentNames.forEach(n => results[n][name] = 0)
    const studentNameOverrides: any = {}
    const overridesFile = name + '_users.csv'
    if (fs.existsSync(manualResultsPath + '/' + overridesFile)) {
        readCsv(manualResultsPath, name + '_users.csv')
            .forEach(line => studentNameOverrides[line[0]] = line[1])
    }
    readCsv(manualResultsPath, resultsFile)
        .forEach(line => {
            const emailId = line[4].split('@')[0].toLowerCase().trim()
            const score = isNaN(Number(line[9])) ? 0 : Number(line[9])
            if (studentNames.includes(emailId)) {
                results[emailId][name] = score
            } else if (line[0] == 'placement') {
                const userId = line[1].split('-')[1]
                if (studentNameOverrides[userId]) {
                    results[studentNameOverrides[userId]][name] = score
                }
            } else {
                invalidEntries.push({
                    name: name,
                    emailId: emailId
                })
            }
        })
}

function addHomeworkResults(results: any, studentNames: string[], homeworksPath: string) {
    fs
        .readdirSync(homeworksPath, {withFileTypes: true})
        .filter(f => f.isDirectory() && !f.name.startsWith('.') && !f.name.includes('group-project'))
        .filter(f => f.name !== 'other-karel-hws')
        .map(dir => dir.name)
        .map(hwName => {
            const hwPath = `${homeworksPath}/${hwName}/config.js`
            const hw = readHomeworkConfiguration(hwPath)
            studentNames.forEach(s => results[s][hw.id] = 0)
            const hwResults = mergeResults(hw, {})
            hwResults
                .map(r => {
                    if (!studentNames.includes(r.emailId)) {
                        invalidEntries.push({
                            name: hwName,
                            emailId: r.emailId
                        })
                    }
                    return r
                })
                .filter(r => studentNames.includes(r.emailId))
                .forEach(r => {
                    if (r.status == 'passed') {
                        results[r.emailId][hw.id] = defaultScore
                    } else if (r.status == 'failed') {
                        const score = r.results.filter(t => t.passed).length / r.results.length * defaultScore
                        results[r.emailId][hw.id] = Number(score.toFixed(2))
                    } else {
                        results[r.emailId][hw.id] = 0
                    }
                })
        })
}

function readStudentList(emisFileName: string) {
    return fs.readFileSync(path.resolve(emisFileName), 'utf-8')
        .split('\n')
        .filter(line => line.length > 0)
        .filter(line => !line.startsWith('"სახელი'))
        .map(line => line.split(',')[1])
        .map(email => email.split('@')[0])
}

/**
 * დაითვლის შედეგების ქულებს
 */

export function convertToCsv(resultsList: any) {
    let studentNames = readStudentList(defaultEmisPath)
    let hwList = Object.keys(resultsList[studentNames[0]]).join(',')
    let csv = `emailId,` + hwList + '\n'
    csv += studentNames.map(emailId => {
        const entries = resultsList[emailId]
        const results = Object.values(entries)
        return `${emailId},${results.join(',')}`
    }).join('\n')
    return csv
}

if (require.main == module) {
    console.log(convertToCsv(summarizeResults()))
}