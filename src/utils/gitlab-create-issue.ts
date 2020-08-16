import { Gitlab } from "@gitbeaker/node";
import { DomainInfo } from "../model/DomainInfo";

let client = new Gitlab({
    token: process.env.GITLAB_PERSONAL_TOKEN,
    host: process.env.GITLAB_HOST
});


export const _buildIssueDescription = (domains: DomainInfo[]) => {
    return `
Hi, I'm Replica (レプリカ), one of @chez14's chaperone.

On this particular instance, I'd like to let you know that this domains need
extra attention — they're going to be expired!

${domains.map(domainInfo => {
        return ` * \`${domainInfo.domain}\`\n\n   expires on **${domainInfo.expiration?.toDateString()}**.`
    }).join("\n\n")}

Please take immediate action before the expiration date.

Thanks! またねー~!

Warm Regards, \\
Replica.

----

<small>
    This issue is automatically made. If the domain is not in watch list, please consult to
    the repo that made for this bot. Thank you!
</small>
    `
}

export const CreateGitLabReminderIssue = async (domains: DomainInfo[]) => {
    await client.Issues.create((process.env.GITLAB_PROJECT || ""), {
        title: "Domain Renewal Notification for " + (new Date().toDateString()),
        description: _buildIssueDescription(domains),
        assignee_ids: [process.env.ISSUE_AUTOASSIGN],
        labels: process.env.ISSUE_AUTOLABEL
    });
}
