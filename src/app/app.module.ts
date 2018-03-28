import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {NgxMqttClientModule} from './ngx-mqtt-client';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material';
import {FlexLayoutModule} from '@angular/flex-layout';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        NoopAnimationsModule,
        FlexLayoutModule,
        MatButtonModule,
        NgxMqttClientModule.withOptions({
            host: 'broker.hivemq.com',
            protocol: 'ws',
            port: 8000,
            path: '/mqtt',
            keepalive: 5
        })
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
