import { ArgumentParser } from 'argparse'
import path from 'path'
import { HwConfig, readHomeworkConfiguration, defaultHomeworkPath } from './homework'
import { RunOpts } from './runs'
import {defaultPaths} from "./config";

export interface EnvOptions {
    hw: HwConfig,
    runOpts: RunOpts
}


export function getArgs(hwName?: string): EnvOptions {
    const parser = new ArgumentParser({
        addHelp: true
    })
    parser.addArgument(['-w', '--hw'], {help: 'id of the homework'})
    parser.addArgument(['-s', '--slice'], {help: 'check first n homeworks'})
    parser.addArgument(['-t', '--trial'], {help: 'dont save output/print emails not send'})
    parser.addArgument(['-d', '--download'], {help: 'whether to download or use existing file'})
    parser.addArgument(['-e', '--restart'], {help: 'not working: delete all previous run data'})
    parser.addArgument(['-r', '--rerun'], {help: 'not working: delete previous run data'})
    parser.addArgument(['-c', '--continue'], {help: 'continue from userId'})
    parser.addArgument(['-o', '--omit'], {help: 'skip all in category'})
    parser.addArgument(['-f', '--force'], {help: 'force check of id'})
    parser.addArgument(['-k', '--skip'], {help: 'skip check of id'})
    parser.addArgument(['-l', '--late'], {help: 'ignore late of id'})
    parser.addArgument(['-p', '--config-path'], {help: 'location of homework config'})
    parser.addArgument(['-i','--data-dir'], {help: "location of data folder"})
    const args = parser.parseArgs()
    const hwId: string = hwName || args['hw']

    /* Configuration Folder Path */
    let configPath: string = args['config_path']
    if (!configPath) {
        if(!hwId) {
            console.log('provide submission id')
            process.exit(1)
        }else{
            configPath = defaultHomeworkPath(hwId);
        }
    }
    configPath = path.resolve(process.cwd(), configPath)

    const hwConfig = readHomeworkConfiguration(configPath);

    if (!hwConfig) {
        console.log('provide valid submission id')
        process.exit(1)
    }

    /* Data Folder Path */
    const dataPath: string = args['data_dir']
    if(!dataPath){
        hwConfig.dataDir = defaultPaths.data
    }else{
        hwConfig.dataDir = path.resolve(process.cwd(), dataPath)
    }

    let download = true
    if (args.download == 'false') {
        download = false
    }
    const omit: string[] = (args.omit || '').split(',')
    const force = args.force?.split(',')
    if (force && force.length) {
        if (! hwConfig.force) {
            hwConfig.force = []
        }
        hwConfig.force = hwConfig.force.concat(force)
    }
    const skip = args.skip?.split(',')
    if (skip) {
        if (!hwConfig.skip) {
            hwConfig.skip = []
        }
        hwConfig.skip = hwConfig.skip.concat(skip)
    }
    const late = args.late?.split(',')
    if (late) {
        if (!hwConfig.exceptions ) {
            hwConfig.exceptions = {}
        }
        if (!hwConfig.exceptions.late) {
            hwConfig.exceptions.late = []
        }
        hwConfig.exceptions.late = hwConfig.exceptions.late.concat(late)
    }
    return {
        hw: hwConfig,
        runOpts: {
            trial: args.trial == 'true',
            restart: args.restart == 'true',
            rerun: args.rerun == 'true',
            continue: args.continue,
            omit: omit,
            slice: args.slice,
            download: download
        }
    }
}