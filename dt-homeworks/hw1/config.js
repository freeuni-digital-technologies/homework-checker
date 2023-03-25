module.exports = {
        id: 'hw1',
        classroomName: 'დავალება 1',
        deadline: '2022-10-14',
        testFileName: 'hw1tester.js',
        module: 'karel',
        emailTemplates: {
                passed: submission => `
                       <p>გამარჯობა ${submission.georgianName},</p>
                       
                       <p>გილოცავ პირველი დავალების ჩაბარებას და კურსის წარმატებით გაგრძელებას გისურვებ <3</p>
                       
                       <p>ია</p>
                       
                `,
                failed: submission => `
                        <p>გამარჯობა ${submission.georgianName},</p>      
                        
                        <p>დავალების შესწორებაში პრობლემაა, შენმა ფაილმა ტესტები ვერ გაიარა. დარწმუნებული ხარ, რომ სწორი
                        სავარჯიშო ატვირთე? გთხოვ შეამოწმე დავალების გვერდი და ატვირთული ფაილი და თავიდან გამოაგზავნე.</p>
                        
                        <p>ია</p>
                        
                        ტესტები, რომელსაც შენი დავალება ვერ გადის:
                        <p>${submission.results.map(r => r.message).join('</p>\n<p>')}</p>
                `,
                invalid: submission => `
                        <p>გამარჯობა ${submission.georgianName},</p>      
                        
                        <p>დავალების შესწორებისას მოხდა კარელის Error (${submission.results[0].details}). დარწმუნებული ხარ, რომ სწორი
                        სავარჯიშო ატვირთე? გთხოვ შეამოწმე დავალების გვერდი და ატვირთული ფაილი და თავიდან გამოაგზავნე.</p>
                        
                        <p>ია</p>
                `,
                error: submission => `
                        <p>გამარჯობა ${submission.georgianName},</p>
                        
                        <p>როგორც ჩანს შენს ატვირთულ ფაილში შეცდომაა. გთხოვ გადახედე დავალების ატვირთვის ინსტრუქციას და შეასწორე პრობლემა.
                        დედლაინამდე შეგიძლია თავიდან ატვირთო</p>
                       
                        ${submission.results[0].details}
                                      
                        <p>ია</p>
                `
        }
}   
