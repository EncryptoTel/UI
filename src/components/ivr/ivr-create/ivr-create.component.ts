import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl, ValidatorFn } from '@angular/forms';

import { IvrService } from '@services/ivr.service';
import { RefsServices } from '@services/refs.services';
import { MessageServices } from '@services/message.services';
import { IvrItem, IvrTreeItem, IvrLevelItem } from '@models/ivr.model';
import { SipItem, CallRuleDay, CallRuleTimeType, CallRuleTime } from '@models/call-rules.model';
import { FormBaseComponent } from '@elements/pbx-form-base-component/pbx-form-base-component.component';
import { FadeAnimation } from '@shared/fade-animation';
import { nameRegExp, phoneRegExp } from '@shared/vars';
import { isValidId } from '@shared/shared.functions';
import { MediaPlayerComponent } from '@elements/pbx-media-player/pbx-media-player.component';
import { StorageService } from '@services/storage.service';
import { callRuleTimeValidator, durationTimeValidator } from '@shared/encry-form-validators';
import { MediaState } from '@models/cdr.model';


export enum DigitActions {
    EXTENSION_NUMBER = 1,
    EXTERNAL_NUMBER = 2,
    SEND_TO_IVR = 3
}

/**
 * class IvrCreateComponent
 * 
 * Implements IVR create or edit UI, allows to set as base IVR data as build IVR 
 * navigation menu.
 */
@Component({
    selector: 'pbx-ivr-create',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    animations: [FadeAnimation('300ms')],
    providers: [StorageService]
})
export class IvrCreateComponent extends FormBaseComponent implements OnInit {
    bsRangeValue = new Date();
    model: IvrItem;
    callRuleTimeDays = CallRuleDay.fromPlain([
        { type: 'accent', day: 'Mon', code: 'mon' },
        { type: 'accent', day: 'Tue', code: 'tue' },
        { type: 'accent', day: 'Wed', code: 'wed' },
        { type: 'accent', day: 'Thu', code: 'thu' },
        { type: 'accent', day: 'Fri', code: 'fri' },
        { type: 'cancel', day: 'Sat', code: 'sat' },
        { type: 'cancel', day: 'Sun', code: 'sun' }
    ]);

    durationTimes = CallRuleTimeType.fromPlain([
        { id: 1, code: 'Always (24 hours)' },
        { id: 2, code: 'Set the time' }
    ]);

    callRuleTimes = CallRuleTime.fromPlain([
        { time: '12:00 a.m', asteriskTime: '00:00' },
        { time: '1:00 a.m',  asteriskTime: '01:00' },
        { time: '2:00 a.m',  asteriskTime: '02:00' },
        { time: '3:00 a.m',  asteriskTime: '03:00' },
        { time: '4:00 a.m',  asteriskTime: '04:00' },
        { time: '5:00 a.m',  asteriskTime: '05:00' },
        { time: '6:00 a.m',  asteriskTime: '06:00' },
        { time: '7:00 a.m',  asteriskTime: '07:00' },
        { time: '8:00 a.m',  asteriskTime: '08:00' },
        { time: '9:00 a.m',  asteriskTime: '09:00' },
        { time: '10:00 a.m', asteriskTime: '10:00' },
        { time: '11:00 a.m', asteriskTime: '11:00' },
        { time: '12:00 p.m', asteriskTime: '12:00' },
        { time: '1:00 p.m',  asteriskTime: '13:00' },
        { time: '2:00 p.m',  asteriskTime: '14:00' },
        { time: '3:00 p.m',  asteriskTime: '15:00' },
        { time: '4:00 p.m',  asteriskTime: '16:00' },
        { time: '5:00 p.m',  asteriskTime: '17:00' },
        { time: '6:00 p.m',  asteriskTime: '18:00' },
        { time: '7:00 p.m',  asteriskTime: '19:00' },
        { time: '8:00 p.m',  asteriskTime: '20:00' },
        { time: '9:00 p.m',  asteriskTime: '21:00' },
        { time: '10:00 p.m', asteriskTime: '22:00' },
        { time: '11:00 p.m', asteriskTime: '23:00' },
    ]);
    then_data = [{id: 1, name: "TerminateCall"},
                 {id: 2, name: "Redirect"}]
    selectedDurationTimeRange = ["8:00", "20:00"]

    ivrLevels: IvrLevelItem[];
    sipInners: any[] = [];
    sipOuters: any[] = [];

    selectedItem: IvrTreeItem;  // represents selected IVR digit in tree
    selectedDigits: number[] = [];

    digitForm: FormGroup;
    digitFormKey: string = 'digitForm';

    id: number = 0;
    loading: number = 0;
    loadingExt: number = 0;
    saving: number = 0;
    selectedSipOuter: SipItem;
    selectedFiles = [];
    files = [];
    ruleFor = [
        {id:1, name: "Allways"},
        {id:2, name: "Date (period)"},
        {id:3, name: "Day of the week"}
    ]
    period: any;
    @ViewChild('mediaPlayer') mediaPlayer: MediaPlayerComponent;
    // modelTemplate: boolean = true;
    modelTemplate: boolean = false;
    rule_value_visible = 0;
    // -- properties ----------------------------------------------------------

    get editMode(): boolean {
        return isValidId(this.id);
    }

    get ivrDigitSelected(): boolean {
        return !!this.selectedItem;
    }

    get formSelectedDigit(): { id: number, title: string } {
        return this.digitForm.get('digit').value;
    }

    get formSelectedAction(): { id: number, title: string } {
        return this.digitForm.get('action').value;
    }

    get sipInnersVisible(): boolean {
        return (this.formSelectedAction
            && this.formSelectedAction.id === <number>DigitActions.EXTENSION_NUMBER);
    }

    get sipOutersVisible(): boolean {
        return (this.formSelectedAction
            && (this.formSelectedAction.id === <number>DigitActions.EXTERNAL_NUMBER));
    }

    get ivrActionsVisible(): boolean {
        return (this.formSelectedAction
            && this.formSelectedAction.id === <number>DigitActions.SEND_TO_IVR);
    }

    get curentLevelDigits(): number[] {
        let digits: number[] = [];

        if (this.selectedItem) {
            const level = this.selectedItem.level;
            const idWeight = Math.floor(this.selectedItem.id / 100);
            digits = this.model.tree
                .filter(node => node.level === level && Math.floor(node.id / 100) === idWeight)
                .map(node => node.id);
        }

        return digits;
    }

    // -- component lifecycle methods -----------------------------------------

    constructor(public service: IvrService,
        protected fb: FormBuilder,
        protected message: MessageServices,
        private refs: RefsServices,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private storage: StorageService) {
        super(fb, message);
        this.id = this.activatedRoute.snapshot.params.id;

        // Default ValidationHost messages overrides
        this.validationHost.customMessages = [
            { name: 'Ext', error: 'required', message: 'Please choose an extension number' },
            { name: 'Select Digit', error: 'invalid-digit', message: 'Digit is already used. Please choose another one.' },
        ];
    }

    ngOnInit() {
        super.ngOnInit();
        this.service.reset();
        this.getItem();
        this.initFiles();
    }

    initFiles() {
        this.service.getFiles().then((res)=>{
            this.files = res.items;
        });
    }
    // -- form setup and helpers methods --------------------------------------

    /**
     * Creates base IVR (form) and IVR menu (digitForm) forms. Subscribes to
     * digitForm.actions control changes and adds both forms to the component's
     * forms.
     */
    initForm(): void {
        this.form = this.fb.group({
            id: [null],
            name: ['', [Validators.required, Validators.pattern(nameRegExp)]],
            description: ['', [Validators.maxLength(255)]],
            sip: [null, [Validators.required]],
            voice_greeting: [null, [Validators.required]],
            loop_message: [2, [Validators.required, Validators.pattern('[0-9]*')]],
            rule_for: [null],
            rule_value: [null],
            duration_time: [null],
            duration: [null],
            then: [null]
        });

        this.form.get("rule_for").valueChanges.subscribe(val => {
            this.rule_value_visible = val;
        });

        this.addForm(this.formKey, this.form);

        this.digitForm = this.fb.group({
            digitId: [null],
            digit: [null, [Validators.required, this.ivrDigitNumberValidator]],
            digitDescription: ['', [Validators.maxLength(255)]],
            action: [null, [Validators.required]],
            parameter: [null, [Validators.required]],
        });

        this.digitForm.get('action').valueChanges
            .subscribe(value => this.onActionChanged(value));

        this.addForm(this.digitFormKey, this.digitForm);
    }

    /**
     * Validator checks whther the selected digit in form is free for use
     * at the current level
     * 
     * @returns Validation error or null
     */
    get ivrDigitNumberValidator(): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (control.value && +control.value.id) {
                if (+control.value.id !== this.selectedItem.id && this.curentLevelDigits.includes(+control.value.id)) {
                    return { 'invalid-digit': { value: control.value } };
                }
            }
            return null;
        };
    }

    /**
     * Gets an array of Validators for digitForm.parameter control, depending on 
     * IVR menu item action selected
     * 
     * @return Array of Validators
     */
    getActionParameterValidators(): ((control: AbstractControl) => ValidationErrors)[] {
        if (this.digitForm && this.formSelectedAction) {
            switch (this.formSelectedAction.id) {
                case <number>DigitActions.EXTENSION_NUMBER:
                    return [Validators.required];
                case <number>DigitActions.EXTERNAL_NUMBER:
                    return [Validators.required, Validators.pattern(phoneRegExp)];
                case <number>DigitActions.SEND_TO_IVR:
                    return null;
            }
        }
        return null;
    }

    /**
     * Sets base IVR form data from current IVR model
     */
    setBaseFormData(): void {
        super.setFormDataForForm(this.model, this.formKey, () => {
        });
        // console.log('base-form', this.form.value);
    }

    /**
     * Sets IVR menu form (digitForm) data from current IVR menu item (digit) model
     */
    setDigitFormData(): void {
        console.log('d-form', this.digitForm.value);
        super.setFormDataForForm(this.selectedItem, this.digitFormKey, () => {
            this.digitForm.get('digitId').setValue(this.selectedItem.id);
            this.digitForm.get('digitDescription').setValue(this.selectedItem.description);

            const digit = this.service.digits
                .find(d => d.title === this.selectedItem.digit);
            this.digitForm.get('digit').setValue(digit);

            const action = this.service.actions
                .find(a => a.title === this.selectedItem.action);
            this.digitForm.get('action').setValue(action);

            if (action.id === <number>DigitActions.EXTENSION_NUMBER) {
                const sipsParams = this.selectedItem.parameter.split('-');
                const sipInner = this.sipInners.find(sip => sip.phoneNumber === sipsParams[1]);
                this.digitForm.get('parameter').setValue(sipInner);
            }
            else if (action.id === <number>DigitActions.EXTERNAL_NUMBER) {
                this.digitForm.get('parameter').setValue(this.selectedItem.parameter);
            }
        });
    }

    /**
     * Updates current IVR menu item model with IVR menu item form (digitForm) data
     */
    updateDigitModelData(): void {
        // console.log('d-form-value', this.digitForm.value);

        this.saveFormState(this.digitFormKey);
        this.setModelData(this.selectedItem, () => {
            const data = this.digitForm.value;

            this.selectedItem.id = data.digitId;
            this.selectedItem.digit = data.digit.id;
            this.selectedItem.description = data.digitDescription;

            this.selectedItem.action = data.action.title;
            if (data.action.id === <number>DigitActions.EXTENSION_NUMBER) {
                this.selectedItem.parameter =
                    `${data.parameter.sipOuter.phoneNumber}-${data.parameter.phoneNumber}`;
            }
            else if (data.action.id === <number>DigitActions.EXTERNAL_NUMBER) {
                this.selectedItem.parameter = data.parameter;
            }
            else {
                this.selectedItem.parameter = null;
            }
        });

        this.removeNestedIvrDigits();

        // console.log('d-model-value', this.selectedItem);
    }

    // -- event handlers ------------------------------------------------------

    addLevel() {
    }

    onIvrDigitSelected(itemId: number): void {
        if (this.selectedItem) {
            this.closeForm(this.editMode, this.digitFormKey, () => {
                this.selectIvrDigit(itemId);
            });
        }
        else {
            this.selectIvrDigit(itemId);
        }
    }

    onDigitSelected(digit: any): void {
        // TODO: check event ...
        // console.log('digit-changed', this.digitForm.value);
    }

    onActionChanged(action: any): void {
        // TODO: check event ...
        // this.selectedDigitAction = action;
        this.digitForm.get('parameter').setValue(null);
        this.digitForm.get('parameter')
            .setValidators(this.getActionParameterValidators());
        this.digitForm.get('parameter').reset();
    }

    onSipOuterSelected(item: SipItem): void {
        this.getExtensions(item.id);
    }

    save(): void {
        if (!this.validateForms()) {
            console.log('form-error', this.form, this.digitForm);
            return;
        }

        if (this.selectedItem) {
            // Save selected digit form data
            const data = this.digitForm.value;
            if (data.action.id !== <number>DigitActions.SEND_TO_IVR && this.itemHasChildIvrDigits()) {
                this.showWarningModal(
                    'Current IVR menu will be deleted. Are you sure to continue?',
                    () => {
                        this.updateDigitModelData();
                    });
            }
            else {
                this.updateDigitModelData();
            }
        }
        else {
            // Save base form data
            console.log('form-value', this.form.value);

            this.setModelData(this.model, () => {
                this.model.sipId = this.model.sip.id;
            });
            this.saveFormState(this.formKey);

            console.log('model-value', this.model);
        }

        // this.saveIvr();
    }

    onCancel() {
        if (this.selectedItem) {
            this.closeForm(this.editMode, this.digitFormKey, () => this.cancel());
        }
        else {
            this.closeForm(this.editMode, this.formKey, () => this.cancel());
        }
    }

    // -- component methods ---------------------------------------------------

    selectIvrDigit(itemId: number): void {
        const currentDigit = this.selectedItem && this.selectedItem.id === itemId;
        this.selectedItem = null;

        // [ 1, 102, 10201 ]
        // [ 1, 103 ]
        // [ 1 ]

        setTimeout(() => {
            if (currentDigit) {
                this.selectedDigits = this.selectedDigits.filter(d => d < itemId);
            }
            else {
                this.selectedDigits = [];
                this.selectedDigits.push(itemId);

                while (itemId >= 100) {
                    itemId = Math.floor(itemId / 100);
                    this.selectedDigits.push(itemId);
                }
            }

            if (this.selectedDigits.length > 0) {
                itemId = Math.max(...this.selectedDigits);
                this.selectedItem = this.model.tree.find(node => node.id === itemId);
                this.setDigitFormData();
            }

            this.initIvrTree();
            // console.log('ivr-digit-selected', this.selectedItem.id, this.selectedDigits);
        }, 0);
    }

    initIvrTree(): void {
        this.ivrLevels = [];
        let levelLimit = this.selectedDigits.length;

        const maxId = Math.max(...this.selectedDigits);
        const lastNode = this.model.tree.find(node => node.id === maxId);
        if (levelLimit === 0 || (lastNode && lastNode.action === 'Send to IVR')) {
            levelLimit++;
        }

        for (let i = 0; i < levelLimit; i++) {
            this.ivrLevels[i] = new IvrLevelItem();
            this.ivrLevels[i].number = i;
            this.ivrLevels[i].title = this.getLevelTitle(i);
            this.ivrLevels[i].description = this.getLevelDescription(i);
            this.ivrLevels[i].items = this.model.tree.filter(node =>
                node.level === i && (this.selectedDigits.indexOf(Math.floor(node.id / 100)) !== -1 || i === 0));
            this.ivrLevels[i].items = this.ivrLevels[i].items.sort(this.sortDigitItems);
        }

        // console.log('ivr', this.ivrLevels);
    }

    sortDigitItems(a: IvrTreeItem, b: IvrTreeItem): number {
        const aValue = +a.digit === 0 ? 10 : +a.digit;
        const bValue = +b.digit === 0 ? 10 : +b.digit;

        if (aValue < bValue) return -1;
        else if (aValue > bValue) return 1;
        return 0;
    }

    itemHasChildIvrDigits(): boolean {
        const itemId = this.selectedItem.id;
        let result = false;
        this.model.tree.forEach(node => {
            if (Math.floor(node.id / 100) === itemId) result = true;
        });
        return result;
    }

    removeNestedIvrDigits(): void {
        // console.log(':0', this.selectedItem.id, this.selectedDigits);
        // console.log(':1', this.model.tree);
        const itemId = this.selectedItem.id;
        this.model.tree = this.model.tree.filter(node => Math.floor(node.id / 100) !== itemId);
        // console.log(':2', this.model.tree);

        this.initIvrTree();
    }

    cancel() {
        if (this.selectedItem) {
            this.selectIvrDigit(this.selectedItem.id);
        }
        else {
            this.router.navigate(['cabinet', 'ivr']);
        }
    }

    isLastLevel(index: number): boolean {
        return index + 1 === this.ivrLevels.length;
    }

    getLevelTitle(index: number): string {
        if (index === 0) {
            return this.model.name;
        }
        else {
            const selectedIds = this.selectedDigits.filter(id => id < index * 100);
            const maxId = Math.max(...selectedIds);
            const item = this.model.tree.find(i => i.id === maxId);
            if (item) {
                return item.description;
            }
        }
        return '';
    }

    getLevelDescription(index: number): string {
        return (index === 0)
            ? this.model.description
            : `Level ${index}`;
    }

    // -- data processing methods ---------------------------------------------

    getItem() {
        this.loading++;
        this.service.getById(this.id).then(() => {
            this.selectedSipOuter = this.service.item.sip;
            // TODO:
            this.model = this.service.item;

            this.model.sip = this.sipOuters.find(sip => sip.id === this.model.sipId);
            this.getExtensions(this.model.sipId);

            this.initIvrTree();
            this.setBaseFormData();
        }).catch(() => {
            // TODO:
            this.model = this.service.item;

            this.model.sip = this.sipOuters.find(sip => sip.id === this.model.sipId);
            this.getExtensions(this.model.sipId);

            this.initIvrTree();
            this.setBaseFormData();
        }).then(() => this.loading--);
    }

    initCreate() {
        this.model = new IvrItem();
        this.initIvrTree();
        this.setBaseFormData();
    }

    getExtensions(id: number): void {
        this.loadingExt++;
        this.service.getExtensions(id).then(response => {
            this.sipInners = response.items;
        }).catch(() => { })
            .then(() => this.loadingExt--);
    }

    saveIvr() {
        this.saving++;
        this.service.save(this.id).then(() => {
            this.cancel();
        }).catch(() => { })
            .then(() => this.saving--);
    }

    onTimeRuleChange(i, e) {
        console.log(i, e)
    }

    isFileSelected(index: number): boolean {
        return !!this.selectedFiles[index];
    }

    uploadFile(event: any): void {
        event.preventDefault();

        const file = event.target.files[0];
        if (file) {
            if (this.storage.checkCompatibleType(file)) {
                this.storage.checkFileExists(
                    file,
                    (loading) => {
                        if (!this.storage.loading) {
                            this.initFiles();
                        }
                    });
            }
            else {
                this.message.writeError('Accepted formats: mp3, ogg, wav');
            }
            this.storage.checkModal();
        }
    }

    selectFile(index: number, file: any): void {
        if (this.mediaPlayer.selectedMediaId !== file.id && this.mediaPlayer.state === MediaState.PLAYING) {
            this.mediaPlayer.stopPlay();
        }
        this.selectedFiles[index] = file;
    }

    selectDay(idx, day) {
        day.type = (day.type === 'accent') ? 'cancel' : 'accent'
        // this.callRuleTimeDays[idx].type = (this.callRuleTimeDays[idx].type === 'accent') ? 'cancel' : 'accent';
        console.log(this.callRuleTimeDays);
        console.log(idx, day);
    }

    visibleElementForRule(val) {
        return this.rule_value_visible === val;
    }
}
