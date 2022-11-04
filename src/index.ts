import {config, defaults} from './config'
import {getArgs} from './cli'

import {Authenticator, setupGoogleApi} from 'classroom-api'
import {Run, RunOpts} from './runs'
import {partitionResults} from './partitions'

import {getSubmissionsWithResults} from "./homeworkChecker";
import {HwConfig} from "./homework";
import {Drive, GoogleApi} from "dt-types";

// დროებით
function saveFile(drive: Drive, id: string, path: string) {
    return drive.saveFile(id, path)
}

export async function check(hw: HwConfig, runOpts: RunOpts) {
    const dataConfig = config(hw.dataDir || defaults.dataDir)
    const run = new Run(hw, runOpts)
    // const auth = new Authenticator(config.CLASSROOM_TOKEN_PATH, config.CLASSROOM_CREDENTIALS_PATH)
    const auth = new Authenticator(hw.dataDir + "/credentials/token.json", hw.dataDir + "/credentials/credentials.json")
    const googleApi: GoogleApi = await setupGoogleApi(auth, dataConfig.subject, dataConfig.STUDENTS_DATA_PATH)
    const getSubjectSubmissions = (s: string, hw: string) => googleApi.classroom.getSubmissions(hw)


    const submissions = await getSubmissionsWithResults(dataConfig.subject, hw, run, googleApi.drive, saveFile, getSubjectSubmissions);

    const results = await Promise.all(submissions)
    const output = partitionResults(results, hw)
    const dueDate = await googleApi.classroom.getDueDate(hw.name)
    run.saveRunInfo(output, dueDate)
    return output
}


if (require.main == module) {
    const  { hw, runOpts } = getArgs()
    check(hw, runOpts)
        .then(() => console.log("done."))
}