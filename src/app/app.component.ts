import {Component, OnDestroy} from '@angular/core';
import {MqttService} from './ngx-mqtt-client/services/mqtt.service';

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
     * This subscription will only emit new value if someone publish into the fooBar topic.
     * */
    subscribe(): void {
        this._mqttService.subscribeTo<Foo>('fooBar')
            .subscribe((msg: Foo) => {
                this.messages.push(msg)
            });


        this.messages.push('Successfully subscribed!' as any);
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
            next: () => this.messages.push('Successfully unsubscribed!' as any),
            error: () =>this.messages.push('oopsie something went wrong' as any)
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
