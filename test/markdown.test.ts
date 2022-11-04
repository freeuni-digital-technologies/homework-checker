import { expect } from 'chai'
import {moduleMarkdown} from "../src/modules/markdown";

describe('reading markdown document', function () {

    it('',() => {
        const markdownPath = 'test/files/markdown/incomplete_page.md'
        const testerPath = '../../test/files/markdown/outlineTest.js'
        return moduleMarkdown.testSubmission(testerPath, markdownPath)
            .then(results => {
                expect(results[0].passed).eql(false)
                expect(results[1].passed).eql(true)
            })
    })
});