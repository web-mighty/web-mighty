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
});
