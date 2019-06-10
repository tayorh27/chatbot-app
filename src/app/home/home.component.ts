import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as firebase from 'firebase';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  container: HTMLElement;

  frame_url = '';
  closeResult = '';
  header_title = '';
  placeholder = '';
  send_placeholder = 'Type your response here';
  placeholder_inner_msg = '';
  initial_index = 0;
  count = 0;
  time_ago = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  user_input_text: string = '';

  messageData: any = [];

  constructor(private toastr: ToastrService, private modalService: NgbModal) { }//admin sigin first

  ngOnInit() {
    // firebase.auth().signOut();
    // localStorage.clear();
    this.runAuthChange();
  }

  runAuthChange() {
    if (localStorage.getItem('email') != null) {
      firebase.auth().onAuthStateChanged(user => {
        if (firebase.auth().currentUser) {
          const email = localStorage.getItem('email');
          this.placeholder = "Hi I am Tara, your talent and career assistant.<br>Are you a job seeker or an employer?<br>[Job seeker]<br>[Employer]";
          this.placeholder_inner_msg = `Hi ${email}, What's up...`;
          this.send_placeholder = 'Type your response here';
          this.header_title = `Chat - Welcome back ${email}`;
          this.initial_index = 1;
          this.loadChatHistory();
        } else {
          this.header_title = 'Chat';
          this.placeholder = "Hi I am Tara, your talent and career assistant. Please input your email and let's get started.";
          this.send_placeholder = "Please input your email and let's get started.";
        }
      });
    } else {
      this.header_title = 'Chat';
      this.placeholder = "Hi I am Tara, your talent and career assistant. Please input your email and let's get started.";
      this.send_placeholder = "Please input your email and let's get started.";
    }
  }

  ngAfterViewInit() {
    const input = <HTMLInputElement>document.getElementById("user_text");
    input.addEventListener("keyup", function(event){
      if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        const button = <HTMLButtonElement>document.getElementById("mButton");
        button.click();
      }
    });
  }

  onSendClick() {
    const _input = (<HTMLInputElement>document.getElementById('user_text')).value.toLowerCase().replace(' ', '');
    if (this.initial_index == 0) {
      const regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
      const isEmail = regexp.test(_input);
      if (!isEmail) {
        this.toastr.error(`Invalid email address: ${_input}`);
      } else {
        // const localEmail = localStorage.getItem('email');
        // if (localEmail == null) {

        //   //this.createUserInAndStartChatting();
        // } else {
        //   this.signUserInAndStartChatting();
        // }
        this.checkIfEmailExists(_input);
      }
    } else {
      if (this.user_input_text.length > 0) {
        this.sendMessageToBot();
      }
    }
  }

  checkIfEmailExists(email:string) {
    firebase.auth().signInAnonymously().then(user => {
      let re = /\./gi;
      firebase.database().ref(`rooms/${email.replace(re, ',')}`).once('value', snapshot => {
        if (snapshot.exists()) {
          firebase.auth().currentUser.delete();
          firebase.auth().signOut();
          //this.runAuthChange();
          this.signUserInAndStartChatting();
        } else {
          firebase.auth().currentUser.delete();
          firebase.auth().signOut();
          //this.runAuthChange();
          this.createUserInAndStartChatting();
        }
      })
    })
  }

  sendMessageToBot() {
    const localEmail = localStorage.getItem('email');
    let re = /\./gi;
    const createRef = firebase.database().ref(`rooms/${localEmail.replace(re, ',')}/messages`);
    const messageId = createRef.push().key;

    const data: {} = this.messageData[this.count - 1];
    var extra_data;
    if (this.count == 0) {
      extra_data = undefined;
    } else {
      extra_data = data['extra_data'];
    }

    if (extra_data == undefined) {
      createRef.child(messageId).set({
        'display_type': 'user',
        'created_date': `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        'text': this.user_input_text
      }).then((t) => {
        this.user_input_text = '';
        this.initial_index = 1;
      })
    } else {
      //const extra_data = `${data['extra_data']}`;
      createRef.child(messageId).set({
        'display_type': 'user',
        'created_date': `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        'text': this.user_input_text,
        'extra_data': `${data['extra_data']}`
      }).then((t) => {
        this.user_input_text = '';
        this.initial_index = 1;
      })
    }
  }

  createUserInAndStartChatting() {
    this.toastr.success("Please wait...")
    const _input = (<HTMLInputElement>document.getElementById('user_text')).value.toLowerCase().replace(' ', '');
    const password = _input.substring(0, 6);
    firebase.auth().createUserWithEmailAndPassword(_input, password).then((user) => {
      localStorage.setItem('email', _input);
      let re = /\./gi;
      const createRef = firebase.database().ref(`rooms/${_input.replace(re, ',')}`);
      const messageId = createRef.push().key;
      createRef.child('messages').child(messageId).set({
        'display_type': 'user',
        'created_date': `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        'text': 'Created account successfully.'
      }).then((t) => {
        createRef.child('settings').set({
          'job': 'undefined',
          'location': 'undefined'
        });
        this.user_input_text = '';
        this.initial_index = 1;
        this.runAuthChange();
      }).catch(err => {
        this.toastr.error(`${err}`);
      })
    }).catch(err => {
      this.toastr.error(`${err}`);
    });
  }

  signUserInAndStartChatting() {
    this.toastr.success("Please wait...")
    const _input = (<HTMLInputElement>document.getElementById('user_text')).value.toLowerCase().replace(' ', '');
    const password = _input.substring(0, 6);
    firebase.auth().signInWithEmailAndPassword(_input, password).then(user => {
      localStorage.setItem('email', _input);
      let re = /\./gi;
      const createRef = firebase.database().ref(`rooms/${_input.replace(re, ',')}`);
      const messageId = createRef.push().key;
      createRef.child('messages').child(messageId).set({
        'display_type': 'user',
        'created_date': `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        'text': 'Account sign in successful.'
      }).then((t) => {
        createRef.child('settings').set({
          'job': 'undefined',
          'location': 'undefined'
        });
        this.user_input_text = '';
        this.initial_index = 1;
        this.runAuthChange();
      }).catch(err => {
        this.toastr.error(`${err}`);
      })
    }).catch(err => {
      this.toastr.error(`${err}`);
    })
  }

  loadChatHistory() {
    const localEmail = localStorage.getItem('email');
    let re = /\./gi;
    const historyRef = firebase.database().ref(`rooms/${localEmail.replace(re, ',')}/messages`);
    historyRef.on('value', snapshot => {
      this.messageData = [];
      this.count = 0;
      snapshot.forEach(data => {
        this.messageData.push(data.val());
        this.count = this.count + 1;
      });
      //this.buildClickListener();
      // this.container = document.getElementById("msgContainer");
      // this.container.scrollTop = this.container.scrollHeight;
      //this.scrollToBottom();
    });
  }

  buildClickListener() {
    console.log("okay")
    var figures = document.querySelectorAll('a');
    for (let i = 0; i < figures.length; i++) {
      console.log("hello: " + i)
      figures[i].addEventListener("click", function () {
        console.log("hello")
      })
    }
  }

  onLinkClicked(content, url: string) {
    //console.log(url);
    this.frame_url = url;
    (<HTMLIFrameElement>document.getElementById("mframe")).setAttribute("src", url);
    //this.open(content, 'Notification', '');
  }

  open(content, type, modalDimension) {
    if (modalDimension === 'sm' && type === 'modal_mini') {
      this.modalService.open(content, { windowClass: 'modal-mini', size: 'sm', centered: true }).result.then((result) => {
        this.closeResult = 'Closed with: $result';
      }, (reason) => {
        this.closeResult = 'Dismissed $this.getDismissReason(reason)';
      });
    } else if (modalDimension === '' && type === 'Notification') {
      this.modalService.open(content, { windowClass: 'modal-danger', centered: true }).result.then((result) => {
        this.closeResult = 'Closed with: $result';
      }, (reason) => {
        this.closeResult = 'Dismissed $this.getDismissReason(reason)';
      });
    } else {
      this.modalService.open(content, { centered: true }).result.then((result) => {
        this.closeResult = 'Closed with: $result';
      }, (reason) => {
        this.closeResult = 'Dismissed $this.getDismissReason(reason)';
      });
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return 'with: $reason';
    }
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
