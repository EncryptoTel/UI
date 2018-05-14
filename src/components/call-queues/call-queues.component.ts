import {Component} from '@angular/core';
import {QueuesListItem} from '../../models/queue.model';
import {CallQueuesServices} from '../../services/call-queues.services';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'pbx-call-queues',
  templateUrl: './template.html',
  styleUrls: ['./local.sass']
})

export class CallQueuesComponent {
  constructor(private _service: CallQueuesServices,
              private router: Router,
              private activatedRoute: ActivatedRoute) {
    this.getQueues();
  }

  queues: QueuesListItem[] = [];

  tableInfo = {
    titles: ['Queue Name', 'Phone Number', 'Ring Strategy', 'Ring Time'],
    keys: ['name', 'number', 'strategy', 'timeout']
  };

  edit(queue: QueuesListItem): void {
    this.router.navigate(['edit', queue.id], {relativeTo: this.activatedRoute});
  }

  delete(id: number): void {
    this._service.delete(id).then(res => {
      console.log(res);
    }).catch(err => {
      console.error(err);
    });
  }

  private getQueues(): void {
    this._service.getQueues().then(res => {
      if (res.hasOwnProperty('items')) {
        this.queues = res.items;
      }
    }).catch(err => {
      console.error(err);
    });
  }
}
