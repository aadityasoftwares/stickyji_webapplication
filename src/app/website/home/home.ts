import { Component } from '@angular/core';
import { Hero } from "../hero/hero";
import { WebsiteHeader } from "../website-header/website-header";
import { ThoughtFlow } from "../thought-flow/thought-flow";
import { UseCases } from "../use-cases/use-cases";
import { Reviews } from "../reviews/reviews";
import { Subscription } from "../subscription/subscription";
import { Collaboration } from "../collaboration/collaboration";
import { WebsiteFooter } from "../website-footer/website-footer";

@Component({
  imports: [Hero, WebsiteHeader, ThoughtFlow, UseCases, Reviews, Subscription, WebsiteFooter],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home { }
