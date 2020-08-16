import { createLogger, format, transports } from "winston";

const { timestamp, printf, metadata, colorize } = format;

const consoleFormat = printf(({ level, message, metadata, timestamp }) => {
    return `${timestamp} [${metadata.service}] ${level}: ${message}`;
});


export const logger = createLogger({
    format: format.combine(
        format.colorize(),
        format.simple()
    ),
    defaultMeta: {
        service: 'domain-logger'
    },
    exitOnError: false,
    transports: [
        new transports.File({ filename: 'critical.log', level: 'error' }),
        new transports.File({ filename: 'verbose.log' }),
        new transports.Console({
            format: format.combine(
                metadata({ fillWith: ['service'] }),
                timestamp(),
                colorize(),
                consoleFormat
            )
        })
    ]
})