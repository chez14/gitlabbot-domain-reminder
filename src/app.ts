// import { Gitlab } from "@gitbeaker/node";
import { readFileSync } from "fs";
import path from "path"
var DateDiff = require('date-diff');

// let client = new Gitlab({
//     token: process.env.GITLAB_PERSONAL_TOKEN,
//     host: process.env.GITLAB_HOST
// });


// client.Issues.create((process.env.GITLAB_PROJECT || ""), {
//     title: "Domain Renewal Notification for ${domainname}",
//     description: "Hi,\n\nThis domain is going to be expired in 30 days. Please renew.",
//     assignee_ids: [process.env.ISSUE_AUTOASSIGN],
//     labels: process.env.ISSUE_AUTOLABEL
// });

/**
 * Flow:
 * for each domains you need to:
 * - get whois info,
 *  - for each whois info, get expiration date.
 *  - if the expiration date didn't match, remind on issue/discord server
 *    then return the CLOSEST expiration date.
 * - for each domain's whois info, get all expiration date that
 *   have 40 days (or defined on dotenv)
 * - if there's any domain that fall to that category:
 *   remind via gitlab
 * - and if none:
 *   do nothing.
 * 
 * - report on Discord Server
 */

import { DomainExpirationExporter } from "./utils/domain-expiration-exporter";
import { logger } from "./utils/get-winston-instance";
(async function () {
    let runtimeLogger = logger.child({ defaultMeta: { service: 'runtime' } });
    runtimeLogger.info("Reading configuration files...")
    let domains: string[] = JSON.parse(await readFileSync(path.join(__dirname, "../configuration/domainlist.json"), { encoding: "utf-8" }));
    runtimeLogger.info(`>> ${domains.length} domains loaded.`);
    runtimeLogger.info("Fetching WHOIS info... please wait.");
    let domainExp = await DomainExpirationExporter(domains);
    runtimeLogger.info(`There's ${domainExp.length} domains scanned.`);

    let expirationDateLimits = process.env.DAYS_BEFORE_REMINDER || 40;
    let expiringDomain = (domainExp).filter((domain) => (new DateDiff(domain.expiration, new Date())).days() <= expirationDateLimits);
    runtimeLogger.info(`There's ${expiringDomain.length} domains that need to be renewed.`);
    if (expiringDomain.length == 0) {
        runtimeLogger.info("Nothings to report. All domains are okay.")
        return process.exit(0);
    }
    // create gitlab issue.
})();