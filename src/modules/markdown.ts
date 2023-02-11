import {downloadAtInterval} from "./karel";
import {defaultPrepareSubmission, SubjectModule} from "../types/module";
import {Result} from "dt-types";
import fse from 'fs-extra'
import {marked} from "marked";
import {parse} from 'node-html-parser'

function testSubmission(testPath: string, path: string): Promise<Result[]> {
    const { assertions } = require(testPath)
    return new Promise((resolve, _) => {
        const contents = fse.readFileSync(path, 'utf-8')
        const html_string = marked.parse(contents)
        const document = parse(html_string)
        const results = assertions.map((assertion: any) => {
            try {
                const res = assertion(document).__flags
                return {
                    passed: true,
                    message: res.message
                }
            } catch(err) {
                if (err instanceof Error) {
                    return {
                        passed: false,
                        message: err.message
                    }
                }
                return {
                    passed: false,
                    message: 'unknown error'
                }
            }
       })
        resolve(results)
    })
}


export const moduleMarkdown: SubjectModule = {
    downloadAtInterval: downloadAtInterval,
    testSubmission: testSubmission,
    prepareSubmission: defaultPrepareSubmission,
    asynchronousTest: true,
    emailTemplates: {}
}
