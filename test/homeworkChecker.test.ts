import {expect} from "chai";
import {Run} from "../src/runs";

import {HwConfig} from "../src/homework";
import {Submission, GoogleApi, Classroom, Drive} from "dt-types";
import * as path from "path";
import {filterSubmissions, HomeworkChecker, sliceSubmissions} from "../src/homeworkChecker";
import {Arg, Substitute} from "@fluffy-spoon/substitute";
import {moduleKarel} from "../src/modules/karel";

const hw: HwConfig = {
    id: "hwx",
    name: "hw1name",
    module: 'karel',
    configPath: '',
    deadline: "2001-01-01",
    testFileName: "testFileName",
}


describe("slicing homeworks",() => {
    const submissions: any[] = [1, 2, 3]

    it("when slice is undefined, all homeworks should be checked", () => {
        const slice = undefined;
        const result = sliceSubmissions(submissions, slice);
        expect(result).length(3);
    })
    it("if a number n is provided for the slice, only first n submissions will be checked", () => {
        const slice = 1;
        const result = sliceSubmissions(submissions, slice);
        expect(result).length(1)
    })
    it("if number n is out of range, full array will be returned still", () => {
        const slice = 5;
        const result = sliceSubmissions(submissions, slice);
        expect(result).length(3);
    })

})

describe("Submission Filtering", () => {
    it("a submission that is not new will not be checked if not forced", () => {
        const run = Substitute.for<Run>();
        const submission: any = { emailId: "emailId1" };

        run.forceCheck(submission).returns(false);
        run.newSubmission(submission).returns(false);

        expect( filterSubmissions([submission],run,hw)).length(0);
    })

    it("a submission that is not new will still be checked if not forced", () => {
        const run = Substitute.for<Run>();
        const submission: any = { emailId: "emailId1" };

        run.forceCheck(submission).returns(true);
        run.newSubmission(submission).returns(false);

        expect( filterSubmissions([submission],run,hw)).length(1);
    })

    it("new submission will not be checked if it is in skipped", () => {
        const run = Substitute.for<Run>();
        const submission: any = { emailId: "emailId1" };

        run.forceCheck(submission).returns(false);
        run.newSubmission(submission).returns(true);

        expect(filterSubmissions([submission],run,hw)).length(1 );

        hw.skip = [submission.emailId];

        expect(filterSubmissions([submission],run,hw)).length(0);
    })
})


describe("homework checker Tests",() => {

    it("Test Getting Submissions With Results", async () => {
        const submissionsAndResultsJS = getSubmissionsAndResults();

        const rawSubmissions = submissionsAndResultsJS.submissions

        const submissions: Submission[] = rawSubmissions.map(e => fromResponse(e));

        const run = mockRunForFinishSubmissionTest();
        const hwConfig: HwConfig = {
            id: "hw2",
            name: "second homework",
            deadline: "undefined",
            module: "karel",
            subject: '_',
            configPath: __dirname + '/files/homeworkChecker/hw2tester.js',
            testFileName: "hw2tester.js"
        }
        const classroom = Substitute.for<Classroom>();
        const drive = Substitute.for<Drive>();
        classroom.getSubmissions(Arg.all()).resolves(submissions);
        drive.saveFile(Arg.all()).resolves('');
        const api:GoogleApi = {
            classroom: classroom,
            drive: drive
        }
        const module = {...moduleKarel}
        module.downloadAtInterval =  (submission, __, run,____ ) => {
                return Promise.resolve(`${run.moveDir}/${submission.attachment.title}`)
        }
        const homeworkChecker = new HomeworkChecker(api, module, hwConfig, run);
        const results: Submission[] = await homeworkChecker.getSubmissionsWithResults();

        results.forEach(submission => {
            const testResults: any[] = submission.results;

            if(testResults[0].error){
                const foundError = findResultInSamples(submissionsAndResultsJS, "error",submission.id);
                expect(foundError).to.not.be.undefined;
                return;
            }

            const passed: boolean = testResults.every(testResult => testResult.passed);
            if(passed){
                const foundPassed = findResultInSamples(submissionsAndResultsJS, "passed",submission.id);
                expect(foundPassed).to.not.be.undefined;
            } else {
                const foundNotPassed = findResultInSamples(submissionsAndResultsJS, "failed",submission.id);
                expect(foundNotPassed).to.not.be.undefined;
            }

        })
    })

    function mockRunForFinishSubmissionTest(){
        const run = Substitute.for<Run>();
        const submission: any = { emailId: "emailId1" };

        run.forceCheck(submission.emailId).returns(false);

        run.moveDir.returns(path.resolve(__dirname,"./files/integrationTest/submissionFiles"))
        run.opts.returns({ download: true, omit: null });

        return run;
    }

    function getSubmissionsAndResults(){
        return require(path.resolve(__dirname,"./files/integrationTest/submissionsAndResults.js"));
    }

    function findResultInSamples(submissionsAndResultsJS, identifier: string, id: string){
        return submissionsAndResultsJS.results[identifier].find(result => result.id == id);
    }

})


function fromResponse(
        profile: any
    ) {
        const submission = new Submission(
            profile.id!,
            profile.emailId!,
            profile.emailAddress!, 
            profile.state!,
            profile.alternateLink!,
            profile.late
        )
        submission.attachment = profile.attachment
        return submission

    }