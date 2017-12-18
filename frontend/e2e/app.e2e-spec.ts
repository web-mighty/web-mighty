import { browser, by, element } from 'protractor';
import { AppPage } from './app.po';

describe('frontend App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should be able to sign up', () => {
    page.navigateTo('/sign_up');
    page.fillInSignUp({
      email: 'foo@bar.me',
      username: 'foo',
      password: 'foobar',
      confirmPassword: 'foobar',
      nickname: 'foo'
    });
    page.submitSignUp();

    const h3 = element(by.css('app-sign-up div > h3'));
    expect(h3.getText()).toBe('Email Verification Required');
  });
});
