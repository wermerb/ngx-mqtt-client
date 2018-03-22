import {InjectionToken} from '@angular/core';
import {IClientOptions} from 'mqtt';

export const MQTT_CONFIG = new InjectionToken<IClientOptions>('mqtt configuration');
