import {BaseItemModel, BaseParam, PageInfoModel} from "./base.model";

export class CallQueueModel extends PageInfoModel {
    items: CallQueueItem[];
}

export class CallQueueItem extends BaseItemModel {
    sipId: number;
    name: string;
    description: string;
    strategy: number;
    timeout: number;
    maxlen: number;
    announceHoldtime: number;
    announcePosition: boolean;
    queueMembers: CallQueueMember[];

    constructor() {
        super();
        this.id = 0;
        this.sipId = 0;
        this.name = '';
        this.description = '';
        this.strategy = 0;
        this.timeout = 30;
        this.maxlen = 60;
        this.announcePosition = false;
        this.announceHoldtime = 0;
        this.queueMembers = [];
    }

}

export class CallQueueMember {
    sipId: number;
}

export class CallQueueParams {
    strategies: BaseParam[];
    announceHoldtimes: BaseParam[];
}
