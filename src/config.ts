import path from 'path'
import fs from "fs"


const dataDir = path.resolve(__dirname, '../../../data')
export const defaults = {
    dataDir: dataDir,
    configFileName: 'config.js',
    hwConfigPath: path.resolve(__dirname, '../../dt-homeworks'),
    projectsPath: path.join(dataDir, 'manualResults/project_scores.json')
}

export function config(dataDir: string) {
    const dataPath = dataDir.startsWith('.') ? path.resolve(__dirname, dataDir) : dataDir
    return {
        subject: () => {
            if(!fs.existsSync(dataPath + "/subject.json")){
                throw new Error(`subject.json not found in ${dataPath} directory`);
            }
            return JSON.parse(fs.readFileSync(`${dataPath}/subject.json`).toString()).subject
        },
        STUDENTS_DATA_PATH: `${dataPath}/students.json`,
        CLASSROOM_CREDENTIALS_PATH: `${dataPath}/credentials/credentials.json`,
        CLASSROOM_TOKEN_PATH: `${dataPath}/credentials/token.json`,
        results_path: `${dataPath}/output`,
        submissions_path: `${dataPath}/submissions`
    }
}