import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FadeAnimation} from '../../shared/fade-animation';

@Component({
    selector: 'pbx-input',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    animations: [FadeAnimation('300ms')]
})

export class InputComponent implements OnInit {
    @Input() key: string;
    @Input() name: string;
    @Input() description: string;
    @Input() descriptionClass: string;
    @Input() inputClass: string = '';
    @Input() type: string = 'text';
    @Input() placeholder: string = '';
    @Input() object: any;
    @Input() errorKey: string;
    @Input() errors: any;
    @Input() objectView: any;
    @Input() options: any[];
    @Input() displayKey: string;
    @Input() checkbox: boolean;
    @Input() trueValue: any;
    @Input() falseValue: any;
    @Input() form: boolean;
    @Input() formKey: string;
    @Input() index: number;
    @Input() updateValueByKey: boolean;
    @Input() updateObjectByObject: boolean;
    @Input() labelPosition: string;
    @Input() singleBorder: boolean = true;
    @Input() floatError: boolean = false;
    @Input() errorVisible: boolean = false;

    @Output() onSelect: EventEmitter<object> = new EventEmitter();
    @Output() onToggle: EventEmitter<object> = new EventEmitter();
    @Output() onKeyUp: EventEmitter<object> = new EventEmitter();

    // @ViewChild('errorSpan') errorSpan: ElementRef;
    @ViewChild('inputDiv') inputDiv: ElementRef;

    value;
    checkboxValues;
    prevError;

    constructor() {

    }

    setFocus(): void {
        // if (this.checkError()) {
            // this.errorSpan.nativeElement.focus();
        this.errorVisible = true;
        // console.log('setFocus', this.errorVisible);
        // }
    }

    removeFocus(): void {
        // if (this.checkError()) {
            // this.errorSpan.nativeElement.blur();
        this.errorVisible = false;
        // console.log('removeFocus', this.errorVisible);
        // }
    }


    getErrorKey() {
        return this.errorKey ? this.errorKey : this.key;
    }

    getValueByKey(item: any, key: string) {
        if (!key) {
            return null;
        }
        const keyArray = key.split('.');
        keyArray.forEach(k => item = item && item[k]);
        return item;
    }

    setError(value) {
        let key = this.getErrorKey();
        if (!key) {
            return null;
        }
        this.errors[key] = value;
        // const keyArray = key.split('.');
        // keyArray.forEach(k => item = item && item[k]);
        // item = null;
    }

    checkError(textOnly = null): string {
        if (!this.errors) {
            return this.checkForm(textOnly);
        }
        let error = this.errors && this.getValueByKey(this.errors, this.getErrorKey());
        let result = (this.errors && (textOnly ? (error !== true ? error : null) : error)) || (textOnly ? null : this.checkForm(textOnly));
        // this.key === 'firstname' ? console.log('checkError', this.key, result) : null;
        return result;
    }

    getFormKey() {
        return this.formKey ? this.formKey : this.key;
    }

    getForm() {
        if (this.index !== undefined) {
            return this.object.get([this.index, this.getFormKey()]);
        } else {
            return this.object.get(this.getFormKey());
        }
    }

    checkForm(textOnly = null) {
        if (!this.form) {
            return null;
        }
        let form = this.getForm();
        if (textOnly) {
            if (form && form.touched && form.invalid && form.errors) {
                // this.key === 'name' ? console.log('checkForm', form.errors) : null;
                let keys = Object.keys(form.errors);
                for (let i = 0; i < keys.length; i++) {
                    switch (keys[i]) {
                        case 'required':
                            return 'This value is required';
                        default:
                            return 'This field is invalid';
                    }
                }
            }
            return null;
        }
        return form && form.touched && form.invalid;
    }

    resetError() {
        if (this.checkError()) {
            this.errors ? this.setError(null) : null;
            if (this.form) {
                let form = this.getForm();
                form.markAsUntouched();
            }
        }
    }

    inputKeyUp($event) {
        if ($event && !['Tab', 'ArrowRight', 'ArrowLeft'].includes($event.key)) {
            // console.log($event.key);
            this.resetError();
        }
        // this.resetError();
        this.object[this.key] = $event.target.value;
        this.onKeyUp.emit($event);
    }

    selectItem($event) {
        this.resetError();
        if (this.form) {
            this.value = $event;
            // this.objectView.id = $event.id;
            // this.objectView[this.displayKey] = $event[this.displayKey];
            this.key ? this.getForm().setValue($event.id) : null;
        } else {
            if (this.updateObjectByObject) {
                this.object[this.key] = $event;
            } else {
                this.object[this.key] = $event.id;
            }
            if (this.updateValueByKey) {
                // this.value.id = $event.id;
                this.value[this.displayKey] = $event[this.displayKey];
            } else {
                this.value = $event;
            }
        }
        this.onSelect.emit($event);
    }

    toggleCheckbox($event) {
        if (this.form) {
            this.getForm() ? this.getForm().setValue($event) : null;
        } else {
            this.object[this.key] = this.checkboxValues[$event ? 1 : 0];
        }
        this.onToggle.emit($event);
    }

    findInput(element) {
        if (!element) {
            return null;
        }
        if (element.children) {
            for (let i = 0; i < element.children.length; i++) {
                if (element.children[i].localName === 'input') {
                    // console.log(element.children[i]);
                    element.children[i].focus();
                } else {
                    this.findInput(element.children[i]);
                }
            }
        }
    }

    getErrorVisible() {
        if (this.errors) {
            if (this.errors != this.prevError) {
                this.prevError = this.errors;
                let keys = Object.keys(this.errors);
                if (keys.length > 0) {
                    if (keys[0] === this.getErrorKey()) {
                        // console.log(this.inputDiv);
                        this.inputDiv ? this.findInput(this.inputDiv.nativeElement) : null;
                        // this.inputItem1 ? this.inputItem1.nativeElement.setFocus() : null;
                        this.errorVisible = true;
                    }
                }
            }

        }
        return this.errorVisible;
    }


    ngOnInit() {
        if (this.form && this.checkbox) {
            this.value = this.getForm() ? this.getForm().value : false;
        } else if (this.options) {
            if (this.updateObjectByObject) {
                this.value = this.object[this.key];
            } else {
                this.value = this.objectView ? this.objectView : this.object;
            }
        } else {
            this.value = this.object[this.key];
        }

        this.checkboxValues = [
            this.falseValue ? this.falseValue : false,
            this.trueValue ? this.trueValue : true
        ];
    }

}
