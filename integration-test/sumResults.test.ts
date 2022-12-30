import * as path from 'path';
import {summarizeResults} from "../src/scripts/sumResults";
import {expect} from 'chai'
import { dataDir, setupHooks } from './hooks';

setupHooks()

describe('sum Results', () => {
    it('22s',  () => {
        const res = summarizeResults(
            path.join(dataDir, 'emis.csv'),
            path.join(dataDir, 'manualResults')
        )
        expect(Object.keys(res)).length(210)
        expect(res['nabai21'].sum).eql(36)
        expect(res['eanas21'].sum).eql(41)
    })
})
