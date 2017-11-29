import { AppPage } from './app.po';

describe('frontend App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display logo', () => {
    page.navigateTo('/');
    expect(page.getLogoUrl()).toMatch(/\/assets\/img\/logo.svg$/);
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

    expect(page.getCurrentUrl()).toMatch(/\/sign_in$/);
  });
});
