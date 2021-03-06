import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FadeAnimation} from '../../shared/fade-animation';

@Component({
    selector: 'pbx-modal',
    templateUrl: './template.html',
    styleUrls: ['./local.sass'],
    animations: [FadeAnimation('200ms')]
})

export class ModalComponent {

    @Input() modal: {
        visible: boolean,
        title: string,
        confirm: { type: string, value: string },
        decline: { type: string, value: string }
    };
    @Input() modalEx: ModalEx;

    @Output() onConfirm: EventEmitter<void> = new EventEmitter<void>();
    @Output() onConfirmEx: EventEmitter<any> = new EventEmitter<any>();
    @Output() onDecline: EventEmitter<void> = new EventEmitter<void>();

    confirm(): void {
        this.onConfirm.emit();
        this.modal.visible = false;
    }

    hideModal(): void {
        this.onDecline.emit();

        if (this.modal) {
            this.modal.visible = false;
        }
        if (this.modalEx) {
            if (this.modalEx.cancelCallback) {
                this.modalEx.cancelCallback();
            }
            this.modalEx.visible = false;
        }
    }

    clickEx(button: ModalButton): void {
        if (button.type === 'cancel') {
            this.hideModal();
        }
        else {
            if (this.modalEx && this.modalEx.confirmCallback) {
                this.modalEx.confirmCallback();
            }
            else {
                this.onConfirmEx.emit(button);
            }
            this.modalEx.visible = false;
        }
    }

}

export class ModalEx {

    visible: boolean;
    title: string;
    body: string;
    buttons: ModalButton[];

    confirmCallback: () => void = null;
    cancelCallback: () => void = null;

    constructor(
        body?: string,
        create?: string) {

        this.visible = false;
        this.title = '';
        this.body = body;
        this.buttons = [];

        switch (create) {
            case 'delete':
                this.title = 'Confirm';
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Delete'));
                break;
            case 'block':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to block this contact?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Block'));
                break;
            case 'unblock':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to unblock this contact?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Unblock'));
                break;
            case 'changeTariff':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to change your tariff plan?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Yes'));
                break;
            case 'buyModule':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to buy this module?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Yes'));
                break;
            case 'buyNumber':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to buy this number?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Yes'));
                break;
            case 'deleteFiles':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to delete the file(s)?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Delete'));
                break;
            case 'restoreFiles':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Are you sure you want to restore the file(s)?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Restore'));
                break;
            case 'replaceOnlyFiles':
                this.title = 'Attention';
                if (!this.body) {
                    this.body = 'A file with the same name has already been created. Do you want to replace it?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel', 0));
                this.buttons.push(new ModalButton('success', 'Replace', 1));
                break;
            case 'replaceFiles':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'A file with this name has already been created.  Do you want to replace or rename it?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel', 0));
                this.buttons.push(new ModalButton('error', 'Replace', 1));
                this.buttons.push(new ModalButton('success', 'Rename', 2));
                break;
            case 'resetToAdmin':
                this.title = 'Reset password';
                if (!this.body) {
                    this.body = 'Are you sure you want to reset your password and send your new password to the admin?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Reset'));
                break;
            case 'resetToUser':
                this.title = 'Reset password';
                if (!this.body) {
                    this.body = 'Are you sure you want to reset your password and send your new password to the user?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Reset'));
                break;
            case 'resetToSelected':
                this.title = 'Reset password';
                if (!this.body) {
                    this.body = 'Are you sure you want to reset your password and send your new password to the chosen users?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Reset'));
                break;
            case 'cancelEdit':
                this.title = 'Confirm';
                if (!this.body) {
                    this.body = 'Stop editing?';
                }
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('success', 'Yes'));
                break;
            case 'emptyTrash':
                this.title = 'Confirm';
                this.body = 'Permanently delete&nbsp;<span class="all">all</span>&nbsp;files?';
                this.buttons.push(new ModalButton('cancel', 'Cancel'));
                this.buttons.push(new ModalButton('error', 'Permanently Delete'));
                break;
        }
    }

    show(): void {
        this.visible = true;
    }

    hide(): void {
        this.visible = false;
    }

    setMessage(message: string): void {
        this.body = message;
    }
}

export class ModalButton {
    tag: number;
    type: string;
    value: string;
    loading: boolean;

    constructor(type?, value?, tag?) {
        this.type = type;
        this.value = value;
        this.tag = tag;
    }
}
