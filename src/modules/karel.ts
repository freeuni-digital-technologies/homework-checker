import {Submission} from 'dt-types';
import {Run} from "../runs";
import {Drive} from "classroom-api"

import {defaultPrepareSubmission, SubjectModule} from '../types/module'
import {testSubmission} from "codehskarel-tester";

export function downloadAtInterval(submission: Submission, drive: Drive,  index: number, run: Run, saveFile: any): Promise<string> {
    const attachment = submission.attachment!
    const fileName = attachment.title
    const id = attachment.id
    const path = `${run.moveDir}/${fileName}`
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (run.opts.download) {
                if (process.env.NODE_ENV === 'production')
                    console.log(`${submission.emailId}: downloading`)
                saveFile(drive, id, path)
                    .then(() => resolve(path))
                    .catch((err: any) => reject(err))
            } else {
                resolve(path)
            }
        }, (index) * 200)
    })
}

export const moduleKarel: SubjectModule = {
	downloadAtInterval: downloadAtInterval,
	testSubmission: testSubmission,
	prepareSubmission: defaultPrepareSubmission,
	asynchronousTest: true,
    emailTemplates: {}
}
