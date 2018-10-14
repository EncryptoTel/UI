import {BaseItemModel, PageInfoModel} from "./base.model";

export class IvrModel extends PageInfoModel {
    items: IvrItem[];
}

export class IvrItem extends BaseItemModel {
    sip: SipItem;
    sipId: number;
    name: string;
    description: string;
    status: number;
    tree: IvrTreeItem[];

    constructor() {
        super();
        this.id = 0;
        this.sipId = 0;
        this.status = 0;
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
    phoneNumber: string;
}
