import { Subject } from 'rxjs/Subject';

export interface IvrFormInterface {
    data: any;
    references: any;

    valid: boolean;

    onDelete: Function;
    onFormChange: Subject<any>;
    onAddLevel: Function;

    formPanel: Element;

    getData();
    close(editMode: boolean, confirmCallback?: () => void): void;
    showExitModal(editMode: boolean, confirmCallback?: () => void): void;
    scrollToFirstError(): void;
}
