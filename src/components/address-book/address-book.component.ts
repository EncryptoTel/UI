import {Component, OnInit} from '@angular/core';
import {FormBuilder, Validators, FormArray, FormGroup} from '@angular/forms';

import {AddressBookServices} from '../../services/address-book.services';
import {ContactModel, Countries, Country, PhoneTypes, Types} from '../../models/address-book.model';
import {emailRegExp} from '../../shared/vars';


@Component({
  selector: 'pbx-address-book',
  templateUrl: './template.html',
  styleUrls: ['./local.sass']
})

export class AddressBookComponent implements OnInit {
  tableInfo = {
    titles: ['First Name', 'Last Name', 'Phone number', 'E-mail', 'Company Name', 'Country'],
    keys: ['firstname', 'lastname', 'contactPhones', 'contactEmails', 'company', 'countryName']
  };
  countries: Country[];
  selectedCountry: Country;
  addressForm: FormGroup;
  _phoneTypes: PhoneTypes = {
    Home: 1,
    Work: 2,
    Mobile: 3
  };
  selectedPhoneTypes: PhoneTypes[] = [];
  contacts: ContactModel[] = [];
  currentContact: ContactModel;
  sidebarVisible = false;
  mode = 'create';

  constructor(private fb: FormBuilder, private _service: AddressBookServices) {
  }

  addPhoneField() {
    this.contactPhones.push(this.createNumberFormField());
  }

  addEmailField() {
    this.contactEmails.push(this.createEmailFormField());
  }

  cancel() {

  }

  close() {
    this.sidebarVisible = false;
  }

  edit(value: ContactModel): void {
    this.addressForm.reset();
    console.log(this.addressForm);
    this.contactEmails.controls = [];
    this.contactPhones.controls = [];
    value.contactEmails.forEach(() => {
      this.addEmailField();
    });
    value.contactPhones.forEach(phone => {
      console.log(phone);
      this.addPhoneField();
    });
    this.addressForm.setValue(this.formatForEdit(value));
    this.addressForm.get('countryId').setValue(value.countryId);
    const cntry = this.countries.find(country => {
      if (this.currentContact.countryId === country.id) {
        return true;
      }
    });
    this.selectedCountry = cntry;
    this.mode = 'edit';
    this.sidebarVisible = true;
  }


  save(): void {
    this.addressForm.markAsTouched();
    this.validate(this.addressForm);
    console.log(this.addressForm);
    if (this.addressForm.valid) {
      this._service.saveContact({...this.addressForm.value}).then(() => {
        this.getContacts();
      }).catch(err => {
          console.error(err);
        }
      );
    }
  }

  select(value): void {
    this.sidebarVisible = true;
    this.mode = 'view';
    this.currentContact = value;
  }

  selectPhoneType(phone, i): void {
    this.addressForm.get(['contactPhones', `${i}`, 'typeId']).setValue(phone.value);
    this.selectedPhoneTypes[i] = phone;
  }

  selectCountry(country: Country): void {
    this.addressForm.get('countryId').setValue(country.id);
    this.selectedCountry = country;
  }

  get contactPhones(): FormArray {
    return this.addressForm.get('contactPhones') as FormArray;
  }

  get contactEmails(): FormArray {
    return this.addressForm.get('contactEmails') as FormArray;
  }

  get phoneTypes(): object[] {
    const phoneTypes = [];
    Object.keys(this._phoneTypes).forEach(key => {
      phoneTypes.push({type: key, value: this._phoneTypes[key]});
    });
    return phoneTypes;
  }

  newContact(): void {
    this.sidebarVisible = true;
    this.mode = 'create';
  }

  private formatForEdit(contact): ContactModel {
    let {contactAddresses, contactEmails, contactPhones} = contact;
    contactAddresses = contactAddresses.map(address => {
      return {value: address.value, typeId: ''};
    });
    contactEmails = contactEmails.map(email => {
      return {value: email.value, typeId: ''};
    });
    contactPhones = contactPhones.map(phone => {
      return {value: `${phone.value} #${phone.extension}`, typeId: phone.typeId};
    });
    return {
      company: contact.company,
      countryId: contact.countryId,
      department: contact.department,
      firstname: contact.firstname,
      lastname: contact.lastname,
      contactAddresses: contactAddresses,
      contactEmails: contactEmails,
      contactPhones: contactPhones
    };
  }

  private getCountries(): void {
    this._service.getCountries().then((res: Countries) => {
      this.countries = res.countries;
      this.getContacts();
    }).catch(err => {
      console.error(err);
    });
  }

  private getContacts(): void {
    this._service.getContacts().then(res => {
      this.contacts = res.items;
      this.contacts.forEach(contact => {
        const cntry = this.countries.find(country => {
          if (contact.countryId === country.id) {
            return true;
          }
        });
        if (cntry) {
          contact.countryName = cntry.title;
        }
      });
      console.log(this.contacts);
    }).catch(err => {
      console.error(err);
    });
  }

  private validate(form: FormGroup) {
    Object.keys(form.controls).forEach(control => {
      if (form.get(control) instanceof FormArray) {
        const ctrl = form.get(control) as FormArray;
        ctrl.controls.forEach(cont => {
          const ctr = cont as FormGroup;
          ctr.markAsTouched();
          Object.keys(ctr.controls).forEach(c => {
            ctr.get(c).markAsTouched();
          });
        });
      } else {
        form.get(control).markAsTouched();
      }
    });
  }

  private createEmailFormField(): FormGroup {
    return this.fb.group({
      value: ['', [Validators.required, Validators.pattern(emailRegExp)]],
      typeId: ''
    });
  }

  private createNumberFormField(): FormGroup {
    return this.fb.group({
      value: ['', [Validators.required, Validators.minLength(8)]],
      typeId: ''
    });
  }

  private getTypes() {
    this._service.getTypes().then((res: Types) => {
      this._phoneTypes = res.contactPhones;

    }).catch(err => {
      console.error(err);
    });
  }

  ngOnInit() {
    this.getCountries();
    this.getTypes();
    this.addressForm = this.fb.group({
      countryId: '',
      firstname: ['', [Validators.required]],
      lastname: '',
      department: '',
      company: '',
      contactAddresses: this.fb.array([this.fb.group({
        value: ['', [Validators.required]],
        typeId: ''
      })]),
      contactPhones: this.fb.array([this.createNumberFormField()]),
      contactEmails: this.fb.array([this.createEmailFormField()])
    });
  }
}
