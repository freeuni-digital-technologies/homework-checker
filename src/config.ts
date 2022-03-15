import path from 'path'

// ამ ფაილში უნდა იყოს მხოლოდ და მხოლოდ default პარამეტრები 
// იმ ყველაფრის, რაც user-ს შეუძლია რომ გადმოაწოდოს

// this is temporary
export const data_path = path.resolve(__dirname, `../../../data`)
export const results_path = `${data_path}/output`
export const submissions_path = `${data_path}/submissions`

export const config = {
    subject: '21f შესავალი ციფრულ ტექნოლოგიებში',
    STUDENTS_DATA_PATH: path.resolve(__dirname, `${data_path}/students.json`),
    CLASSROOM_CREDENTIALS_PATH: path.resolve(__dirname, `${data_path}/credentials/credentials.json`),
    CLASSROOM_TOKEN_PATH: path.resolve(__dirname, `${data_path}/credentials/token.json`)
}
