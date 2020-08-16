import { logger } from "./get-winston-instance";

const whoiser = require('whoiser');

const expiryDate = /expir(y|ation)/i

let domainLogger = logger.child({ defaultMeta: { service: 'whois-exporter' } });
// get domains
export let DomainExpirationExporter = async (domains: string[]) => {
    let domainExpiration = Promise.all(domains.map(async (domain) => {
        domainLogger.info("Starting WHOIS resolver for " + domain);
        let mismatch: string[] = [];

        let expiration: Date | null = null;
        let domainInfo = await whoiser(domain);
        domainLogger.info(">> done.")
        domainLogger.info("Determining domain expiration date...")
        Object.keys(domainInfo).forEach((whoisServer) => {
            domainLogger.info(">> Testing " + whoisServer)
            Object.keys(domainInfo[whoisServer]).forEach((whoisKey) => {
                if (expiryDate.test(whoisKey)) {
                    let newExpiration = new Date(domainInfo[whoisServer][whoisKey]);
                    domainLogger.info(">>>> Got " + newExpiration.toDateString())
                    if (expiration) {
                        if (expiration.valueOf() != newExpiration.valueOf()) {
                            domainLogger.warn(">>>> WARN! Expiration date unmatch on server " + whoisServer)
                            // not a match!
                            mismatch.push(whoisServer)
                            domainLogger.warn("Expiration date mismatched: ", expiration, newExpiration);
                            if (newExpiration.valueOf() < expiration.valueOf()) {
                                newExpiration = expiration;
                                domainLogger.warn(">>>> WARN! Will assume expiration date as " + expiration)
                            }
                        }
                    }
                    expiration = newExpiration;
                }
            })
        })
        domainLogger.info("Resolve ok for " + domain);

        return {
            domain: domain,
            servers: Object.keys(domainInfo),
            mismatch: mismatch,
            expiration: expiration
        };
    }))
    domainLogger.info("WHOIS exporter done.");

    return domainExpiration;
}