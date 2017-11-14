import { Component, OnInit } from '@angular/core';
import { HubConnection } from '@aspnet/signalr-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private _hubConnection: HubConnection;
  nick = '';
  message = '';
  messages: string[] = [];

  public sendMessage(): void {
    this._hubConnection
      .invoke('sendToAll', this.nick, this.message)
      .catch(err => console.error(err));
  }

  ngOnInit() {
    this.nick = window.prompt('Your name:', 'John');

    this._hubConnection = new HubConnection('http://localhost:5000/chat');

    this._hubConnection
      .start()
      .then(() => console.log('Connection started!'))
      .catch(err => console.log('Error while establishing connection :('));

      this._hubConnection.on('sendToAll', (nick: string, receivedMessage: string) => {
        const text = `${nick}: ${receivedMessage}`;
        this.messages.push(text);
      });

    }
}
