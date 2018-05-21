import {IClientOptions} from 'mqtt';

export interface MqttConfig extends IClientOptions {

    manageConnectionManually?: boolean;

}
