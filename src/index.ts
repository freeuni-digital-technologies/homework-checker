import {config, defaults} from './config'
import {getArgs} from './cli'

import {Authenticator, setupGoogleApi} from 'classroom-api'
import {Run, RunOpts} from './runs'
import {partitionResults} from './partitions'

import {HomeworkChecker} from "./homeworkChecker";
import {HwConfig} from "./homework";
import {GoogleApi} from "dt-types";
import {moduleWeb} from "./modules/web";
import {moduleKarel} from "./modules/karel";
import {moduleProject} from "./modules/groupProject";
import {moduleMarkdown} from "./modules/markdown";
import {SubjectModule} from "./types/module";


export async function check(hw: HwConfig, runOpts: RunOpts, module: SubjectModule) {
    const dataConfig = config(hw.dataDir || defaults.dataDir)
    const run = new Run(hw, runOpts)
    // const auth = new Authenticator(config.CLASSROOM_TOKEN_PATH, config.CLASSROOM_CREDENTIALS_PATH)
    const auth = new Authenticator(hw.dataDir + "/credentials/token.json", hw.dataDir + "/credentials/credentials.json")
    const googleApi: GoogleApi = await setupGoogleApi(auth, dataConfig.subject(), dataConfig.STUDENTS_DATA_PATH)
    const homeworkChecker = new HomeworkChecker(googleApi, module, hw, run)

    const submissions = await homeworkChecker.getSubmissionsWithResults();

    const results = await Promise.all(submissions)
    const output = partitionResults(results, hw)
    const dueDate = await googleApi.classroom.getDueDate(hw.name)
    run.saveRunInfo(output, dueDate)
    return output
}


if (require.main == module) {

    const existingModules: any = {
        'web': moduleWeb,
        'karel': moduleKarel,
        'groupProject': moduleProject,
        'markdown': moduleMarkdown
    }


    const  { hw, runOpts } = getArgs()
    if (Object.keys(existingModules).includes(hw.module)) {
        const module: SubjectModule = existingModules[hw.module]
        check(hw, runOpts, module)
            .then(() => console.log("done."))
    } else {
        console.log(`module ${hw.module} not found`)
        process.exit(1)
    }

}