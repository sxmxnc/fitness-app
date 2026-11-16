/**
 * Autor: Luca Lammers

 */
import { Page } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

export class Landing {
  constructor(private readonly page: Page) {}

  hero() {
    return this.page.locator("#hero");
  }
  features() {
    return this.page.locator("#features");
  }
  preview() {
    return this.page.locator("#preview");
  }
  footer() {
    return this.page.locator("#footer");
  }
  footerGitHubLink() {
    return this.page.locator('.footer-links a[href*="github.com/sxmxnc/fitness-app"]');
  }
  footerLoginLink() {
    return this.page.locator('.footer-links a[href="/login"]');
  }
  loginBtn() {
    return this.page.getByTestId("hero-start-btn");
  }
  exploreBtn() {
    return this.page.getByTestId("hero-project-btn");
  }
  navStartBtn() {
    return this.page.locator(".start-btn");
  }
  navFeaturesLink() {
    return this.page.locator('a[href="#features"]');
  }
  navPreviewLink() {
    return this.page.locator('a[href="#preview"]');
  }
  navContactLink() {
    return this.page.locator('a[href="#footer"]');
  }

  async goto() {
    await this.page.goto(BASE_URL);
  }

  async gotoLoginHero() {
    await this.loginBtn().click();
  }

  async gotoGitHero() {
    await this.exploreBtn().click();
  }
}
