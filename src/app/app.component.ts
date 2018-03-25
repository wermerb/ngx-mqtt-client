import {Component, OnDestroy} from '@angular/core';
import {ConnectionStatus, MqttService, SubscriptionGrant} from './ngx-mqtt-client';

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
