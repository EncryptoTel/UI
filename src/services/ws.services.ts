import { Injectable } from '@angular/core';
import { Socket } from 'ng-socket-io';
import { Subject } from 'rxjs/Subject';
import { BalanceModel, CdrModel, ServiceModel } from '../models/ws.model';
import { Observable } from 'rxjs/Observable';
import { LoggerServices } from './logger.services';
import { ChatModel, MessageModel } from '../models/chat.model';
import { MessageServices } from './message.services';
import { RefsServices } from './refs.services';
import { StorageItem } from '@models/storage.model';
import { SupportModel } from '@models/ws.model';
import { TranslateService } from '@ngx-translate/core';


@Injectable()
export class WsServices {

  balance: BalanceModel;
  balanceSubscription: Subject<BalanceModel> = new Subject<BalanceModel>();

  cdr: CdrModel[] = [];
  cdrSubscription: Subject<CdrModel[]> = new Subject<CdrModel[]>();

  support: SupportModel[] = [];
  supportSubscription: Subject<SupportModel[]> = new Subject<SupportModel[]>();

  service: ServiceModel;
  serviceSubscription: Subject<ServiceModel> = new Subject<ServiceModel>();

  messages: MessageModel[] = [];
  messagesSubscription: Subject<MessageModel[]> = new Subject<MessageModel[]>();

  chats: ChatModel[] = [];
  chatsSubscription: Subject<ChatModel[]> = new Subject<ChatModel[]>();

  storageItem: StorageItem;
  storageItemUpdate: Subject<StorageItem> = new Subject<StorageItem>();

  token: string = '';

  constructor(
    private socket: Socket,
    private logger: LoggerServices,
    private _refs: RefsServices,
    private _message: MessageServices,
    private _translate: TranslateService
  ) {
    this.balance = { balance: 0 };
    this.service = { id: null };

    const _this = this;
    socket.on('connect', function () {
      _this.log('<<< connect', null);
      _this.onConnect();
    });
    socket.on('channels', function (data) {
      _this.log('<<< channels', data);
      _this.onChannels(data);
    });
    socket.on('eventClient', function (data) {
      _this.log('<<< eventClient', data);
      _this.onEventClient(data);
    });
    socket.on('balance', function (data) {
      _this.log('<<< balance', data);
      _this.onBalance(data);
    });
    socket.on('service', function (data) {
      _this.log('<<< service', data);
      _this.onService(data);
    });
    socket.on('notification', function (data) {
      console.log(data);
      _this.log('<<< notification', data);
      _this._refs.request.logout();
      _this._message
        .writeError(
          _this._translate.instant('You already have an authorized session running'),
          10000);
      _this.onNotification(data);
    });
    socket.on('message', function (data) {
      _this.log('<<< message', data);
      _this.onMessage(data);
    });
    socket.on('chat', function (data) {
      _this.log('<<< chat', data);
      _this.onChat(data);
    });
    socket.on('errors', function (data) {
      _this.log('<<< errors', data);
      _this.onErrors(data);
    });
    socket.on('close', function (data) {
      _this.log('<<< close', data);
      _this.onClose(data);
    });
    socket.on('cdr', function (data) {
      _this.log('<<< cdr', data);
      _this.onCdr(data);
    });
    socket.on('systemInfo', function (data) {
      _this.log('<<< systemInfo', data);
      _this.onSystemInfo(data);
    });
    socket.on('support', function (data) {
      console.log('________________', data);
      _this.log('<<< support', data);
      _this.onSupport(data);
    });
  }

  log(details: string, data: any) {
    this.logger.logEx(this, details, data);
  }

  setToken(token: string) {
    if (this.token !== '') {
      this.token = token;
      this.authenticate();
    } else {
      this.token = token;
    }
  }

  private onConnect() {
    this.authenticate();
  }

  private onChannels(data) {
    this.subscribe(data.channel);
    switch (data.channel) {
      case 'message':
        this.getMessages();
        break;
      case 'chat':
        this.getChats();
        break;
    }
  }

  private onEventClient(data) {
  }

  private onBalance(data) {
    this.balance.balance = JSON.parse(data).balance;
    this.balanceSubscription.next(this.balance);
  }

  private onService(data) {
    this.service.id = JSON.parse(data).id;
    this.serviceSubscription.next(this.service);
  }

  private onNotification(data) {

  }

  private onCdr(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    this.cdr.push(new CdrModel(data.id));
    this.cdrSubscription.next(this.cdr);
  }

  private onSupport(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    this.support.push(new SupportModel(data.message.id, data.message.status));
    this.supportSubscription.next(this.support);
  }

  private onSystemInfo(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    console.log(data);
    if (data.message.object === 'accountFile') {
      this.storageItem = data.message.objectData;
      this.storageItemUpdate.next(this.storageItem);
    }
  }

  private onMessage(data) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    let messages: MessageModel[];
    messages = data.messages;
    for (let i = 0; i < messages.length; i++) {
      let message: any;
      message = messages[i];

      if (!message.my && !message.statusUpdated2 && message.status < 2) {
        message.statusUpdated2 = true;
        this.deliverMessage(message.id);
      }

      let b = true;
      for (let j = 0; j < this.messages.length; j++) {
        if (this.messages[j].id === message.id) {
          b = false;
          this.messages[j] = message;
        }
      }
      if (b) {
        this.messages.push(message);
      }
    }
    this.messagesSubscription.next(this.messages);
  }

  private onChat(data) {
    let chats: ChatModel[];
    chats = data.chats;
    for (let i = 0; i < chats.length; i++) {
      let b = true;
      for (let j = 0; j < this.chats.length; j++) {
        if (this.chats[j].id === chats[i].id) {
          b = false;
          this.chats[j] = chats[i];
        }
      }
      if (b) {
        this.chats.push(chats[i]);
      }
    }
    this.chatsSubscription.next(this.chats);
  }

  private onErrors(data) {
    // this.message.writeError(data.error.message);
  }

  private onClose(data) {
  }

  close() {
    this.socket.disconnect();
  }

  connect() {
    this.socket.connect();
  }

  private send(eventName: string, data: any) {
    this.log(`>>> ${eventName}`, data)
    this.socket.emit(eventName, data);
  }

  authenticate() {
    if (this.token) {
      this.send('authenticate', { token: this.token });
    }
  }

  subscribe(channel: string) {
    this.send('subscribe-to-channel', { channel: channel });
  }

  sendMessage(chatId: number, message: string) {
    this.send('send-message', { body: message, chatId: chatId });
  }

  readMessage(id: number) {
    this.send('read-message', { id: id });
  }

  deliverMessage(id: number) {
    this.send('deliver-message', { id: id });
  }

  getMessages() {
    this.send('get-messages', {});
    return this.messages;
  }

  getChats() {
    this.send('get-chats', {});
    return this.chats;
  }

  getBalance(): Observable<BalanceModel> {
    return this.balanceSubscription.asObservable();
  }

  getService(): Observable<ServiceModel> {
    return this.serviceSubscription.asObservable();
  }

  subMessages(): Observable<MessageModel[]> {
    return this.messagesSubscription.asObservable();
  }

  subChats(): Observable<ChatModel[]> {
    return this.chatsSubscription.asObservable();
  }

  subCdr(): Observable<CdrModel[]> {
    return this.cdrSubscription.asObservable();
  }

  updateStorageItem(): Observable<StorageItem> {
    return this.storageItemUpdate.asObservable();
  }

  subSupport(): Observable<SupportModel[]> {
    return this.supportSubscription.asObservable();
  }

}
