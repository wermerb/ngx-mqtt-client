# NgxMqttClient [![npm version](https://badge.fury.io/js/ngx-mqtt-client.svg)](https://badge.fury.io/js/ngx-mqtt-client) [![NPM](https://nodei.co/npm-dl/ngx-mqtt-client.png?months=1)](https://nodei.co/npm/<package>/) [![bitHound Code](https://www.bithound.io/github/wermerb/ngx-mqtt-client/badges/code.svg)](https://www.bithound.io/github/wermerb/ngx-mqtt-client) ![npm](https://img.shields.io/npm/l/express.svg)


This is a MQTT.js wrapper which provides reactive and strongly typed api for mqtt.

## Getting started

### Install via npm/yarn 

```sh
npm install --save ngx-mqtt-client
```

```sh
yarn add ngx-social-login
```

### Import the module

Import `NgxMqttClientModule` into your `Module`. 

It is also possible to import into multiple modules if you need multiple mqtt connections.

```javascript
@NgModule({
    declarations: [ ... ],
    imports: [
        ...
        /**
        * You can provide any configuration that is supported by MQTT.js. 
        */
        NgxMqttClientModule.withOptions({
            host: 'broker.hivemq.com',
            protocol: 'ws',
            port: 8000,
            path: '/mqtt'
        })
        ...
    ],
    providers: [ ... ]
})
export class AppModule {
}
```

### How to use

```javascript
export interface Foo {
    bar: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {

    messages: Array<Foo> = [];

    constructor(private _mqttService: MqttService) {

        /**
         * Tracks connection status.
         */
        this._mqttService.status().subscribe((s: ConnectionStatus) => {
            const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
            console.log(`Mqtt client connection status: ${status}`);
        });
    }

    /**
     * Subscribes to fooBar topic.
     * The first emitted value will be a {@see SubscriptionGrant} to confirm your subscription was successful.
     * After that the subscription will only emit new value if someone publishes into the fooBar topic.
     * */
    subscribe(): void {
        this._mqttService.subscribeTo<Foo>('fooBar')
            .subscribe({
                next: (msg: SubscriptionGrant | Foo) => {
                    if (msg instanceof SubscriptionGrant) {
                        console.log('Successfully subscribed!');
                    } else {
                        this.messages.push(msg);
                    }
                },
                error: (error: Error) => console.error(error.message)
            });
    }


    /**
     * Sends message to fooBar topic.
     */
    sendMsg(): void {
        this._mqttService.publishTo<Foo>('fooBar', {bar: 'foo'}).subscribe({
            next: () => console.log('message sent'),
            error: (error: Error) => console.error(`oopsie something went wrong could not sent message: ${error.message}`)
        });
    }

    /**
     * Unsubscribe from fooBar topic.
     */
    unsubscribe(): void {
        this._mqttService.unsubscribeFrom('fooBar').subscribe({
            next: () => console.log('Successfully unsubscribed!'),
            error: (err: Error) => console.error(`oopsie something went wrong could not unsubscribe: ${err.message}`)
        });
    }

    /**
     * The purpose of this is, when the user leave the app we should cleanup our subscriptions
     * and close the connection with the broker
     */
    ngOnDestroy(): void {
        this._mqttService.end();
    }

}

```

### Demo
```bash
git clone https://github.com/wermerb/ngx-mqtt-client.git
cd ngx-mqtt-client
yarn / npm install
ng serve
```
