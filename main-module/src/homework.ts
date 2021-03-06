import { Partitions } from './partitions'
import fs from "fs";
import path from 'path'
import { EmailTemplate } from './templates';
import {defaultDataPath} from "./scripts/sumResults";



// TODO ესენი გადასატანია config-ში სავარაუდოდ (ოღონდ სხვა ფორმით)
/* Default Directory For Homework Configuration Files */
export const DEFAULT_HW_CONFIG_PATH: string =  `../../dt-homeworks`;
const DEFAULT_HW_CONFIG_FILENAME: string = "config.js";

export function defaultHomeworkPath(hwId: string) {
    return `${DEFAULT_HW_CONFIG_PATH}/${hwId}/${DEFAULT_HW_CONFIG_FILENAME}`
}

// TODO არასავალდებულო პარამეტრები არ სწორდება ასეთი ლოგიკით

export interface HwConfig {
    id: string,
    name: string,
    module: string,
    deadline: string, //YYYY-mm-dd preferably
    testFileName: string,
    dataDir: string,
    configPath: string, // absolute path
    deadlineMinutes?: string, //T23:59:00+04:00 if not set 
    exceptions?: Partitions<string[]>,
    manualChecks?: string[],
    force?: string[],
    skip?: string[],
    emailTemplates?: Partitions<EmailTemplate>
}

class HwConfigProp {
    public id: string = "";
    public classroomName: string = "";
    public deadline: string = "";
    public testFileName: string = "";
    public emailTemplates?: object;
    public module: string = "";
}

/* Message Constructors */

function printPropertyDoesNotExistMessage(propertyName: string){
    console.log(`Config object does not have '${propertyName}' property`);
}
function printPropertyIllegalTypeMessage(propertyName: string, propertyType: string){
    console.log(`Property '${propertyName}' should be type of '${propertyType}'`);
}
function printInvalidTestFileNameMessage(testFileName:string){
    console.log(`File "${testFileName}" not found`);
}

/* Checks if given configuration of homework is valid */
//TODO[LA] fix optional arguments are not optional in config file
function checkGivenHwConfigProps(preHwConfig: any) {
    if(!preHwConfig){
        console.log("Could not find config object in configuration file");
        process.exit(-1);
    }

    const tempConfProp: HwConfigProp = new HwConfigProp();
    for(const i of Object.getOwnPropertyNames(tempConfProp)) {
        let desc: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(tempConfProp, i);

        if(!preHwConfig.hasOwnProperty(i) && typeof desc?.value !== undefined){
            printPropertyDoesNotExistMessage(i);
            process.exit(-1);
        }

        if(typeof desc?.value !== typeof preHwConfig[i]) {
            printPropertyIllegalTypeMessage(i, typeof desc?.value);
            process.exit(-1);
        }
    }
}

/* Convert given configuration file to local interface (Locally interface will be deleted soon) */

function convertGivenHwConfigToInterface(preHwConfig: any, path: string){
    const rvConfig: HwConfig = {
        id: preHwConfig.id,
        name: preHwConfig.classroomName,
        module: preHwConfig.module,
        deadline: preHwConfig.deadline,
        dataDir: preHwConfig.data_dir || defaultDataPath,
        configPath: path,
        testFileName: preHwConfig.testFileName,
        emailTemplates: preHwConfig.emailTemplates
    };
    return rvConfig;
}

export function readHomeworkConfiguration(configPath: string): HwConfig {
    const absolutePath = path.resolve(__dirname, configPath);
    let configFile = null;
    try {
        configFile = require(absolutePath);
    } catch(e) {
        console.log("Could not find homework configuration file\n" + absolutePath)
        process.exit(-1);
    }
    const preHwConfig = configFile;
    checkGivenHwConfigProps(preHwConfig);
    checkTestFileValidity(absolutePath.substring(0, absolutePath.lastIndexOf("/")), preHwConfig.testFileName);

    return convertGivenHwConfigToInterface(preHwConfig, absolutePath);
}



/*
    Reads the default path of homework configurations.
    Name of the subfolders does not matter.

    Default structure:
        Root Folder of Homework Configuration -> Subfolder for each homework configuration -> Homework Configuration File
*/
function getConfigsOfCurrentHomeworks(): HwConfig[] {
    let homeworks: HwConfig[] = [];

    fs.readdirSync( path.resolve(__dirname, DEFAULT_HW_CONFIG_PATH) ).forEach(subfolder => {

        if(subfolder == "README.md" || subfolder == ".git")
            return;

        let currentConfigPath: string = `${DEFAULT_HW_CONFIG_PATH}/${subfolder}/${DEFAULT_HW_CONFIG_FILENAME}`;
        let currentHomeworkConfig: HwConfig = readHomeworkConfiguration(currentConfigPath);
        homeworks.push(currentHomeworkConfig);
    })
    //console.log(homeworks);
    return homeworks;
}

export function getCurrentHWs() {
    let now = new Date()
    let aWeekAfterNow = new Date()
    aWeekAfterNow.setDate(aWeekAfterNow.getDate()+11)

    const homeworks = getConfigsOfCurrentHomeworks();
    return homeworks.map(hw => {
        if(hw.deadlineMinutes === undefined)
            hw.deadlineMinutes = 'T23:59:59+04:00'
        return hw
    }).filter(hw => {
        let deadline = new Date(hw.deadline+hw.deadlineMinutes)
        return now <= deadline && deadline < aWeekAfterNow
    })
}

function checkTestFileValidity(absolutePath:string, testFileName:string){
    const testPath = `${absolutePath}/${testFileName}`;
    if(!fs.existsSync(testPath)){
        printInvalidTestFileNameMessage(testFileName)
        process.exit(-1)
    }
}