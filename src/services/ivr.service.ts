import { plainToClass } from 'class-transformer';
import {Validators} from '@angular/forms';

import { BaseService } from '@services/base.service';
import { IvrItem, IvrModel, IvrTreeItem } from '@models/ivr.model';
import { PageInfoModel } from '@models/base.model';
import {addressPhoneRegExp} from '@shared/vars';


export enum DigitActions {
    REDIRECT_TO_EXT = '1',
    REDIRECT_TO_NUM = '2',
    REDIRECT_TO_QUEUE = '3',
    REDIRECT_TO_RING_GROUP = '4',
    CANCEL_CALL = '6',
    GO_TO_LEVEL = '7',
    REPEAT_LEVEL = '8',
    REDIRECT_TO_INTEGRATION = '9'
}

export class IvrService extends BaseService {
    pageInfo: IvrModel = new IvrModel();
    item: IvrItem;
    references: any = {};
    currentSip: any;
    
    reset() {
        this.item = new IvrItem();
    }

    getById(id: number): Promise<IvrItem> {
        return super.getById(id).then((res: IvrItem) => {
            this.item = plainToClass(IvrItem, res);
            this.item.sipId = this.item.sip.id;
            return Promise.resolve(this.item);
        });
    }

    edit(id: number, data): Promise<any> {
        return this.put(`/${id}`, data);
    }

    save(data): Promise<any> {
        return this.post('', data);
    }

    getItems(pageInfo: PageInfoModel, filter = null): Promise<IvrModel> {
        return super.getItems(pageInfo, filter)
            .then((response: IvrModel) => {
                this.pageInfo = this.plainToClassEx(IvrModel, IvrItem, response);
                if (this.pageInfo.items) {
                    this.pageInfo.items.forEach(item => {
                        item.status = item.enabled ? 1 : 0;
                    });
                }
                return Promise.resolve(this.pageInfo);
            });
    }

    getExtensions(id: number): Promise<any> {
        return this.request.get(`v1/ivr/inners?sipOuter=${id}`);
    }

    onInit() {
        this.url = 'ivr';
    }

    getFiles() {
        return this.request.get('v1/account/file?type=audio');
    }

    getParams(): Promise<any> {
        return this.request.get(`v1/ivr/params`);
    }

    getQueue() {
        return this.request.get(`v1/ivr/call-queue`);
    }

    getRingGroup() {
        return this.request.get(`v1/ivr/ring-group`);
    }

    getSipOuters() {
        return this.request.get(`v1/ivr/outers`);
    }

    initReferences() {
        return Promise.all([
            this.getSipOuters(),
            this.getParams(),
            this.getQueue(),
            this.getRingGroup()
        ]).then(res => {
            this.references.sip = !!res[0].items ? res[0].items : [];
            const action = res[1].actions;
            this.references.params = Object.keys(action).map(val => {
                return { id: val, code: action[val] };
            });
            this.references.queue = res[2].items;
            this.references.ringGroup = res[3].items;
        });
    }

    showParameter(val, sipId, levels): any {
        const paramsInfo = {
            label: '',
            option: [],
            visible: true,
            validators: []
        };

        return new Promise((resolve, reject) => {
            switch (val.toString()) {
                case DigitActions.REDIRECT_TO_EXT:
                    const sip = this.references.sip.find(x => x.id === sipId);
                    paramsInfo.option = sip
                        ? sip.sipInners.map(x => {
                              return { id: x.id, name: x.phoneNumber };
                          })
                        : undefined;
                    paramsInfo.label = 'Extension number';
                    paramsInfo.visible = true;
                    paramsInfo.validators = [Validators.required];
                    resolve(paramsInfo);
                    break;
                case DigitActions.REDIRECT_TO_NUM:
                    paramsInfo.label = 'External number';
                    paramsInfo.option = undefined;
                    paramsInfo.visible = true;
                    paramsInfo.validators = [Validators.required, Validators.minLength(6), Validators.maxLength(16), Validators.pattern(addressPhoneRegExp)];
                    resolve(paramsInfo);
                    break;
                case DigitActions.REDIRECT_TO_QUEUE:
                    paramsInfo.label = 'Redirect to queue';
                    paramsInfo.option = this.references.queue.map(x => {
                        return { id: x.id, name: x.name };
                    });
                    paramsInfo.visible = true;
                    paramsInfo.validators = [Validators.required];
                    resolve(paramsInfo);
                    break;
                case DigitActions.REDIRECT_TO_RING_GROUP:
                    paramsInfo.label = 'Redirect to ring group ';
                    paramsInfo.option = this.references.ringGroup.map(x => {
                        return { id: x.id, name: x.name };
                    });
                    paramsInfo.visible = true;
                    paramsInfo.validators = [Validators.required];
                    resolve(paramsInfo);

                    break;
                case DigitActions.CANCEL_CALL:
                    paramsInfo.label = 'Cancel call';
                    paramsInfo.option = undefined;
                    paramsInfo.visible = false;
                    resolve(paramsInfo);
                    break;
                case DigitActions.GO_TO_LEVEL:
                    paramsInfo.label = 'Ivr goto level';
                    paramsInfo.option = levels.map(l => {
                        return { id: l.levelNum, name: l.name };
                    });
                    paramsInfo.option.push({
                        id: -1,
                        name: 'new level'
                    });
                    paramsInfo.visible = true;
                    paramsInfo.validators = [Validators.required];
                    resolve(paramsInfo);
                    break;
                case DigitActions.REPEAT_LEVEL:
                    paramsInfo.label = 'Ivr repeat level';
                    paramsInfo.option = undefined;
                    paramsInfo.visible = false;
                    resolve(paramsInfo);
                    break;
                case DigitActions.REDIRECT_TO_INTEGRATION:
                    paramsInfo.label = 'Ivr integration';
                    paramsInfo.option = undefined;
                    paramsInfo.visible = false;
                    resolve(paramsInfo);
                    break;
                default:
                    reject();
                    break;
            }
        });
    }
}
