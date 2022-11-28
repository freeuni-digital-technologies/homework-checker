import {GoogleApi, Submission} from "dt-types";
import {log, Run} from "./runs";

import path from 'path'
import {HwConfig} from './homework'
import {Result} from "website-tester" // TODO dt-types
import {SubjectModule} from './types/module'
import {fileNotFoundError, zipFormatError} from './modules/web'
import {filesNotFoundError, teamNameNotFoundError} from "./modules/groupProject";
import fs from "fs";
import { downloadError} from "classroom-api";


export class HomeworkChecker {
    constructor(private api: GoogleApi,
                private module: SubjectModule,
                private hw: HwConfig,
                private run: Run) {
    }

    async getSubmissionsWithResults(): Promise<Submission[]> {
        const testPath = path.resolve(path.dirname(this.hw.configPath), this.hw.testFileName)
        if(!fs.existsSync(testPath)){
            throw new Error("Invalid Test Path")
        }

        return await this.api.classroom.getSubmissions(this.hw.name)
            .then(submissions => sliceSubmissions(submissions, this.run.opts.slice))
            .then(submissions => filterSubmissions(submissions, this.run, this.hw))
            .then(submissions => filterSubmissionsByAttachment(submissions))
            .then(logDownloadingSubmissions)
            .then(submissions => this.processSubmissions(submissions, testPath))
    }

    private async processSubmissions(submissions: Submission[], testPath: string): Promise<Submission[]> {
        if (this.module.asynchronousTest) {
            return Promise.all(submissions.map((submission, index) => {
                return this.downloadAndTest(submission, index, testPath)
            }));
        }
        let index = 0
        const results = []
        for (let submission of submissions) {
            const r = await this.downloadAndTest(submission, index, testPath)
            results.push(r)
        }
        return results
    }

    private async downloadAndTest(submission: Submission, index: number, testPath: string): Promise<Submission> {
        if (!this.run.forceCheck(submission) && !submission.qualifies()) {
            return new Promise(r => r(submission))
        }
        const id = submission.emailId
        return this.module.downloadAtInterval(submission, index, this.run, this.api.drive)
            .then((e: string) => log(e, `${id}: finished downloading`))
            .then((newPath: string) => this.module.prepareSubmission(newPath, testPath))
            .then((newPath: string) => this.module.testSubmission(testPath, newPath))
            .then((r: Result[]) => log(r, `${id}: finished testing`))
            .then((results: Result[]) => submission.addResults(results))
            .catch((error: any) => logError(submission, error))
    }
}


/*
    Simply: logs the given error
    TODO ესენი მერე გავიტანოთ
*/
function logError(submission: Submission, error: any) {
    // LATER ცალკე კლასი იქნება ერორების და იმის მიხედვით
    const knownErrors = [zipFormatError, downloadError, fileNotFoundError, filesNotFoundError, teamNameNotFoundError]
    if (knownErrors.includes(error)) {
        submission.incorrectFormat = true
        submission.results.push({
            error: true,
            details: error
        })
        return submission
    }
    submission.results.push({
        error: true,
        message: "crash",
        details: error
    })
    log({}, `error: ${submission.emailId}, ${error}`)
    submission.crashed = true
    return submission
}


export function sliceSubmissions(submissions: Submission[], slice: number | undefined){
    return slice ? submissions.slice(0,slice) : submissions;
}

export function filterSubmissions(submissions: Submission[], run: Run, hw: HwConfig){
    return submissions.filter(
        s => (!hw.skip?.includes(s.emailId) && (run.forceCheck(s) || run.newSubmission(s)))
    );
}


export function logDownloadingSubmissions(submissions: Submission[]){
    //log(s, `downloading ${s.filter(e => e.onTime()).length}`h
    if (submissions.length < 1) {
        console.log("no new submissions")
        process.exit(0)
    }
    const text = submissions.filter(submission => {
        return submission.onTime();
    }).length
    return log(submissions,`downloading ${text}`);
}

function filterSubmissionsByAttachment(submissions: Submission[]): Submission[]{
    return submissions.filter(submission => {
        return typeof submission.attachment !== 'undefined';
    });
}