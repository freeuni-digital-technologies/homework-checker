import path from 'path'
import fs from "fs"

const dataDir = path.resolve(__dirname, '../../../data')
const manualResults = path.join(dataDir, 'manualResults')
const projectScores = path.join(manualResults, 'project_scores.json')
const projectFiles = path.join(projectScores, 'files')


export const defaultPaths = {
    data: dataDir,
    hwConfig: path.resolve(__dirname, '../../dt-homeworks'),
    manualResults: manualResults,
    emis: path.join(dataDir, 'emis.csv'),
    project: {
        scores: projectScores,
        files: projectFiles,
        info: path.join(dataDir, 'projects.json')
    },
}

export const defaultHwConfigFileName = 'config.js'
export const defaultScore = 3

export function config(dataDir: string) {
    const dataPath = dataDir.startsWith('.') ? path.resolve(__dirname, dataDir) : dataDir
    const subject = () => {
        if(!fs.existsSync(dataPath + "/subject.json")){
            throw new Error(`subject.json not found in ${dataPath} directory`);
        }
        return JSON.parse(fs.readFileSync(`${dataPath}/subject.json`).toString()).subject
    }
    const classroomPath = path.join(dataPath, 'credentials')
    return {
        subject: subject,
        paths: {
            classroom: {
                credentials: path.join(classroomPath, 'credentials.json'),
                token: path.join(classroomPath, 'token.json'),
            },
            studentList: path.join(dataPath, 'students.json'),
            results: path.join(dataPath, 'output'),
            submissions: path.join(dataPath, 'submissions')

        },
    }
}