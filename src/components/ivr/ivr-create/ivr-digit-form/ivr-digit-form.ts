import { Subject } from 'rxjs/Subject';
import { Component, OnInit, OnDestroy } from '@angular/core';

import {
    FormBuilder,
    Validators,
    FormGroup,
} from '@angular/forms';

import { IvrService } from '@services/ivr.service';
import { MessageServices } from '@services/message.services';
import { FormBaseComponent } from '@elements/pbx-form-base-component/pbx-form-base-component.component';
import { FadeAnimation } from '@shared/fade-animation';
import { StorageService } from '@services/storage.service';
import { IvrFormInterface } from '../form.interface';
import { IvrLevel, DigitActions } from '@models/ivr.model';


@Component({
    selector: 'pbx-ivr-digit-form',
    templateUrl: './ivr-digit-form.html',
    styleUrls: ['./ivr-digit-form.sass'],
    animations: [FadeAnimation('300ms')],
    providers: [StorageService]
})
export class IvrDigitFormComponent extends FormBaseComponent
    implements OnInit, IvrFormInterface, OnDestroy {
    onAddLevel: Function;
    references: any;
    data: any;
    actionVal = 0;
    digitFormKey: string = 'digitForm';
    loading: number = 0;
    digitForm: FormGroup;
    digits: Array<any> = [];
    sipInners: any;
    paramsInfo = {
        label: '',
        option: [],
        visible: false,
        validators: [],
    };
    onFormChange: Subject<any>;
    onDelete: Function;

    // -- properties ----------------------------------------------------------

    get valid(): boolean {
        return this.digitForm.valid;
    }

    get paramsPlaceholder(): string {
        const placeholder: string = (Array.isArray(this.paramsInfo.option) && this.paramsInfo.option.length === 0)
            ? 'None'
            : '';
        return placeholder;
    }

    // -- component lifecycle methods -----------------------------------------

    constructor(
        public service: IvrService,
        protected fb: FormBuilder,
        protected message: MessageServices
    ) {
        super(fb, message);
        this.onFormChange = new Subject();

        this.validationHost.customMessages = [
            {name: 'External number', error: 'pattern', message: 'Phone number contains invalid characters. You can only use numbers.'},
        ];
    }

    ngOnInit() {
        console.log('digit-form', this.references);
        this.initAvaliableDigit();
        super.ngOnInit();
        this.service.reset();
        if (!this.data.action) {
            this.data.action = DigitActions.CANCEL_CALL;
        }
        this.digitForm.patchValue(this.data);
    }

    ngOnDestroy(): void {}

    initForm(): void {
        this.digitForm = this.fb.group({
            digit: [null, [Validators.required]],
            description: ['', [Validators.maxLength(255)]],
            action: [null, [Validators.required]],
            parameter: [null, [Validators.required]]
        });
        
        this.addForm(this.digitFormKey, this.digitForm);
        
        this.digitForm.get('action').valueChanges.subscribe(actionValue => {
            this.loading ++;
            this.service
                .showParameter(
                    actionValue,
                    this.references.sipId,
                    this.references.levels,
                    this.data
                )
                .then(response => {
                    this.paramsInfo = response;
                    this.digitForm.get('parameter').setValidators(this.paramsInfo.validators);
                    if (actionValue !== this.data.action) {
                        this.digitForm.get('parameter').setValue(null);
                    }
                    this.digitForm.get('parameter').markAsUntouched();
                    this.validationHost.initItems();
                })
                .catch(() => {})
                .then(() => {
                    this.loading --;
                });
        });

        this.digitForm.get('parameter').valueChanges.subscribe(val => {
            if (this.digitForm.value.action === '7' && val === -1) {
                val = this.onAddLevel(new IvrLevel());
                this.digitForm
                    .get('parameter')
                    .setValue(val, { onlySelf: true });
            }
        });
        
        this.digitForm.statusChanges.subscribe(() => {
            this.onFormChange.next(this.digitForm);
        });
    }

    getData() {
        return this.validateForms() ? this.digitForm.value : null;
    }

    getExtensions(id: number): void {
        this.loading++;
        this.service
            .getExtensions(id)
            .then(response => {
                this.sipInners = response.items;
            })
            .catch(() => {})
            .then(() => this.loading--);
    }

    deleteDigit() {
        if (this.onDelete) {
            this.onDelete(this.data);
        }
    }

    initAvaliableDigit() {
        for (let i = 1; i <= 10; i++) {
            const number = i % 10;
            if (
                !this.references.usedDigit.includes(number.toString()) ||
                i.toString() === this.data.digit
            ) {
                this.digits.push({
                    id: number.toString(),
                    title: number.toString()
                });
            }
        }
        if (
            !this.references.usedDigit.includes('*') ||
            this.data.digit === '*'
        ) {
            this.digits.push({ id: '*', title: '*' });
        }
        if (
            !this.references.usedDigit.includes('#') ||
            this.data.digit === '#'
        ) {
            this.digits.push({ id: '#', title: '#' });
        }
    }
}
