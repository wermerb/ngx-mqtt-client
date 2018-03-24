# NgxSocialLogin [![npm version](https://badge.fury.io/js/ngx-mqtt-client.svg)](https://badge.fury.io/js/ngx-mqtt-client) [![bitHound Code](https://www.bithound.io/github/wermerb/ngx-mqtt-client/badges/code.svg)](https://www.bithound.io/github/wermerb/ngx-mqtt-client)

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
You can provide any configuration that is supported by MQTT.js.

```javascript
@NgModule({
    declarations: [ ... ],
    imports: [
        ...
        NgxMqttClientModule.forRoot({
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
    }

    /**
     * Subscribes to fooBar topic.
     * The first emitted value will be a {@see SubscriptionGrant} to confirm your subscription was successful. 
     * After that the subscription will only emit new value if someone publishes into the fooBar topic.
     * */
    subscribe(): void {
        this._mqttService.subscribeTo<any>('fooBar').pipe()
            .subscribe((msg) => {
                if (msg instanceof SubscriptionGrant) {
                    console.log('Successfully subscribed!');
                } else {
                    this.messages.push(msg);
                }
            });
    }


    /**
     * Sends message to fooBar topic.
     */
    sendMsg(): void {
        this._mqttService.publishTo<Foo>('fooBar', {bar: 'foo'}).subscribe({
            next: () => console.log('message sent'),
            error: () => console.error('oopsie something went wrong')
        });
    }

    /**
     * Unsubscribe from fooBar topic.
     */
    unsubscribe(): void {
        this._mqttService.unsubscribeFrom('fooBar').subscribe({
            next: () => console.log('Successfully unsubscribed!'),
            error: (err: Error) => console.error(`oopsie something went wrong: ${err.message}`)
        })
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
