# Jvx-multiselect

Jvx-multiselect is a multipurpose - multiselect material web component which manages both synchronous and asynchronous selections.

## Build

```npm
npm install
vue-cli-service build --target wc --name jvx-multiselect jvx-multiselect.vue --inline-vue
```

## Installation & use
Use `npm link` to include jvx-multiselect in your project.
#### Angular10

###### *app.module.ts*
```ts
import { BrowserModule } from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
```
###### *custom.component.ts*
```ts
import {Component} from '@angular/core';
import 'jvx-multiselect';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular-test';
  options = [
                {value: 0, text: 'Val 0'}, 
                {value: 1, text: 'Val 1'}, 
                {value: 2, text: 'Val 2'}
            ];
}
```

###### *custom.component.html*
```angular2html
<jvx-multiselect [options]="options"></jvx-multiselect>
```


