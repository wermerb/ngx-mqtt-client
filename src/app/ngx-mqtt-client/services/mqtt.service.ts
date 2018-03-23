import {Inject, Injectable} from '@angular/core';
import * as mqtt from 'mqtt';
import {IClientOptions, IClientPublishOptions, ISubscriptionGrant, MqttClient} from 'mqtt';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {map, switchMap} from 'rxjs/operators';
import 'rxjs/add/observable/throw';
import {empty} from 'rxjs/observable/empty';

@Injectable()
export class MqttService {

    private _client: MqttClient;

    private _store: { [topic: string]: Subject<any> } = {};

    constructor(@Inject(MQTT_CONFIG) config: IClientOptions) {
        this._client = mqtt.connect(null, config);
        this._client.on('message', (topic, message) => this.updateTopic(topic, message.toString()));
    }

    subscribeTo<T>(topic: string): Observable<T> {
        return fromPromise(new Promise((resolve, reject) => {
            if (!this._store[topic]) {
                this._client.subscribe(topic, (error: Error, granted: Array<ISubscriptionGrant>) => {
                    if (error) {
                        reject(error);
                    }

                    resolve(granted);
                });
            }
            resolve();
        })).pipe(
            switchMap(() => this.addTopic<T>(topic))
        );
    }

    unsubscribeFrom(topic: string): Observable<any> {
        if (!this._store[topic]) {
            return Observable.throw(new Error(`Cannot unsubscribe. ${topic} topic does not exists.`));
        }

        return fromPromise(new Promise((resolve, reject) => {
            this._client.unsubscribe(topic, (error: Error) => {
                if (error) {
                    reject(error);
                }

                resolve();
            });
        })).pipe(
            map(() => {
                this._store[topic].unsubscribe();
                const {[topic]: removed, ...newStore} = this._store;
                this._store = newStore;
                return empty();
            })
        );
    }

    publishTo<T>(topic: string,
                 message: T,
                 options?: IClientPublishOptions): Observable<any> {
        return fromPromise(new Promise((resolve, reject) => {
            let msg: string | Buffer;

            if (!(message instanceof Buffer)) {
                switch (typeof message) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                        msg = message.toString();
                        break;
                    case 'object':
                        msg = JSON.stringify(message);
                        break;
                    default:
                        msg = message as any;
                }
            } else {
                msg = message;
            }

            this._client.publish(topic, msg, options, (error: Error) => {
                if (error) {
                    reject(error);
                }

                resolve();
            });
        }));
    }

    end(force?: boolean, cb?: (...args) => void): void {
        this.unsubscribeAll();
        this._client.end(force, cb);
    }

    private unsubscribeAll(): void {
        Object.keys(this._store).forEach(key => {
            this._store[key].unsubscribe();
        });
    }

    private updateTopic(topic: string, message: string): void {
        let msg: string | object;
        try {
            msg = JSON.parse(message);
        } catch (ex) {
            msg = message;
        }
        this._store[topic].next(msg);
    }

    private addTopic<T>(topic: string): Observable<T> {
        if (!this._store[topic]) {
            this._store[topic] = new Subject<T>();
        }
        return this._store[topic];
    }
}
