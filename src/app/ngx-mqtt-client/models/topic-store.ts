import {SubscriptionGrant} from './subscription-grant';
import {Subject} from 'rxjs/Subject';

export interface TopicStore<T> {

    grant: SubscriptionGrant;

    stream: Subject<T>;

}
