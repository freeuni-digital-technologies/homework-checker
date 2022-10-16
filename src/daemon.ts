import { getCurrentHWs } from './homework'
import shell from 'shelljs'
import {CronJob} from 'cron'

// TODO იმის შემოწმება, ახლა გაეშვას თუ არა დავალება, აქ უნდა მოხდეს და არა yarn start-ში
async function go(){
	let homework = getCurrentHWs()
	for (const v of homework) {
		console.log('yarn start --hw ' + v.id)
		let { stdout, code }  = shell.exec('yarn start --hw ' + v.id)
		// console.log(res)
		// console.log()
		if(code != 0 || stdout.search('no new submissions')!=-1) {
			console.log("skipping notifications")
			continue;
		}
		await new Promise(resolve => setTimeout(resolve, 5000)); //sleep 5s
		//console.log('yarn notify --hw ' + v.id + ' --trial true')
		//shell.exec('yarn notify --hw ' + v.id + ' --trial true')
		console.log('yarn notify --hw ' + v.id)
		shell.exec('yarn notify --hw ' + v.id)
	}
}

async function main() {
console.log("starting cron job")
	await go()
	let job = new CronJob('*/10 * * * *', go, null, true, 'Asia/Tbilisi')
	job.start()
}

main().then()
