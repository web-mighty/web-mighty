import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo(url: string) {
    return browser.get(url);
  }

  getLogoUrl() {
    return element(by.css('app-menu-bar img')).getAttribute('src');
  }
}
