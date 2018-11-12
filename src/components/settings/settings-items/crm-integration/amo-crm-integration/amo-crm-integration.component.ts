import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FadeAnimation} from '../../../../../shared/fade-animation';
import {ButtonItem, FilterItem} from '../../../../../models/base.model';
import {ModalEx} from '../../../../../elements/pbx-modal/pbx-modal.component';

@Component({
    selector: 'amo-crm-integration',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    animations: [FadeAnimation('300ms')]
})

export class AmoCrmIntegrationComponent implements OnInit {

    public filters: FilterItem[];
    public buttons: ButtonItem[];
    public loading: number;

    constructor() {
        this.loading = 0;
        this.filters = [];
        this.buttons = [
            {
                id: 0,
                title: 'Close',
                type: 'cancel',
                visible: true,
                inactive: false,
                buttonClass: '',
                icon: false
            }
        ];
    }

    ngOnInit(): void {

    }

    deleteSelected($event: any) {

    }

    updateFilter(filter: any): void {

    }

    reloadFilter(filter: any): void {

    }

}