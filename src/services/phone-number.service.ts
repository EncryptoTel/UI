import {Injectable} from '@angular/core';
import {BaseService} from './base.service';
import {PageInfoModel} from '../models/base.model';
import {PhoneNumberItem, PhoneNumberModel} from '../models/phone-number.model';

@Injectable()
export class PhoneNumberService extends BaseService {

    toggleNumber(id, status): Promise<any> {
        return this.request.put(`v1/sip/outers/${id}/status`, {enable: status});
    }

    buyNumber(params): Promise<any> {
        return this.request.post(`v1/number/fast_order`, params);
    }

    getAvailableNumbersList(requestDetails: any): Promise<any> {
        return this.request.post(`v1/number/catalog/find`, requestDetails);
    }

    getItems(pageInfo: PageInfoModel, filter = null, sort = null): Promise<PhoneNumberModel> {
        return super.getItems(pageInfo, filter, sort).then((res: PhoneNumberModel) => {
            const curPageInfo = this.plainToClassEx(PhoneNumberModel, PhoneNumberItem, res);
            return Promise.resolve(curPageInfo);
        });
    }

    onInit() {
        this.url = 'sip/outers';
    }

}
