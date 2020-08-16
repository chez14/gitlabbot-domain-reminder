import { readFileSync } from "fs";
import path from "path"
var DateDiff = require('date-diff');

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
import { CreateGitLabReminderIssue } from "./utils/gitlab-create-issue";
(async function () {
    let runtimeLogger = logger.child({ defaultMeta: { service: 'runtime' } });
    runtimeLogger.info("Reading configuration files...")
    let domains: string[] = JSON.parse(readFileSync(path.join(__dirname, "../configuration/domainlist.json"), { encoding: "utf-8" }));
    runtimeLogger.info(`>> ${domains.length} domains loaded.`);
    runtimeLogger.info("Fetching WHOIS info... please wait.");
    let domainExp = await DomainExpirationExporter(domains);
    runtimeLogger.info(`There's ${domainExp.length} domains scanned.`);

    let expirationDateLimits = process.env.DAYS_BEFORE_REMINDER || 4000;
    let expiringDomain = (domainExp).filter((domain) => (new DateDiff(domain.expiration, new Date())).days() <= expirationDateLimits);
    runtimeLogger.info(`There's ${expiringDomain.length} domains that need to be renewed.`);
    if (expiringDomain.length == 0) {
        runtimeLogger.info("Nothings to report. All domains are okay.")
        return process.exit(0);
    }
    runtimeLogger.info(`Creating reminder for the domains... please wait.`);
    await CreateGitLabReminderIssue(expiringDomain)
    runtimeLogger.info(`Reminder created. Exiting...`);
    return process.exit(0);
})();