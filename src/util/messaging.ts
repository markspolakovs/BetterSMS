import { Record, String, Always, Static } from "runtypes";
import { Feature } from "./Feature";

export type MessagePayload = {[key: string]: any;};

export const Message = Record({
    feature: String,
    action: String,
    payload: Always
});

export type MessageType = Static<typeof Message>;

export type MessageHandler = (action: string, payload: any) => void;

export function sendMessageFromContent<Response = {}>(feature: Feature, action: string, payload: {[key: string]: any}) {
    return browser.runtime.sendMessage<MessageType, Response>({
        feature: feature.name,
        action,
        payload
    });
}
