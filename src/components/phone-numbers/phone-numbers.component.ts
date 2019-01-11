import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {PhoneNumberService} from '../../services/phone-number.service';
import {SidebarButtonItem, SidebarInfoItem, SidebarInfoModel, TableInfoModel, TableInfoExModel, TableInfoItem} from '../../models/base.model';
import {SwipeAnimation} from '../../shared/swipe-animation';
import {Router} from '@angular/router';
import {PhoneNumberItem, PhoneNumberModel} from '../../models/phone-number.model';
import {ListComponent} from '../../elements/pbx-list/pbx-list.component';
import {MessageServices} from '../../services/message.services';
import {TranslateService} from '@ngx-translate/core';
import {ButtonItem} from '@models/base.model';

@Component({
    selector: 'phone-numbers-component',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    providers: [PhoneNumberService],
    animations: [SwipeAnimation('x', '300ms')]
})

export class PhoneNumbersComponent implements OnInit {

    loading: number;
    tableModel: TableInfoExModel = new TableInfoExModel();

    tableInfo: TableInfoModel = {
        titles: ['Phone Number', 'Amount of Exts', 'Default Ext', 'Status', 'Number type'],
        keys: ['phoneNumberWithType', 'innersCount', 'defaultInner', 'statusName', 'typeName']
    };
    selected: PhoneNumberItem;
    buttons: ButtonItem[] = [];
    pageInfo: PhoneNumberModel = new PhoneNumberModel();
    sidebar: SidebarInfoModel = new SidebarInfoModel();

    @ViewChild('row') row: ElementRef;
    @ViewChild('table') table: ElementRef;
    @ViewChild('button') button: ElementRef;
    @ViewChild(ListComponent) list: ListComponent;

    constructor(public service: PhoneNumberService,
                public router: Router,
                private message: MessageServices,
                public translate: TranslateService) {
        this.sidebar.title = '';
        this.loading = 0;
        this.tableInfo = {
            titles: [
                this.translate.instant('Phone Number'),
                this.translate.instant('Amount of Exts'),
                this.translate.instant('Default Ext'),
                this.translate.instant('Status'),
                this.translate.instant('Number type')
            ],
            keys: ['phoneNumberWithType', 'innersCount', 'defaultInner', 'statusName', 'typeName']
        };

        this.tableModel.sort.isDown = true;
        this.tableModel.sort.column = 'firstname';
        this.tableModel.items.push(new TableInfoItem(this.translate.instant('Phone Number'), 'phoneNumberWithType', 'phoneNumberWithType'));
        this.tableModel.items.push(new TableInfoItem(this.translate.instant('Amount of Exts'), 'innersCount', 'innersCount'));
        this.tableModel.items.push(new TableInfoItem(this.translate.instant('Default Ext'), 'defaultInner', 'defaultInner'));
        this.tableModel.items.push(new TableInfoItem(this.translate.instant('Status'), 'statusName', 'statusName'));
        this.tableModel.items.push(new TableInfoItem(this.translate.instant('Number type'), 'typeName', 'typeName'));

        this.buttons.push(new ButtonItem(10, this.translate.instant('Buy Phone Number'), 'success', true));
        this.buttons.push(new ButtonItem(11, this.translate.instant('Add External Phone'), 'accent', true));
    }

    select(item: any): void {
        this.selected = item;
        this.sidebar.buttons = [];
        this.sidebar.buttons.push(new SidebarButtonItem(1, this.translate.instant('Cancel'), 'cancel'));
        this.sidebar.buttons.push(new SidebarButtonItem(2, this.translate.instant(this.selected.status ? 'phoneDisable' : 'phoneEnable'), 'accent'));
        this.sidebar.items = [];
        this.sidebar.items.push(new SidebarInfoItem(3, this.translate.instant('Phone Number'), this.selected.providerId !== 1 ? '+' + this.selected.phoneNumber : this.selected.phoneNumber));
        this.sidebar.items.push(new SidebarInfoItem(4, this.translate.instant('Amount of Exts'), this.selected.innersCount));
        this.sidebar.items.push(new SidebarInfoItem(5, this.translate.instant('Default Ext'), this.selected.defaultInner));
        this.sidebar.items.push(new SidebarInfoItem(6, this.translate.instant('Status'), this.translate.instant(this.selected.statusName)));
        this.sidebar.items.push(new SidebarInfoItem(7, this.translate.instant('Phone number type'), this.translate.instant(this.selected.typeName)));
        if (!this.selected.delete) {
            this.sidebar.items.push(new SidebarInfoItem(8, this.translate.instant('Delete phone number') +
                ' ' + (this.selected.innersCount === 1 ? this.translate.instant('and 1 Ext') : this.selected.innersCount > 1 ? this.translate.instant('and') + ' ' + this.selected.innersCount + ' ' + this.translate.instant('Exts') : ''), null, true, false, true));
        }
    }

    cancel(): void {
        this.selected = null;
    }

    toggleNumber(): void {
        this.selected.loading++;
        this.select(this.selected);
        this.service.toggleNumber(this.selected.id, !this.selected.status).then(() => {
            this.list.getItems(this.selected);
            let status: string;
            if (this.selected.status === 0) {
                status = this.translate.instant('enabled');

                this.sidebar.buttons[1].title = this.translate.instant('Disable');
                this.sidebar.items[3].value = this.translate.instant('Enabled');
            }
            if (this.selected.status === 1) {
                status = this.translate.instant('disabled');
                this.sidebar.buttons[1].title = this.translate.instant('Enable');
                this.sidebar.items[3].value = this.translate.instant('Disabled');
            }

            if (this.selected.status === 1) {
                this.selected.status = 0;
            } else {
                this.selected.status = 1;
            }

            this.message.writeSuccess(this.translate.instant('The phone number has been') + ' ' + this.translate.instant(status));
        }).catch(() => {
        })
            .then(() => this.selected.loading--);
    }

    clickButton($event) {
        console.log($event);
        console.log($event.id);
        if ($event) {
            switch ($event.id) {
                case 10:
                    this.router.navigate(['cabinet', 'phone-numbers', 'buy']);
                    break;
                case 11:
                    this.router.navigate(['cabinet', 'phone-numbers', 'external']);
                    break;
            }
        }
    }

    click(item) {
        if (item) {
            switch (item.id) {
                case 8:
                    this.list.items.clickDeleteItem(this.selected);
                    break;
                case 1:
                    this.cancel();
                    break;
                case 2:
                    this.toggleNumber();
            }
        }
    }

    load() {
        this.selected = null;
        this.list.pageInfo.items.forEach( item => {
            item.statusName = this.translate.instant(item.statusName);
            item.typeName = this.translate.instant(item.typeName);
        });
    }

    ngOnInit() {

    }
}
