import { Component, OnInit } from '@angular/core';
import * as firebase from 'firebase';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'chatbot-app';

  ngOnInit() {
    const firebaseConfig = {
      apiKey: "AIzaSyD64qt4FRHldN02NZNbX_M827Y3NbW1-OE",
      authDomain: "orodata-8df47.firebaseapp.com",
      databaseURL: "https://orodata-8df47.firebaseio.com",
      projectId: "orodata-8df47",
      storageBucket: "orodata-8df47.appspot.com",
      messagingSenderId: "452766134796",
      appId: "1:452766134796:web:981b6b4a4e17d424"
    };
    firebase.initializeApp(firebaseConfig);
  }
}
