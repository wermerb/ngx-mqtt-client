# NgxMqttClient [![npm version](https://badge.fury.io/js/ngx-mqtt-client.svg)](https://badge.fury.io/js/ngx-mqtt-client) ![coverage](https://img.shields.io/badge/coverage-86%25-brightgreen.svg) [![bitHound Code](https://www.bithound.io/github/wermerb/ngx-mqtt-client/badges/code.svg)](https://www.bithound.io/github/wermerb/ngx-mqtt-client)

This is a MQTT.js wrapper which provides reactive and strongly typed api for mqtt.

## Getting started

### Install via npm/yarn 

```sh
npm install --save ngx-mqtt-client
```

```sh
yarn add  ngx-mqtt-client
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
            manageConnectionManually: true, //this flag will prevent the service to connection automatically
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

    status: Array<string> = [];

    constructor(private _mqttService: MqttService) {

        /**
         * Tracks connection status.
         */
        this._mqttService.status().subscribe((s: ConnectionStatus) => {
            const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
            this.status.push(`Mqtt client connection status: ${status}`);
        });
    }
    
     /**
     * Manages connection manually.
     * If there is an active connection this will forcefully disconnect that first.
     * @param {IClientOptions} config
     */
    connect(config: IClientOptions): void {
       this._mqttService.connect(config);
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
                        this.status.push('Subscribed to fooBar topic!');
                    } else {
                        this.messages.push(msg);
                    }
                },
                error: (error: Error) => {
                    this.status.push(`Something went wrong: ${error.message}`);
                }
            });
    }


    /**
     * Sends message to fooBar topic.
     */
    sendMsg(): void {
        this._mqttService.publishTo<Foo>('fooBar', {bar: 'foo'}).subscribe({
            next: () => {
                this.status.push('Message sent to fooBar topic');
            },
            error: (error: Error) => {
                this.status.push(`Something went wrong: ${error.message}`);
            }
        });
    }

    /**
     * Unsubscribe from fooBar topic.
     */
    unsubscribe(): void {
        this._mqttService.unsubscribeFrom('fooBar').subscribe({
            next: () => {
                this.status.push('Unsubscribe from fooBar topic');
            },
            error: (error: Error) => {
                this.status.push(`Something went wrong: ${error.message}`);
            }
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
