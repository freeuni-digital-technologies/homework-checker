import {config} from './config'
import {getArgs} from './cli'

import {Authenticator, createDrive, getDueDate, getSubmissions, saveFile, StudentList} from 'classroom-api'
import {Run, RunOpts} from './runs'
import {partitionResults} from './partitions'

import {getSubmissionsWithResults} from "./homeworkChecker";
import {HwConfig} from "./homework";


export async function check(hw: HwConfig, runOpts: RunOpts) {
    const run = new Run(hw, runOpts)
    // const auth = new Authenticator(config.CLASSROOM_TOKEN_PATH, config.CLASSROOM_CREDENTIALS_PATH)
    const auth = new Authenticator(hw.dataDir + "/credentials/token.json", hw.dataDir + "/credentials/credentials.json")
    const drive = await createDrive(auth);
    const students = new StudentList(hw.dataDir + "/students.json");
    // დროებით წავა
    const getSubjectSubmissions = (s: string, hw: string) => getSubmissions(s, hw, students, auth)

    // TODO აქ ეს ორი await რაღაც სტრანნადაა და გადასახედია
    const dataConfig = config(hw.dataDir)
    const submissions = await getSubmissionsWithResults(dataConfig.subject, hw, run, drive, saveFile, getSubjectSubmissions);

    const results = await Promise.all(submissions)
    const output = partitionResults(results, hw)
    const dueDate = await getDueDate(config.subject, hw.name, auth)
    run.saveRunInfo(output, dueDate)
    return output
}


if (require.main == module) {
    const  { hw, runOpts } = getArgs()
    check(hw, runOpts)
        .then(() => console.log("done."))
}