 /**
  * Regular expressions
  * ---
  * name contains ({alpha}|{number}|{allowedSymbols}), but cannot start with {allowedSymbols}:
  * ^([{alpha}{number}]([{allowedSymbols}]+)?)+$, simple: ^([a-z]([0-9]+)?)+$
  */

export const emailRegExp = new RegExp(
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))|[0-9]+-[0-9]{3}$/);

export const simpleNameRegExp = new RegExp(/^[a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]+$/i);
export const nameRegExp = new RegExp(/^([А-Яа-яA-Za-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_.\' ']+)?)+$/i);
export const registrationUserNameRegExp = new RegExp(/^([А-Яа-яA-Za-z\u00BF-\u1FFF\u2C00-\uD7FF]([\-_.\' ']+)?)+$/i);
export const profileNameRegExp = new RegExp(/^([А-Яа-яA-Za-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_.\'']+)?)+$/i);

export const ivrNameRegExp = new RegExp(/^([А-Яа-яA-Za-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-\.']+)?)+$/i);

export const numberRegExp = new RegExp(/^\d+$/);
export const phoneRegExp = new RegExp(/^\d{6,16}$/m);

export const week: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Company pattern RegExps
export const companyNameRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_ ]+)?)+$/i);
export const companyHouseRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\/ ]+)?)+$/i);
export const companyOfficeRegExp = numberRegExp;
export const companyPhoneRegExp = numberRegExp;
export const companyVatIDRegExp = new RegExp(/^[\A-Za-z\u00BF-\u1FFF\u2C00-\uD7FF0-9-_]+$/i);

// Call Rules pattern RegExps
export const callRuleNameRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_ ]+)?)+$/i);
export const contactAddressRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_.]+)?)+$/i);

export const ringGroupsNameRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\- ]+)?)+$/i);

// Address book
export const adddressNameRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_']+)?)+$/i);
export const adddressAddressRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9]([\-_\.]+)?)+$/i);
export const addressPhoneRegExp = new RegExp(/^[\d#]{6,16}$/m);

// Department
export const departmentNameRegExp = new RegExp(/^([a-z\u00BF-\u1FFF\u2C00-\uD7FF0-9](\s+)?)+$/i);

export const optionNameRegExp = new RegExp(/^(.*?)\s*(\(\+?\d+\))?$/);

export const filenameRegExp = new RegExp(/^(.+)\.([^\.]+)$/);

// Partner Program
export const partnerLinkRegExp = new RegExp(/^\d+[a-f\d]+$/i);

// Deletion messages
export const reDelSuccess = new RegExp(/successfully deleted/i);
export const reDelInUse = new RegExp(/^this object is used in (.+) name (.+)$/i);
