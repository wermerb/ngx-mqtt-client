import {Inject, Injectable} from '@angular/core';
import * as mqtt from 'mqtt';
import {IClientOptions, IClientPublishOptions, IClientSubscribeOptions, ISubscriptionGrant, MqttClient} from 'mqtt';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {concatMap, switchMap} from 'rxjs/operators';
import 'rxjs/add/observable/throw';
import {of} from 'rxjs/observable/of';
import {SubscriptionGrant} from '../models/subscription-grant';
import {TopicStore} from '../models/topic-store';

@Injectable()
export class MqttService {

    private _client: MqttClient;

    private _store: { [topic: string]: TopicStore<any> } = {};

    constructor(@Inject(MQTT_CONFIG) config: IClientOptions) {
        this._client = mqtt.connect(null, config);
        this._client.on('message', (topic, message) => this.updateTopic(topic, message.toString()));
    }

    subscribeTo<T>(topic: string, options?: IClientSubscribeOptions): Observable<(SubscriptionGrant | T)> {
        return fromPromise(new Promise((resolve, reject) => {
            if (!this._store[topic]) {
                this._client.subscribe(topic, options, (error: Error, granted: Array<ISubscriptionGrant>) => {
                    if (error) {
                        reject(error);
                    }
                    resolve(new SubscriptionGrant(granted[0]));
                });
            } else {
                resolve(this._store[topic].grant);
            }
        })).pipe(
            concatMap((granted: SubscriptionGrant) =>
                [of(granted), this.addTopic<T>(topic, granted)]
            ),
            switchMap((message: any) => message)
        );
    }

    unsubscribeFrom(topic: string | Array<string>): Observable<any> {
        if (Array.isArray(topic)) {
            topic.forEach(t => {
                this.removeTopic(t);
            });
        } else {
            this.removeTopic(topic);
        }

        return fromPromise(new Promise((resolve, reject) => {
            this._client.unsubscribe(topic, (error: Error) =>
                error ? reject(error) : resolve()
            );
        }));
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

            this._client.publish(topic, msg, options, (error: Error) =>
                error ? reject(error) : resolve()
            );
        }));
    }

    end(force?: boolean, cb?: (...args) => void): void {
        const topics = Object.keys(this._store);
        this.unsubscribeFrom(topics);
        this._client.end(force, cb);
    }

    private removeTopic(topic: string): void {
        this._store[topic].stream.unsubscribe();
        const {[topic]: removed, ...newStore} = this._store;
        this._store = newStore;
    }

    private updateTopic(topic: string, message: string): void {
        let msg: string | object;
        try {
            msg = JSON.parse(message);
        } catch (ex) {
            msg = message;
        }
        this._store[topic].stream.next(msg);
    }

    private addTopic<T>(topic: string, grant: SubscriptionGrant): Observable<T> {
        if (!this._store[topic]) {
            this._store[topic] = {grant, stream: new Subject<T>()};
        }
        return this._store[topic].stream;
    }
}
