import {HwConfig} from "../src/homework";
import {RunOpts} from "../src/runs";
import {check} from "../src";
import {expect} from 'chai';
import path = require('path');
import * as fse from "fs-extra";


const dataDir = path.resolve(__dirname, '../../integration-test-data/')
describe('', () => {
    // use it.only when you want to run
    // always replace with it.skip when you commit
    it('run hw3 test with main test',  () => {
        const fakeConfigHw4: HwConfig = {
            id: 'hw3',
            name: 'დავალება 3',
            module: 'karel',
            deadline: '2022-10-28',
            dataDir: dataDir,
            configPath: path.join(dataDir, 'hw-configs/hw3/config.js'),
            testFileName: 'hw3tester.js',
            emailTemplates: {}
        };
        const fakeRunOpts: RunOpts = {
            trial: false,
            restart: false,
            rerun: false,
            continue: null,
            omit:  [''],
            slice: 5,
            download: true
        };
        fse.removeSync(path.join(dataDir, 'output/hw3'))
        return check(fakeConfigHw4, fakeRunOpts)
            .then(output => {
                expect(output.error).length(0)
                expect(output.passed).length(2)
            })
            .catch((ex) => {
                console.log(ex)
                expect(ex).to.be.null
            });
    }).timeout(20000)
})
