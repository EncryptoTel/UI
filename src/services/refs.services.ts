import {CountryModel} from '../models/country.model';
import {DepartmentItem, DepartmentModel} from '../models/department.model';
import {BaseService} from './base.service';
import {Subscription} from 'rxjs/Subscription';

export class RefsServices extends BaseService {
    private countries: CountryModel[] = [];
    private sipOuters: any = [];
    private departments: DepartmentModel = new DepartmentModel();
    private logoutSubscription: Subscription;

    getCountries(): Promise<CountryModel[]> {
        return this.request.get(`v1/countries`).then(response => {
            this.countries = response.countries;
            return Promise.resolve(this.countries);
        });
    }

    getSipOuters(): Promise<any> {

        return this.request.get(`v1/sip/outers?limit=1000`).then(outers => {
            this.sipOuters = outers['items'];
            return Promise.resolve(this.sipOuters);
        });
    }

    getInnerSipOuters(): Promise<any> {
        return this.request.get(`v1/sip/inner/outers-list?limit=1000`).then(outers => {
            outers.items.forEach(item => {
                if (item.providerId && item.providerId !== 1) {
                    item.phoneNumber = '+' + item.phoneNumber;
                }
            });
            Promise.resolve(outers);
            this.sipOuters = outers['items'];
            return Promise.resolve(this.sipOuters);
        });
    }

    getDepartments(): Promise<any> {
        if (this.departments.itemsCount === 0) {
            return this.request.get(`v1/department`).then((res: DepartmentModel) => {
                this.departments = this.plainToClassEx(DepartmentModel, DepartmentItem, res);
                this.departments.items.unshift({id: 0, name: 'All', comment: '', employees: 0, sipInnerIds: [], editable: true, loading: 0});
                return Promise.resolve(this.departments);
            });
        } else {
            return Promise.resolve(this.departments);
        }
    }

    clearCache() {
        this.countries = [];
        this.sipOuters = [];
        this.departments = new DepartmentModel();
    }

    onInit() {
        this.logoutSubscription = this.request.logoutSubscription().subscribe(() => {
            this.clearCache();
        });

    }

}
