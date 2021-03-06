import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isObject, isArray } from 'util';

import { ModalEx, ModalComponent } from '@elements/pbx-modal/pbx-modal.component';
import { PlayerAnimation } from '@shared/player-animation';
import { FadeAnimation } from '@shared/fade-animation';
import { str2regexp, killEvent } from '@shared/shared.functions';
import { partnerLinkRegExp } from '@shared/vars';
import { TariffStateService } from '@services/state/tariff.state.service';
import { ModalServices } from '@services/modal.service';
import { StorageItem } from '@models/storage.model';
import { IvrItem } from '@models/ivr.model';
import { TableInfoExModel, TableInfoItem, TableInfoModel } from '@models/base.model';


@Component({
    selector: 'pbx-table',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    animations: [
        FadeAnimation('200ms'),
        PlayerAnimation
    ]
})
export class TableComponent implements OnInit, OnDestroy {

    @Input() columnFormat: string[];
    @Input() deletable: boolean = true;
    @Input() editable: boolean;
    @Input() editMode: boolean = true;
    @Input() multiple: boolean;
    @Input() name: string;
    @Input() selected: any;
    @Input() tableInfo: TableInfoModel;
    @Input() tableInfoEx: TableInfoExModel;
    _tableItems: any[];
    @Input() tableReload: number = 0;
    @Input() allSelected: boolean = false;

    @Output() onDelete: EventEmitter<object> = new EventEmitter<object>();
    @Output() onDropDown: EventEmitter<object> = new EventEmitter<object>();
    @Output() onDropDownClick: EventEmitter<object> = new EventEmitter<object>();
    @Output() onEdit: EventEmitter<object> = new EventEmitter<object>();
    @Output() onPageChangeEx: EventEmitter<number> = new EventEmitter<number>();
    @Output() onPlayerClick: EventEmitter<object> = new EventEmitter<object>();
    @Output() onSelect: EventEmitter<object> = new EventEmitter<object>();
    @Output() onCopyToClipboard: EventEmitter<object> = new EventEmitter<object>();
    @Output() onSort: EventEmitter<object> = new EventEmitter<object>();
    @Output() onToggleAll: EventEmitter<boolean> = new EventEmitter<boolean>();

    dropDirection = '';
    modal: ModalEx;
    selectedDelete: any;
    hideField: boolean = false;
    modalWnd: ModalComponent;
    activeTableRow: any;

    @Input()
    set tableItems(val: any[]) {
        this.activeTableRow = [];
        this._tableItems = val;
        this._tableItems.forEach((item) => {
            this.activeTableRow.push(false);
        });
    }

    constructor(
        protected state: TariffStateService,
        private modalService: ModalServices,
        public translate: TranslateService
    ) {
        this.modal = new ModalEx(this.translate.instant('Are you sure?'), 'delete');
        this.modalWnd = this.modalService.createModal(this.modal);
        this.modalWnd.onConfirmEx.subscribe(() => this.deleteItem());
    }

    isSelected(id: number): boolean {
        if (this.selected) {
            return !!this.selected.find(item => {
                return Number.isInteger(item) ? item === id : item.id === id;
            });
        }
    }

    selectItem(event: MouseEvent, item: any, j: number): void {
        const cellText: string = (<any>event.target).outerText;
        this.activeTableRow.forEach((_, index) => {
            if (j !== index) {
                this.activeTableRow[index] = false;
            }
        });
        this.activeTableRow[j] = !this.activeTableRow[j];

        if (partnerLinkRegExp.test(cellText)) {
            this.onCopyToClipboard.emit(item);
            this.onSelect.emit(item);
        }
        else {
            this.onSelect.emit(item);
        }
    }

    toggleAll(selectAll: boolean): void {
      this.allSelected = selectAll;
      this.onToggleAll.emit(selectAll);
    }

    editItem(item, event: MouseEvent): void {
        killEvent(event);
        this.onEdit.emit(item);
    }

    clickDeleteItem(item: any, event: MouseEvent) {
        killEvent(event);
        this.selectedDelete = item;
        if (!this.editMode) {
            this.deleteItem();
        }
        else {
            // this.modal = new ModalEx(this.translate.instant('Are you sure?'), 'delete');
            if (this.name === 'Phone Number') {
                this.modal.body = '';
                let body: string;
                body = '';
                let innerCount;
                innerCount = 0;
                if (item.sipInners && item.sipInners.length > 0) {
                    innerCount = item.sipInners.length;
                }
                body = body.concat(
                    this.translate.instant('Are you sure you want to delete') + ' +',
                    item.phoneNumber, ' ', this.translate.instant('and'), ' ',
                    innerCount, ' ', this.translate.instant('extensions?')
                );
                this.modal.body = body;
            }
            if (this.name === 'Contact') {
                this.modal.body = this.translate.instant('deleteContactConfirmation', { name: this.selectedDelete.firstname });
            }
            if (item instanceof StorageItem) {
                this.deleteItem();
                return;
            }
            if (item instanceof IvrItem) {
                const body: string = (<IvrItem>item).status > 0
                    ? this.translate.instant('Are you sure you want to delete this active IVR?')
                    : this.translate.instant('Are you sure you want to delete this IVR?');
                this.modal.body = body;
            }
            if (item instanceof IvrItem) {
                let body: string;
                if ((<IvrItem>item).status > 0) {
                    body = this.translate.instant('Are you sure you want to delete this active IVR?');
                } else {
                    body = this.translate.instant('Are you sure you want to delete this IVR?');
                }
                this.modal.body = body;
            }
            if (this.modal.title.length > 0) {
                this.modal.title = this.translate.instant(this.modal.title);
            }
            if (this.modal.body) {
                this.modal.body = this.translate.instant(this.modal.body);
            } else {
                this.modal.body = this.translate.instant('Are you sure?');
            }
            this.modal.buttons.forEach(button => {
                button.value = this.translate.instant(button.value);
            });
            this.modal.visible = true;
        }
    }

    deleteItem(): void {
        this.onDelete.emit(this.selectedDelete);
    }

    getItemFormatting(item: any, tableItem: TableInfoItem, itemIndex: number): string {
        let css = '';

        // console.log('cf', this.columnFormat);
        if (!!this.columnFormat && !!this.columnFormat[itemIndex]) css += ' ' + this.columnFormat[itemIndex];

        if (tableItem.dataWidth !== undefined) css += ' fix_' + tableItem.dataWidth;
        else if (!!tableItem.width) css += ' fix_' + tableItem.width;

        if (tableItem.specialFormatting) {
            let value: any;
            value = this.getValueByKeyEx(item, tableItem.key);
            tableItem.specialFormatting.forEach(rule => {
                if (value.match(str2regexp(rule.pattern))) {
                    css += ' ' + rule.cssClass;
                }
            });
        }

        return css;
    }

    getValueByKeyEx(item: any, key: string): string {
        let result: any;
        result = this.getValueByKey(item, key);
        return result === true || result === false || isObject(result) || isArray(result) ? '' : result;
    }

    getValueByKey(item: any, key: string): string {
        const keyArray = key.split('.');
        keyArray.forEach(k => item = item && item[k]);
        return item;
    }

    changePage(): void {
        this.onPageChangeEx.emit();
    }

    sort(item: TableInfoItem) {
        if (item.sort) {
            this.tableInfoEx.sort.isDown = !(this.tableInfoEx.sort.column === item.sort && this.tableInfoEx.sort.isDown);
            this.tableInfoEx.sort.column = item.sort;
            this.onSort.emit(item);
        }
    }

    headerClass(item: TableInfoItem) {
        return [item.sort ? 'sort' : '', item.width ? ('fix' + item.width) : ''];
    }

    dropOpen(action, item) {
        let prev: any;
        prev = item.ddShow;
        this._tableItems.forEach(tItem => {
            tItem.ddShow = false;
        });
        this.onDropDown.emit({ action: action, item: item });
        item.ddShow = prev === false;

        // if ((this.tableItems.length - 4) < this.tableItems.indexOf(item)) {
        //     this.dropDirection = 'top';
        // } else {
        //     this.dropDirection = 'bottom';
        // }

        //// 2018-12-09-s
        if (this._tableItems.indexOf(item) < 2 && this._tableItems.length <= 2) {
            this.dropDirection = 'bottom';
        }
        else if ((this._tableItems.length - 3) < this._tableItems.indexOf(item)) {
            this.dropDirection = 'top';
        }
        else {
            this.dropDirection = 'bottom';
        }
    }

    dropClick(action, option, item) {
        this.onDropDownClick.emit({ action: action, option: option, item: item });
    }

    mouseEnter(event, item) {
        // console.log('mouseEnter', item.id);

    }

    mouseLeave(event, item) {
        // console.log('mouseLeave', item.id);
    }

    /* ------------------------------------------------------
     * Media player
     * ------------------------------------------------------
     */

    playerClick(item) {
        this.onPlayerClick.emit(item);
    }

    playerOpenClose(item) {
        item.player.animationState = item.player.animationState === 'min' ? 'max' : 'min';
    }

    playerAnimationStart(item) {
        if (item) {
            // console.log('PLAYER_ANIMATION1', item.player.animationState);
            // console.log('PLAYER_ANIMATION2', item.player.contentShow);
            if (item.player.animationState === 'min') {
                item.player.contentShow = false;
            }
        }
    }

    playerAnimationEnd(item) {
        if (item) {
            item.player.contentShow = item.player.contentShow === false;
            if (item.player.animationState === 'min') {
                item.player.contentShow = false;
            }
        }
    }

    ngOnInit() {
        this.state.change.subscribe(hideField => {
            this.hideField = hideField;
        });

        if (this.name) {
            this.modal.body = this.translate.instant('Are you sure you want to delete this') + ' ' + this.name + '?';
        } else {
            this.modal.body = null;
        }

        if (!this.tableInfoEx) {
            this.tableInfoEx = new TableInfoExModel();
            for (let i = 0; i < this.tableInfo.titles.length; i++) {
                let item: TableInfoItem;
                item = {
                    title: this.tableInfo.titles[i],
                    key: this.tableInfo.keys[i],
                    width: null,
                    dataWidth: undefined,
                    sort: null,
                    noDataColumn: false
                };
                this.tableInfoEx.items.push(item);
            }
        }
    }

    ngOnDestroy(): void {
        this.modalService.deleteModal();
    }
}

