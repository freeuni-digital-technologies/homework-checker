import {defaultPrepareSubmission, SubjectModule} from '../types/module'
import {Run} from "../runs";
import {Drive, Submission} from "dt-types";
import {testSubmission} from "codehskarel-tester";


function downloadAtInterval(_: Submission, __: number, ___: Run, ____: Drive): Promise<string> {
    return new Promise((resolve, _) => {
        resolve('')
    })
}



export const moduleGradesOnly: SubjectModule = {
    downloadAtInterval: downloadAtInterval,
    testSubmission: testSubmission,
    prepareSubmission: defaultPrepareSubmission,
    asynchronousTest: true,
    emailTemplates: {}
}
