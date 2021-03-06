import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import {MessageServices} from '@services/message.services';
import {StateService} from '@services/state/state.service';
import {FormComponent} from '@elements/pbx-form/pbx-form.component';
import {FormBaseComponent} from '@elements/pbx-form-base-component/pbx-form-base-component.component';
import {FadeAnimation} from '@shared/fade-animation';
import {isValidId} from '@shared/shared.functions';
import {numberRegExp, ivrNameRegExp, simpleNameRegExp, ringGroupsNameRegExp, nameRegExp} from '@shared/vars';
import {numberRangeValidator} from '@shared/encry-form-validators';
import { Observable } from 'rxjs/Observable';


@Component({
  selector: 'pbx-queue-create',
  templateUrl: './template.html',
  styleUrls: ['./local.sass'],
  animations: [FadeAnimation('300ms')]
})
export class QueueCreateComponent extends FormBaseComponent implements OnInit {

  @Input() name: string;
  @Input() service: any;

  @Input() headerText: string;
  @Input() generalHeaderText: string;
  @Input() cmpType;

  @ViewChild(FormComponent) formComponent: FormComponent;

  background: string;

  id: number = 0;

  loading: number = 0;
  saving: number = 0;

  tabs: string[];
  activeTabs: boolean[] = [ true, true ];
  currentTab: string = 'General';

  confirm: {} = { value: 'Save', buttonType: 'success', inactive: this.saving !== 0 };
  decline: {} = {
    standard: {value: 'Cancel', buttonType: 'cancel'},
    member: {value: 'Back', buttonType: 'cancel'},
  };

  addMembersMode: boolean = false;
  noDataMessage: any;

  // -- properties ----------------------------------------------------------

  get model(): any {
    return this.service.item;
  }
  set model(value: any) {
    this.service.item = value;
  }

  get hasId(): boolean {
    return isValidId(this.id);
  }

  get isCallQueue(): boolean {
    return this.name === 'call-queues';
  }

  get tabGeneralActive(): boolean {
    return this.currentTab === this.tabs[0];
  }

  get tabMembersInViewModeActive(): boolean {
    return this.currentTab === this.tabs[1] && !this.addMembersMode;
  }

  get tabMembersInEditModeActive(): boolean {
    return this.currentTab === this.tabs[1] && this.addMembersMode;
  }

  get modelEdit(): boolean {
    return this.service.editMode;
  }

  // -- component lifecycle methods -----------------------------------------

  constructor(
    public router: Router,
    private activatedRoute: ActivatedRoute,
    protected fb: FormBuilder,
    protected message: MessageServices,
    protected tabChange: StateService,
    public translate: TranslateService
  ) {
    super(fb, message, translate);

    this.id = this.activatedRoute.snapshot.params.id;
    this.tabs = [ this.translate.instant('General'), this.translate.instant('Members') ];
    this.currentTab = this.tabs[0];
    this.background = 'form-body-fill';
    this.noDataMessage = this.translate.instant('No data to display. Please add members');

    this.validationHost.customMessages = [
      { key: 'sipId', error: 'required', message: this.translate.instant('Please choose a phone number') },
      { key: 'strategy', error: 'required', message: this.translate.instant('Please choose the ring strategy') },
      { key: 'timeout', error: 'pattern', message: this.translate.instant('Invalid data. This field may contain numbers only') },
      { key: 'timeout', error: 'range', message: this.translate.instant('Please enter a value from 15 to 600') },
      { key: 'maxlen', error: 'required', message: this.translate.instant('You need to choose at least one caller') },
      { key: 'maxlen', error: 'pattern', message: this.translate.instant('Invalid data. This field may contain numbers only') },
      { key: 'maxlen', error: 'range', message: this.translate.instant('Please enter a value from 1 to 100') },
    ];
  }

  ngOnInit(): void {
    this.service.reset();
    this.service.editMode = this.hasId;

    this.getModel(this.id);

    super.ngOnInit();
  }

  initForm(): void {
    this.form = this.fb.group({
      id:          [ '' ],
      name:        [ '', ],
      description: [ '', Validators.maxLength(255) ],
      sipId:       [ null, [ Validators.required ] ],
      strategy:    [ null, [ Validators.required ] ],
      timeout:     [ '', [ Validators.required, Validators.pattern(numberRegExp), numberRangeValidator(15, 600) ] ],
      // queueMembers: [ null, [ Validators.required ] ],
    });
    if (this.isCallQueue) {
      // Add Call-Queues specific controls
      this.form.controls.name.setValidators([ Validators.required, Validators.minLength(4), Validators.maxLength(40), Validators.pattern(nameRegExp) ]);
      this.validationHost.customMessages.push(
          { key: 'name', error: 'pattern', message: this.translate.instant('Name contains invalid characters. You can use letters and numbers only') }
      );

      this.form.addControl('maxlen', this.fb.control(null, [ Validators.required, Validators.pattern(numberRegExp), numberRangeValidator(1, 100) ]));
      this.form.addControl('announceHoldtime', this.fb.control(null));
      this.form.addControl('announcePosition', this.fb.control(null));
    }
    else {
      // Add Ring-Groups specific controls
      this.form.controls.name.setValidators([ Validators.required, Validators.minLength(4), Validators.maxLength(40), Validators.pattern(nameRegExp) ]);
      this.validationHost.customMessages.push(
          { key: 'name', error: 'pattern', message: this.translate.instant('Name contains invalid characters. You can only use letters, numbers and the following characters: -.') }
      );
    }
  }

  // -- event handlers ------------------------------------------------------

  selectTab(tab: string): void {
    if (!this.validateForms()) {
      this.currentTab = this.translate.instant('General');
      this.tabChange.value = this.currentTab;
      this.tabChange.change.emit(true);
      return;
    }
    else {
      if (tab === this.translate.instant('Members')) {
        this.background = 'form-body-empty';
      } else {
        this.background = 'form-body-fill';
      }
      this.addMembersMode = false;
      this.currentTab = tab;
      this.tabChange.value = this.currentTab;
      this.tabChange.change.emit(true);

      this.setModelData();
    }
  }

  addMembers(mode: boolean) {
    if (mode) {
      this.background = 'form-body-fill';
    }
    this.addMembersMode = mode;
  }

  save(): void {
    console.log('form', this.form);
    if (this.validateForms()) {
      this.setModelData();
      this.saveModel();
    }
    else {
      this.scrollToFirstError();
    }
  }

  cancel(): void {
    this.router.navigate(['cabinet', this.name]);
  }

  back(): void {
    if (this.currentTab === this.translate.instant('Members')) {
      this.background = 'form-body-empty';
    } else {
      this.background = 'form-body-fill';
    }
    this.addMembersMode = false;
    const message = this.service.getMembersMessage();
    if (message) {
      this.message.writeSuccess(this.translate.instant(message));
    }
  }

  // -- component model methods ---------------------------------------------

  setModelData(): void {
    super.setModelData(this.model);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    return super.canDeactivate(this.service.areMembersChanged());
  }

  // -- data processing methods ---------------------------------------------

  getModel(id: number) {
    this.loading ++;
    this.service.getItem(id)
      .then(() => {
        this.getParams();
        this.setFormData(this.model);
        this.service.saveMembersBefore();
      })
      .catch(() => {})
      .then(() => this.loading --);
  }

  getParams() {
    this.loading ++;
    this.service.getParams()
      .then(() => {})
      .catch(() => {})
      .then(() => this.loading --);
  }

  saveModel(): void {
    this.saving ++;
    this.service.save(this.id, false, (response) => {
      if (response && response.errors) {
          if (response.errors.queueMembers) {
              let message: string;
              message = this.formComponent.selected === 'Members'
                  ? this.translate.instant('You have not chosen the members')
                  : this.translate.instant('Choose at least one member');
              this.message.writeError(message);
          }
          return true;
      }
    }).then(() => {
        let okMessage: string;
        if (this.isCallQueue) {
          okMessage = this.hasId
            ? this.translate.instant('The changes have been saved successfully')
            : this.translate.instant('Call Queue has been created successfully');
        }
        else {
          okMessage = this.hasId
            ? this.translate.instant('The changes have been saved successfully')
            : this.translate.instant('Ring Group has been created successfully');
        }
        this.message.writeSuccess(okMessage);

        this.saveFormState();
        this.service.saveMembersBefore();
        if (!this.id) this.cancel();
      })
      .catch(() => {})
      .then(() => this.saving --);
  }
}
