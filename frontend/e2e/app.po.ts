import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo(url: string) {
    return browser.get(url);
  }

  getCurrentUrl() {
    return browser.getCurrentUrl();
  }

  getLogoUrl() {
    return element(by.css('app-menu-bar img')).getAttribute('src');
  }

  fillInSignUp(userInfo: {
    email?: string,
    username?: string,
    password?: string,
    confirmPassword?: string,
    nickname?: string
  }) {
    const keys = ['email', 'username', 'password', 'confirmPassword', 'nickname'];
    for (const key of keys) {
      if (key in userInfo) {
        element(by.name(key)).sendKeys(userInfo[key]);
      }
    }
  }

  submitSignUp() {
    element(by.css('app-sign-up button')).click();
  }
}
