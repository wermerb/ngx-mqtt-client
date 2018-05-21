import {InjectionToken} from '@angular/core';
import {MqttConfig} from '../models/mqtt-config';

export const MQTT_CONFIG = new InjectionToken<MqttConfig>('mqtt configuration');
