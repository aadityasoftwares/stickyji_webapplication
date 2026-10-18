import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-website-not-found',
  imports: [RouterLink],
  template: `<main>
    <span>404</span>
    <h1>This page isn't here.</h1>
    <p>Let's get you back to your ideas.</p>
    <a routerLink="/home">Back to Sticky Ji</a>
  </main>`,
  styles: [
    `
      main {
        max-width: 680px;
        margin: 15vh auto;
        padding: 32px;
        text-align: center;
      }
      span,
      a {
        color: #4e6240;
      }
      h1 {
        margin: 20px 0;
      }
      p {
        margin-bottom: 24px;
      }
      a {
        display: inline-block;
        padding: 14px 20px;
        border: 1px solid currentColor;
        border-radius: 10px;
      }
    `,
  ],
})
export class WebsiteNotFound {}
