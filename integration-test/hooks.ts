import * as unzipper from "unzipper";
import * as path from "path";
import * as fse from "fs-extra";

const zipPath = path.resolve(__dirname,'../../integration-test-data.zip')
const unzipDir = path.resolve(__dirname, './integration-test-data')

export const dataDir = path.join(unzipDir, 'data')

export function setupHooks() {
    beforeEach( () => {
        return fse.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: unzipDir }))
            .promise()
    })
    afterEach(() => {
        return fse.rm(unzipDir, {recursive:true, force: true})
    })
}
