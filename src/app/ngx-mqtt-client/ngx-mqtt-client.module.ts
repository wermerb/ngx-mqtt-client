import {ModuleWithProviders, NgModule} from '@angular/core';
import {MqttService} from './services/mqtt.service';
import {MQTT_CONFIG} from './tokens/mqtt-config.injection-token';
import {IClientOptions} from 'mqtt';

@NgModule({
    providers: [MqttService]
})
export class NgxMqttClientModule {
    static withOptions(config: IClientOptions): ModuleWithProviders {
        return {
            ngModule: NgxMqttClientModule,
            providers: [
                {provide: MQTT_CONFIG, useValue: config}
            ]
        };
    }
}
