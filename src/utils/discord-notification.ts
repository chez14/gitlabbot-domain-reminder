import { Webhook } from "discord-webhook-node";

const hook = new Webhook(process.env.VERBOSE_NOTIF || "");

export const NotifyDiscord = async (title: string, subtitle?: string, mesage?: string) => {
    if (!hook) {
        return Promise.resolve();
    }
    return await hook.info(title, subtitle, mesage);
}


export const getDiscordInstance = () => {
    return hook;
}