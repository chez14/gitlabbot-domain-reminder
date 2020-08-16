import { logger } from "./get-winston-instance";
import { DomainInfo } from "../model/DomainInfo";

const whoiser = require('whoiser');

const expiryDate = /expir(y|ation)/i

let domainLogger = logger.child({ defaultMeta: { service: 'whois-exporter' } });
// get domains
export let DomainExpirationExporter = async (domains: string[]): Promise<DomainInfo[]> => {
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
                            domainLogger.warn(`Expiration date mismatched: ${expiration.toISOString()} <=> ${newExpiration.toISOString()}`);
                            if (newExpiration.valueOf() < expiration.valueOf()) {
                                newExpiration = expiration;
                            }
                            domainLogger.warn(">>>> WARN! Will assume expiration date as " + newExpiration)
                        }
                    }
                    expiration = newExpiration;
                }
            })
        })
        domainLogger.info("Resolve ok for " + domain);

        let result: DomainInfo = {
            domain: domain,
            servers: Object.keys(domainInfo),
            mismatch: mismatch
        };
        if (expiration) {
            result['expiration'] = expiration;
        }
        return result;
    }))
    domainLogger.info("WHOIS exporter done.");

    return domainExpiration;
}