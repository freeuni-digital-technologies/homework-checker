import {HwConfig, readHomeworkConfiguration} from "../src/homework";
import { expect } from 'chai'

describe("homework.ts test", () => {
    it("run homework.ts", (done) => {
        let hwConfig: HwConfig = readHomeworkConfiguration(__dirname + '/files/homework/hw1config.js', false);
        expect(hwConfig.id === "hw1").to.be.true
        expect(hwConfig.name === "დავალება 1").to.be.true
        done();
    })
})