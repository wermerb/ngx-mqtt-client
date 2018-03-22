import {Inject, Injectable} from '@angular/core';
import * as mqtt from 'mqtt';
import {IClientOptions, IClientPublishOptions, ISubscriptionGrant, MqttClient} from 'mqtt';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {MQTT_CONFIG} from '../models/mqtt-config.injection-token';
import {fromPromise} from 'rxjs/observable/fromPromise';
import {map, switchMap} from 'rxjs/operators';
import {of} from 'rxjs/observable/of';
import {empty} from 'rxjs/observable/empty';

@Injectable()
export class MqttService {

  private _client: MqttClient;

  private _store: { [topic: string]: Subject<any> } = {};

  constructor(@Inject(MQTT_CONFIG) config: IClientOptions) {
    this._client = mqtt.connect(null, config);
    this._client.on('message', (topic, message) => this.updateTopic(topic, message.toString()));
  }

  subscribeToTopic<T>(topic: string): Observable<T | Error> {
    return fromPromise(new Promise((resolve, reject) => {
      this._client.subscribe(topic, (error: Error, granted: Array<ISubscriptionGrant>) => {
        if (error) {
          reject(error);
        }

        resolve(granted);
      });
    })).pipe(
      switchMap(() => this.addTopic<T>(topic))
    );
  }

  unsubscribeFromTopic(topic: string): Observable<any | Error> {
    if (!this._store[topic]) {
      return of(new Error(`Cannot unsubscribe. ${topic} topic does not exists.`));
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
        this._store = Object.keys(this._store).reduce((obj, top) => {
          if (top !== topic) {
            obj[top] = this._store[top];
          }

          return obj;
        }, {});

        return empty();
      })
    );
  }

  publishToTopic(topic: string,
                 message: object | string | number | boolean | Buffer,
                 options?: IClientPublishOptions): Observable<any | Error> {
    return fromPromise(new Promise((resolve, reject) => {
      let msg: string | Buffer;

      if (!(message instanceof Buffer)) {
        if (typeof message === 'object') {
          msg = JSON.stringify(message);
        } else {
          msg = message.toString();
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
    } catch {
      msg = message;
    }
    this._store[topic].next(msg);
  }

  private addTopic<T>(topic: string): Observable<T> {
    this._store[topic] = new Subject<T>();
    return this._store[topic];
  }
}
