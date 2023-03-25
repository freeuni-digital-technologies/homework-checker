import * as path from 'path';
import {summarizeResults} from "../src/scripts/sumResults";
import {expect} from 'chai'
import { dataDir, setupHooks } from './hooks';

setupHooks()

describe('sum Results', () => {
    it('22s',  () => {
        const res = summarizeResults(true,
            path.join(dataDir, 'emis.csv'),
            path.join(dataDir, 'manualResults'),
	    path.join(dataDir, 'dt-homeworks'),
	    dataDir
        )
        expect(Object.keys(res)).length(210)
        expect(res['nabai21'].before_exam).eql(32)
        expect(res['eanas21'].before_exam).eql(34)
    })
})
