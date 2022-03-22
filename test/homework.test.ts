import {HwConfig, readHomeworkConfiguration} from "../src/homework";
import { expect } from 'chai'

describe("homework.ts test", () => {
    it("run homework.ts", (done) => {
        let hwConfig: HwConfig = readHomeworkConfiguration("../../dt-homeworks/hw1/config.js");
        expect(hwConfig.id === "hw1").to.be.true
        expect(hwConfig.name === "დავალება 1").to.be.true
        done();
    })
})