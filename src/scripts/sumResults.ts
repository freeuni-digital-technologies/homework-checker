import fs from 'fs'
import path from 'path'
import {readHomeworkConfiguration} from '../homework'
import {mergeResults} from '../partitions'
import {flattenProjectResults, ProjectResult} from "./sumProjectResults";
import {ProjectsInfo} from "../types/projectsInfo";
import fse from "fs-extra";
import {defaultPaths} from "../config";
import * as config from '../config'
import {Result} from "website-tester";

const invalidEntries: any[] = []

/**
 * მოაგროვებს ყველა დავალების ბოლო შედეგს და
 * დაამატებს/გადაწერს ხელით შეყვანილ ქულებს csv ფაილებში
 */
export function summarizeResults(
    addBonusScores: boolean = false,
    emisFileName: string = defaultPaths.emis,
    manualResultsPath: string = defaultPaths.manualResults,
    homeworksPath: string = defaultPaths.hwConfig) {
    const studentNames = readStudentList(emisFileName)
    const results: any = {}
    studentNames.forEach(s => results[s] = {total: 0, before_exam: 0, total_bonus: 0})
    addHomeworkResults(results, studentNames, homeworksPath)
    try {
        addProjectResults(results)
    } catch {}
    addManualResults(results, studentNames, manualResultsPath)

    splitBonusFromProjectResult(results, studentNames, manualResultsPath)

    studentNames.forEach(emailId => {
        const studentResults = results[emailId]
        // @ts-ignore
        const sum: number = Object.keys(studentResults)
            .filter(k => k.startsWith('quiz') || k.startsWith('hw') || k.startsWith('project'))
            .map(k => studentResults[k])
            .reduce((a: number, b: number) => a + b, 0)
        studentResults.before_exam = Number(sum.toFixed(2))
    })

    if (addBonusScores) {
        distributeBonusScores(results, studentNames, manualResultsPath)
    }

    addExamResults(results, studentNames, manualResultsPath)

    studentNames.forEach(emailId => {
        const studentResults = results[emailId]
        const exam_score: number = Math.max(studentResults.final_exam || 0, studentResults.exam_retake || 0)
        studentResults.total = (studentResults.before_exam + exam_score).toFixed(2)
    })

    const invalidList = invalidEntries.map(e => `${e.name},${e.emailId}`).join('\n')
    fs.writeFileSync(path.resolve(process.cwd(), '../../invalid.csv'), invalidList)
    return results;
}

function addManualResults(results: any, studentNames: String[], manualResultsPath: string) {
    if (!fs.existsSync(manualResultsPath)) {
        return
    }
    fs
        .readdirSync(manualResultsPath)
        .filter(f => f.includes('.csv'))
        .forEach(f => {
            if (f.includes("quiz")) {
                if (!f.includes('users')) {
                    addQuizCsvResults(results, studentNames, manualResultsPath, f)
                }
            } else {
                if (f.startsWith('hw') || f.startsWith('bonus') || f.startsWith('project')) {
                    addSimpleCsvResults(results, studentNames, manualResultsPath, f)
                }
            }
        })
}

function addExamResults(results: any, studentNames: String[], manualResultsPath: string) {
    if (!fs.existsSync(manualResultsPath)) {
        return
    }
    fs
        .readdirSync(manualResultsPath)
        .filter(f => f.includes('.csv'))
        .filter(f => f.includes('final exam') || f.includes('final retake'))
        .forEach(f => {
            const name = f.includes('final exam') ? 'final exam' : 'final retake'
            addMoodleResults(name.replaceAll(' ', '_'), results, studentNames, manualResultsPath, f)
        })
}

function distributeBonusScores(results: any, studentNames: String[], manualResultsPath: string) {
    const componentMaxScores = {
        quiz: 0,
        hw: 0,
        project: 0,
        beforeExam: 0
    }
    const componentScores = readCsv(manualResultsPath, 'component_scores.csv')
    function findComponent(name: string) {
        return Number(componentScores.find(line => line[0] == name)![1])
    }
    componentMaxScores.beforeExam = findComponent('before_exam')
    componentMaxScores.hw = findComponent('hw')
    componentMaxScores.project = findComponent('project')
    componentMaxScores.quiz = findComponent('quiz')
    studentNames.forEach(emailId => {
        // @ts-ignore
        const studentResults = results[emailId]
        const bonusHws = Object.keys(studentResults).filter(k => k.startsWith('bonus'))
        const beforeExamSum = studentResults.before_exam
        if (beforeExamSum >= componentMaxScores.beforeExam) {
            // student reached maximum score already
            return
        }
        let bonusSum: number = sumList(bonusHws.map(hwName => studentResults[hwName]))
        studentResults.total_bonus = bonusSum
        if (bonusSum == 0) {
            // nothing to do
            return
        }
        const shualeduriComponents = Object.keys(studentResults).filter(k =>
            k.startsWith('quiz') || k.startsWith('hw') || k.startsWith('project')
        )
        function findMaxScore(componentName: string): number {
            const componentTypeName = Object.keys(componentMaxScores).find(k => componentName.startsWith(k))!
            // @ts-ignore
            return componentMaxScores[componentTypeName]
        }
        if (beforeExamSum + bonusSum >= componentMaxScores.beforeExam) {
            // write maximum Score in every component
            shualeduriComponents.forEach(c => studentResults[c] = findMaxScore(c))
        } else {
            let bonusSumToDistribute = bonusSum
            const componentsThatAreNotMax = shualeduriComponents
                .filter(c => studentResults[c] < findMaxScore(c))
            componentsThatAreNotMax.forEach(c => {
                const score = studentResults[c]
                const scoreUntilMaximum = findMaxScore(c) - score
                const scoreToAdd = Math.min(bonusSumToDistribute, scoreUntilMaximum)
                bonusSumToDistribute -= scoreToAdd
                studentResults[c] = score + scoreToAdd
            })
        }
        //     quiz or hw or project
    })
}

function splitBonusFromProjectResult(results: any, studentNames: String[], manualResultsPath: string) {
    const componentScores = readCsv(manualResultsPath, 'component_scores.csv')
    function findComponent(name: string) {
        return Number(componentScores.find(line => line[0] == name)![1])
    }
    const projectMaxScore = findComponent('project')
    studentNames.forEach(emailId => {
        // @ts-ignore
        const studentResults = results[emailId]
        studentResults.bonus_project = 0
        if (studentResults.project > projectMaxScore) {
            const bonus = studentResults.project - projectMaxScore
            studentResults.project = projectMaxScore
            studentResults.bonus_project = bonus
        }
        //     quiz or hw or project
    })
}

function sumList(list: number[]): number {
    return list.reduce((a: number, b: number) => a + b, 0)
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
    const quizId = resultsFile.split('quiz')[1].split('-')[0]
    const name = 'quiz' + quizId
    addMoodleResults(name, results, studentNames, manualResultsPath, resultsFile)
}

function addMoodleResults(name: string, results: any, studentNames: String[], manualResultsPath: string, resultsFile: string) {
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
        .filter(f => f.name !== 'other-karel-hws' && f.name !== 'bonus-topic')
        .map(dir => dir.name)
        .map(hwName => {
            const hwPath = `${homeworksPath}/${hwName}/config.js`
            const hw = readHomeworkConfiguration(hwPath, false)
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
                        results[r.emailId][hw.id] = config.defaultScore
                    } else if (r.status == 'failed') {
                        const score = r.classroomGrade || r.results.filter((t: Result) => t.passed).length / r.results.length * config.defaultScore
                        results[r.emailId][hw.id] = Math.ceil(score)
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
    let studentNames = readStudentList(defaultPaths.emis)
    let hwList = Object.keys(resultsList[studentNames[0]]).join(',')
    let csv = `emailId,` + hwList + '\n'
    csv += studentNames.map(emailId => {
        const entries = resultsList[emailId]
        const results = Object.values(entries)
        return `${emailId},${results.join(',')}`
    }).join('\n')
    return csv
}

function addProjectResults(results: any) {
    const projectResults = JSON.parse(fse.readFileSync(defaultPaths.project.scores, 'utf-8'))
        .map((e: any) => new ProjectResult(e))
    const pi = new ProjectsInfo(defaultPaths.project.info, defaultPaths.project.files)
   flattenProjectResults(projectResults, pi)
        .map(e => {
            const { result, emailId } = e
            results[emailId]['project'] = result.sum()
        })
}

if (require.main == module) {
    console.log(convertToCsv(summarizeResults(true)))
}