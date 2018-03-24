import {ISubscriptionGrant, QoS} from 'mqtt';

export class SubscriptionGrant implements ISubscriptionGrant {

    topic: string;

    qos: QoS | number;

    constructor(grant: ISubscriptionGrant) {
        this.topic = grant.topic;
        this.qos = grant.qos;
    }

}
