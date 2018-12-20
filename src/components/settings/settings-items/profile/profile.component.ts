import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormGroup, Validators, FormBuilder} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';

import {SettingsService} from '@services/settings.service';
import {LocalStorageServices} from '@services/local-storage.services';
import {MessageServices} from '@services/message.services';
import {UserServices} from '@services/user.services';
import {emailRegExp, nameRegExp, phoneRegExp, numberRegExp} from '@shared/vars';
import {validateForm, killEvent} from '@shared/shared.functions';
import {FadeAnimation} from '@shared/fade-animation';
import {passwordConfirmation} from '@shared/password-confirmation';
import {FormBaseComponent} from '@elements/pbx-form-base-component/pbx-form-base-component.component';
import {SettingsModel, SettingsItem, SettingsOptionItem, SettingsBaseItem, SettingsGroupItem} from '@models/settings.models';
import {ScrollEvent} from '@shared/scroll.directive';
import {InputComponent} from '@elements/pbx-input/pbx-input.component';


export enum EmailChangeState {
    NOT_STARTED,
    CONFIRMATION_CODE_SENT,
    COMPLETED
}

@Component({
    selector: 'profile-component',
    templateUrl: './template.html',
    styleUrls: ['../local.sass'],
    animations: [FadeAnimation('300ms')]
})
export class ProfileComponent extends FormBaseComponent implements OnInit {

    model: SettingsModel;

    sidebarActive: boolean;

    generalForm: FormGroup;
    emailChange: FormGroup;
    passwordChange: FormGroup;

    userDefaultPhoto: string;

    emailChangeState: EmailChangeState;

    loading: number;
    saveButton: any;
    cancelButton: any;
    text: any;
    private _compatibleMediaTypes: string[];

    @ViewChild('fileInput') fileInput: ElementRef;


    // --- properties ---------------------------------------------------------

    get messageSent(): boolean {
        return this.emailChangeState === EmailChangeState.CONFIRMATION_CODE_SENT;
    }

    get modelEdit(): boolean {
        return true;
    }

    // --- component lifecycle methods ----------------------------------------

    constructor(
        private service: SettingsService,
        protected fb: FormBuilder,
        protected message: MessageServices,
        private router: Router,
        private storage: LocalStorageServices,
        protected translate: TranslateService,
        private user: UserServices
    ) {
        super(fb, message, translate);
        this.userDefaultPhoto = './assets/images/avatar/no_avatar.jpg';
        this.loading = 0;
        this.emailChangeState = EmailChangeState.NOT_STARTED;

        // Override default ValidationHost messages
        this.validationHost.customMessages = [
            { key: 'password_confirmation', error: 'required', message: this.translate.instant('Please confirm the password') },
            { key: 'password_confirmation', error: 'mismatch', message: this.translate.instant('Passwords do not match') },

        ];

        this._compatibleMediaTypes = [ 'image/jpeg', 'image/png', 'image/jpg', 'image/gif' ];
    }

    checkCompatibleType(file: any): boolean {
        return this._compatibleMediaTypes.includes(file.type);
    }

    ngOnInit() {
        // this.langState.change.subscribe(textLang => {
        //     this.text = textLang;
        // });
        super.ngOnInit();
        this.getSettings();
    }

    // --- initialization -----------------------------------------------------

    initForm(): void {
        this.generalForm = this.fb.group({
            firstname: [null, [Validators.required, Validators.pattern(nameRegExp)]],
            lastname: [null, [Validators.pattern(nameRegExp)]],
            patronymic: [null, [Validators.pattern(nameRegExp)]],
            phone: [null, [Validators.pattern(phoneRegExp), Validators.minLength(5), Validators.maxLength(16)]],
            language: [null],
            region: [null],
            time_zone: [null],
            date_format: [null],
            clock: [null],
        });
        this.addForm('generalForm', this.generalForm);

        this.emailChange = this.fb.group({
            email: [null, [Validators.required, Validators.pattern(emailRegExp)]],
            code: [null, [Validators.required, Validators.minLength(6), Validators.pattern(numberRegExp)]],
        });
        this.addForm('emailChange', this.emailChange);

        this.passwordChange = this.fb.group({
            oldPassword: [null, [Validators.required, Validators.minLength(6)]],
            password: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
            password_confirmation: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
        }, {
            validator: passwordConfirmation
        });
        this.addForm('passwordChange', this.passwordChange);
    }

    getModelValues(items: SettingsBaseItem[], modelValues: SettingsOptionItem[]): void {
        items.forEach(i => {
            if (!i.isGroup) {
                const settingsItem = <SettingsItem>i;
                modelValues.push(new SettingsOptionItem(settingsItem.id, settingsItem.value));
            }
            else this.getModelValues((<SettingsGroupItem>i).children, modelValues);
        });
    }

    // --- event handlers -----------------------------------------------------

    close(): void {
        this.router.navigateByUrl('/cabinet/settings');
    }

    change() {
        validateForm(this.generalForm);
        // this.saveButton.inactive = !this.generalForm.valid;
    }

    save(event?: Event): void {
        killEvent(event);

        let validationResult = true;

        const profileFormChanged = this.checkFormChanged('generalForm');
        // console.log('generalForm', profileFormChanged);
        if (profileFormChanged) {
            validateForm(this.generalForm);
            validationResult = validationResult && this.generalForm.valid;
        }

        const emailFormChanged = this.checkFormChanged('emailChange');
        // console.log('emailChanged', emailFormChanged);
        if (emailFormChanged) {
            validationResult = validationResult && this.validateEmailForm();
        }

        const passwordFormChanged = this.checkFormChanged('passwordChange');
        // console.log('passwordChanged', passwordFormChanged);
        if (passwordFormChanged) {
            validateForm(this.passwordChange);
            validationResult = validationResult && this.passwordChange.valid;
        }

        if (validationResult) {
            if (profileFormChanged) this.saveProfileSettings();
            if (emailFormChanged) this.saveEmailSettings();
            if (passwordFormChanged) this.savePasswordSettings();
        }
        else {
            this.scrollToFirstError();
        }
    }

    // --- forms processing methods -------------------------------------------

    inputValidation(form: FormGroup, name: string, errorType?: string): boolean {
        const field = form.controls[name];
        return errorType
            ? field && field.errors[errorType] && (field.dirty || field.touched)
            : field && field.invalid && (field.dirty || field.touched);
    }

    initFormData(formKey: string, form: FormGroup, data?: any): void {
        if (data) {
            
            const modelValues: SettingsOptionItem[] = [];
            this.getModelValues(this.model.items, modelValues);

            Object.keys(form.controls).map(key => {
                if (key === 'language' || key === 'region') {
                    const value = data.profile.settings.language_and_region.children[key].value;
                    if (data.profile.user.hasOwnProperty(key) || value) {
                        form.controls[key].setValue(value);
                    }
                }
                else if (key === 'time_zone' || key === 'date_format' || key === 'clock') {
                    const value = data.profile.settings.time_zone_clock_and_date_format.children[key].value;
                    if (data.profile.user.hasOwnProperty(key) || value) {
                        form.controls[key].setValue(value);
                    }
                }
                else {
                    if (data.profile.user.hasOwnProperty(key)) {
                        form.controls[key].setValue(data.profile.user[key]);
                    }
                }
            });
        }
        this.saveFormState(formKey);
    }

    validateEmailForm(): boolean {
        if (this.emailChangeState === EmailChangeState.NOT_STARTED) {
            return !this.inputValidation(this.emailChange, 'email');
        }
        else if (this.emailChangeState === EmailChangeState.CONFIRMATION_CODE_SENT) {
            return !this.inputValidation(this.emailChange, 'code');
        }
        return false;
    }

    // --- data methods -------------------------------------------------------

    onValueChange(item: SettingsItem) {
        // console.log('form-value', item, this.generalForm.value);
    }

    getSettings(): void {
        this.loading++;

        this.service.getProfileSettings()
            .then(response => {
                this.model = SettingsModel.create(response.profile.settings);
                this.userDefaultPhoto = response.profile.user.avatar;
                this.initFormData('generalForm', this.generalForm, response);
                this.initFormData('emailChange', this.emailChange, response);
                this.initFormData('passwordChange', this.passwordChange);
            })
            .catch(() => {})
            .then(() => this.loading--);
    }

    saveProfileSettings(): void {
        this.loading ++;
        
        const language = (this.generalForm.value.language === 19) ? 'ru' : 'en';
        this.translate.use(language);
        this.storage.writeItem('user_lang', language);
        if (language === 'ru') {
            document.body.classList.remove('lang_en');
        }
        else {
            document.body.classList.remove('lang_ru');
        }
        
        this.service.saveProfileSettings(this.generalForm.value)
            .then(() => {
                this.getSettings();
                this.user.fetchProfileParams().then();
            })
            .catch(() => {})
            .then(() => this.loading --);
    }

    saveEmailSettings(): void {
        if (this.emailChangeState === EmailChangeState.NOT_STARTED) {
            this.loading++;

            this.service.requestEmailChange(this.emailChange.get('email').value)
                .then(() => {
                    this.emailChangeState = EmailChangeState.CONFIRMATION_CODE_SENT;
                })
                .catch(response => {
                    if (response.errors && response.errors['email']) {
                        response.errors['email'] = `A user with this email address already exists`;
                    }
                })
                .then(() => this.loading--);
        }
        else if (this.emailChangeState === EmailChangeState.CONFIRMATION_CODE_SENT) {
            this.loading++;

            this.service.confirmEmailChange(this.emailChange.get('code').value)
                .then(response => {
                    this.emailChange.get('code').setValue('');
                    this.saveFormState('emailChange');
                    this.emailChangeState = EmailChangeState.NOT_STARTED;
                    // this._message.writeSuccess(response.message);
                })
                .catch(() => {})
                .then(() => this.loading--);
        }
    }

    savePasswordSettings(): void {
        this.loading++;

        this.service.changePassword(this.passwordChange.value).then(response => {
            this.passwordChange.reset();
            // this._message.writeSuccess(response.message);
        }).catch(() => {
        })
            .then(() => this.loading--);
    }

    // --- old implementation ---

    passwordsMismatch(): boolean {
        const confirm = this.passwordChange.controls['password_confirmation'];
        const password = this.passwordChange.controls['password'];
        if (this.passwordChange.errors && ((confirm.touched || confirm.dirty) || (password.touched || password.dirty))) {
            return this.passwordChange.errors.mismatch;
        } else {
            return false;
        }
    }

    dropHandler(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        this.uploadFiles(files[0]);
    }

    dragOverHandler(event): void {
        this.sidebarActive = true;
        event.preventDefault();
    }

    dragEndHandler(event): void {
    }

    dragLeaveHandler(event): void {
        this.sidebarActive = false;
        event.preventDefault();
    }

    private uploadFiles(file) {
        // console.log(file);
        if (this.checkCompatibleType(file)) {
            this.service.uploadFile(file, null, null).then(response => {
                if (response.avatar) {
                    this.userDefaultPhoto = response.avatar;
                    this.user.fetchProfileParams().then();
                    this.sidebarActive = false;
                }
            }).catch(() => {
                this.sidebarActive = false;
            });
        } else {
            this.message.writeError(this.translate.instant('Accepted formats: jpg, jpeg, png, gif'));
            this.sidebarActive = false;
        }
    }

    sendFile(event) {
        event.preventDefault();
        const file = event.target.files[0];
        if (file) {
            this.uploadFiles(file);
        }
    }

    selectFile() {
        this.fileInput.nativeElement.click();
    }
}
