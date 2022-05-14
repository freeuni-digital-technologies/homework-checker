import path from 'path'
import fs from "fs"

// ამ ფაილში უნდა იყოს მხოლოდ და მხოლოდ default პარამეტრები
// იმ ყველაფრის, რაც user-ს შეუძლია რომ გადმოაწოდოს

// this is temporary

export function config(data_path: string) {
    return {
        subject: JSON.parse(fs.readFileSync(`${data_path}/subject.json`).toString()).subject,
        STUDENTS_DATA_PATH: `${data_path}/students.json`,
        CLASSROOM_CREDENTIALS_PATH: `${data_path}/credentials/credentials.json`,
        CLASSROOM_TOKEN_PATH: `${data_path}/credentials/token.json`,
        results_path: `${data_path}/output`,
        submissions_path: `${data_path}/submissions`
    }
}