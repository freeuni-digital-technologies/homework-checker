import { config } from './config'
import { getArgs } from './cli'

import { createDrive, getSubmissions, saveFile, StudentList, Authenticator } from 'classroom-api'
import {Run, RunOpts} from './runs'
import { partitionResults } from './partitions'

import { getSubmissionsWithResults } from "./homeworkChecker";
import {HwConfig} from "./homework";



export async function main(hw: HwConfig, runOpts: RunOpts) {
    const run = new Run(hw, runOpts)
    // const auth = new Authenticator(config.CLASSROOM_TOKEN_PATH, config.CLASSROOM_CREDENTIALS_PATH)
    const auth = new Authenticator(hw.dataDir + "/credentials/token.json", hw.dataDir + "/credentials/credentials.json")
    const drive = await createDrive(auth);
    const students = new StudentList(hw.dataDir + "/students.json");
    // დროებით წავა
    const getSubjectSubmissions = (s: string, hw: string) => getSubmissions(s, hw, students, auth)

    // TODO აქ ეს ორი await რაღაც სტრანნადაა და გადასახედია
    const submissions = await getSubmissionsWithResults(config.subject, hw, run, drive, saveFile, getSubjectSubmissions);

    const results = await Promise.all(submissions)
    const output = partitionResults(results, hw)

    run.saveRunInfo(output)
    return output
}


if (require.main == module) {
    const  { hw, runOpts } = getArgs()
    main(hw, runOpts)
        .then(e => console.log("done."))
}