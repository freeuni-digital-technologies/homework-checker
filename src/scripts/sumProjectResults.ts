import {ProjectsInfo} from "../types/projectsInfo";


export function logProjectResults(results: ProjectResult[], pi: ProjectsInfo) {
    const projectScores = flattenProjectResults(results, pi)
        .map(e => {
            const { result, emailId } = e
            return `${emailId},${result.sum()}`
        }).join('\n')
    console.log(projectScores)
}


export function flattenProjectResults(results: ProjectResult[], pi: ProjectsInfo) {
    return results
        .map(r => Array.from(new Set(pi.findTeamWithId(r.groupId)!.members)).map(m => {
            return {result: r, emailId: m}
        }))
        .flat()
}


export class ProjectResult {
    public functionality: number;
    public groupId: string;
    public design: number;
    public concept: number;
    public report: number;
    public comment: string;
    constructor(json: any) {
        this.functionality = json.functionality
        this.groupId = json.id
        this.design = json.design
        this.concept = json.concept
        this.report = json.report
        this.comment = json.comment
    }
    sum() {
        return this.design + this.concept + this.report + this.functionality
    }
}
