import { Submission, Result, Drive } from 'dt-types';
import { Run } from "../runs";
import { Partitions } from "../partitions";
import {  EmailTemplate } from '../templates'


export interface SubjectModule {
	downloadAtInterval: (submission: Submission, index: number, run: Run, drive: Drive) => Promise<string>,
	// ამ ორის არგუმენტები ძაან მაგარია... ჩემი შემოქმედება
	prepareSubmission: (path: string, testPath: string) => string,
	testSubmission: (testPath: string, path: string) => Promise<Result[]>,
	asynchronousTest: boolean,
	emailTemplates?: Partitions<EmailTemplate>
}

export function defaultPrepareSubmission(path: string, _: string): string {
	return path
}

