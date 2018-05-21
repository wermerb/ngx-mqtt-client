import {TestBed} from '@angular/core/testing';
import {MqttService} from './mqtt.service';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';
import {MQTT_MOCK} from '../tokens/mqtt-mock.injection-token';
import {ConnectionStatus, SubscriptionGrant} from '..';
import {switchMap, tap} from 'rxjs/operators';
import {cold} from 'jasmine-marbles';

describe('MqttService', () => {
    let sut: MqttService;
    let client: any;
    const clientOnStore: { [key: string]: (...args) => void } = {};

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MqttService,
                {
                    provide: MQTT_CONFIG,
                    useValue: {
                        host: 'broker.hivemq.com',
                        protocol: 'ws',
                        port: 8000,
                        path: '/mqtt',
                        keepalive: 5
                    }
                },
                {
                    provide: MQTT_MOCK,
                    useValue: jasmine.createSpyObj('mqtt', ['connect'])
                }
            ]
        });

        client = jasmine.createSpyObj('client', ['on', 'subscribe', 'unsubscribe', 'publish', 'end', 'connected']);
        client.on.and.callFake((key: string, value: any) => {
            clientOnStore[key] = value;
        });
        client.subscribe.and.callFake((topic, options, cb) => {
            return cb(null, [{topic, qos: options.qos}]);
        });
        client.publish.and.callFake((topic, msg, options, cb) => {
            return cb(null);
        });

        const mqtt = TestBed.get(MQTT_MOCK);
        mqtt.connect.and.returnValue(client);
        sut = TestBed.get(MqttService);
    });

    describe('subscribeTo', () => {
        it('should throw disconnected error', () => {
            clientOnStore['offline']();

            sut.subscribeTo('fooBar').subscribe({
                error: (error) => {
                    expect(error).toEqual(new Error('No connection with MQTT.'));
                }
            });
        });

        it('should throw error if subscription failed', () => {
            const error = new Error('subscription error');
            client.subscribe.and.callFake((topic, options, cb) => {
                return cb(error, null);
            });

            sut.subscribeTo('fooBar').subscribe({
                error: (err) => {
                    expect(err).toEqual(error);
                }
            });
        });

        it('should successfully subscribe to fooBar topic', () => {
            const grant = {topic: 'fooBar', qos: 1};
            const sub = sut.subscribeTo('fooBar', {qos: 1}).subscribe(msg => {
                expect(msg instanceof SubscriptionGrant).toBeTruthy();
                expect(msg).toEqual(new SubscriptionGrant(grant));
                sub.unsubscribe();
            });
        });

        it('should successfully subscribe to fooBar topic and handle empty grant', () => {
            const grant = {topic: 'fooBar', qos: 0};
            client.subscribe.and.callFake((topic, options, cb) => {
                return cb(null, []);
            });
            const sub = sut.subscribeTo('fooBar').subscribe(msg => {
                expect(msg instanceof SubscriptionGrant).toBeTruthy();
                expect(msg).toEqual(new SubscriptionGrant(grant));
                sub.unsubscribe();
            });
        });

        it('should not resubscribe to a topic if it is already done', () => {
            const grant = {topic: 'fooBar', qos: 1};
            const sub = sut.subscribeTo('fooBar', {qos: 1}).pipe(
                switchMap(() => {
                    return sut.subscribeTo('fooBar', {qos: 1}).pipe(
                        tap(msg => {
                            expect(msg instanceof SubscriptionGrant).toBeTruthy();
                            expect(msg).toEqual(new SubscriptionGrant(grant));
                            expect(client.subscribe).toHaveBeenCalledTimes(1);
                        }));
                })
            ).subscribe(() => sub.unsubscribe());
        });
    });

    describe('unsubscribe', () => {
        it('should successfully unsubscribe from fooBar topic', () => {
            client.unsubscribe.and.callFake((topic, cb) => {
                return cb(null);
            });

            const expected = cold('----');
            expect(sut.unsubscribeFrom('fooBar')).toBeObservable(expected);
            expect(client.unsubscribe.calls.mostRecent().args[0]).toBe('fooBar');
        });

        it('should successfully unsubscribe from fooBar and fooBar1 topics', () => {
            client.unsubscribe.and.callFake((topic, cb) => {
                return cb(null);
            });

            const expected = cold('----');
            expect(sut.unsubscribeFrom(['fooBar', 'fooBar1'])).toBeObservable(expected);
            expect(client.unsubscribe.calls.mostRecent().args[0]).toEqual(['fooBar', 'fooBar1']);
        });

        it('should fail to unsubscribe from fooBar', () => {
            const error = new Error('failed to unsub');
            client.unsubscribe.and.callFake((topic, cb) => {
                return cb(error);
            });

            sut.unsubscribeFrom('fooBar').subscribe({
                error: (err) => {
                    expect(err).toEqual(error);
                }
            });
        });
    });

    describe('publishTo', () => {
        it('should successfully publish to fooBar topic', () => {
            const expected = cold('----');
            expect(sut.publishTo('fooBar', 'barFoo')).toBeObservable(expected);
            expect(client.publish.calls.mostRecent().args[0]).toBe('fooBar');
            expect(client.publish.calls.mostRecent().args[1]).toBe('barFoo');
            expect(client.publish.calls.mostRecent().args[2]).toBeUndefined();
        });

        it('should successfully publish to fooBar topic with object in msg', () => {
            const expected = cold('----');
            expect(sut.publishTo('fooBar', {foo: 'bar'})).toBeObservable(expected);
            expect(client.publish.calls.mostRecent().args[0]).toBe('fooBar');
            expect(client.publish.calls.mostRecent().args[1]).toBe('{\"foo\":\"bar\"}');
            expect(client.publish.calls.mostRecent().args[2]).toBeUndefined();
        });

        it('should successfully publish to fooBar topic with buffer in msg', () => {
            const expected = cold('----');
            expect(sut.publishTo('fooBar', new Buffer('foobar'))).toBeObservable(expected);
            expect(client.publish.calls.mostRecent().args[0]).toBe('fooBar');
            expect(client.publish.calls.mostRecent().args[1]).toEqual(new Buffer('foobar'));
            expect(client.publish.calls.mostRecent().args[2]).toBeUndefined();
        });

        it('should fail to publish to fooBar topic ', () => {
            const error = new Error('failed to publish');
            client.publish.and.callFake((topic, msg, options, cb) => {
                return cb(error);
            });

            sut.publishTo('fooBar', 'fobBar').subscribe({
                error: (err) => {
                    expect(err).toEqual(error);
                }
            });
        });
    });

    describe('end', () => {
        it('should call end', () => {
            sut.end(true);

            expect(client.end).toHaveBeenCalledWith(true, undefined);
        });
    });

    describe('connect', () => {
        it('should disconnect first if there is an active connection', () => {
            sut.connect({username: 'foo', password: 'bar'});

            expect(client.end).toHaveBeenCalledWith(true);
        });
    });

    describe('status', () => {
        it('should emit status', () => {
            let counter = 0;

            sut.status().subscribe(status => {
                if (counter === 0) {
                    expect(status).toBe(ConnectionStatus.CONNECTED);
                    counter++;
                    clientOnStore['offline']();
                } else {
                    expect(status).toBe(ConnectionStatus.DISCONNECTED);
                }
            });
        });
    });
});
