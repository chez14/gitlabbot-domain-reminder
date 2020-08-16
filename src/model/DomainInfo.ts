export interface DomainInfo {
    domain: string
    expiration?: Date
    servers: string[],
    mismatch?: string[]
}