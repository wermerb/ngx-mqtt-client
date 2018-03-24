import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {NgxMqttClientModule} from './ngx-mqtt-client';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        NgxMqttClientModule.forRoot({
            host: 'broker.hivemq.com',
            protocol: 'ws',
            port: 8000,
            path: '/mqtt'
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
