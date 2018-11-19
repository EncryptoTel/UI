import { BaseItemModel, PageInfoModel } from './base.model';



export class IvrModel extends PageInfoModel {
    items: IvrItem[];
}

export class IvrItem extends BaseItemModel {
    sip: SipItem;
    sipId: number;
    name: string;
    description: string;
    status: number = 0;
    enabled: boolean;
    tree: IvrTreeItem[] = [];
    dateType: string;
    dateValue: string;
    timeType: string;
    timeValue: string;
    timeoutAction: string;    
    timeoutParams: string;
    loopMessage: number;
    constructor() {
        super();
        this.name = '';
        this.description = '';
        this.tree = [];
    }

    get statusName() {
        return this.status ? 'Enabled' : 'Disabled';
    }

}

export class IvrTreeItem extends BaseItemModel {
    level: number;
    waitTime: number;
    digit: string;
    action: string;
    parameter: string;
    description: string;
}

export class IvrLevelItem extends BaseItemModel {
    title: string;
    description: string;
    number: number;
    items: IvrTreeItem[] = [];
}

export class SipItem extends BaseItemModel {
    constructor(num?: string) {
        super();
        this.phoneNumber = num;
    }
    phoneNumber: string;
}

export class IvrLevelBase extends BaseItemModel {
    constructor(tree?) {
        super();
        if(tree) {
            this.name = tree.name || '';
            this.description = tree.description || "";
            this.voiceGreeting = tree ? tree.parameter: '';
            this.levelNum = tree.level;
        }
    }

    name: string;
    description: string;
    voiceGreeting: string;
    levelNum: number;
    digits: Array<Digit>;
}

export class IvrLevel extends IvrLevelBase {
    
    constructor(tree?, ivr?: IvrItem, phone?) {
        super(tree);
        if(ivr) {
            this.id = ivr.id;
            this.name = ivr.name || '';
            this.sipId = ivr.sipId || null;
            this.enabled = ivr.enabled || false;
            this.loopMessage = ivr.loopMessage || 2;
            this.dateType = ivr.dateType || "";
            this.dateValue = ivr.dateValue || "";
            this.timeType = ivr.timeType || "";
            this.timeValue = ivr.timeValue || ""
            this.sip = phone;
            this.voiceGreeting = tree ? tree.parameter: '';
            this.action = null;
        } else {
            this.levelNum = 1;
        }
    }
    sipId: number;
    sip: string
    enabled: boolean;
    phone: any;
    loopMessage: number;
    dateType: string;
    dateValue: string;
    timeType: string;
    timeValue: string;
    action: string;
    parameter: string;
}
export class Digit {
    constructor(tree?: IvrTreeItem) {
        if(tree) {
            this.id = tree.id;
            this.digit = tree.digit;
            this.description = tree.description;
            this.action = tree.action;
            this.parametr = tree.parameter;
        }
    }
    id: number;
    digit: string;
    description: string;
    action: string;
    parametr: string;
}
