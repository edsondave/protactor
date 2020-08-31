'use strict'; // necessary for es6 output in node

import { browser, element, by, ElementFinder, ElementArrayFinder } from 'protractor';
import { promise } from 'selenium-webdriver';

const expectedH1 = 'Tour of Heroes';
const expectedTitle = `${expectedH1}`;
const targetHero = { id: 15, name: 'Magneta' };
const targetHeroDashboardIndex = 3;
const nameSuffix = 'X';
const newHeroName = targetHero.name + nameSuffix;

class Hero {
  id: number;
  name: string;

  // Factory methods

  // Hero from string formatted as '<id> <name>'.
  static fromString(s: string): Hero {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  // Hero from hero list <li> element.
  static async fromLi(li: ElementFinder): Promise<Hero> {
      let stringsFromA = await li.all(by.css('a')).getText();
      let strings = stringsFromA[0].split(' ');
      return { id: +strings[0], name: strings[1] };
  }

  // Hero id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Hero> {
    // Get hero id from the first <div>
    let _id = await detail.all(by.css('div')).first().getText();
    // Get name from the h2
    let _name = await detail.element(by.css('h2')).getText();
    return {
        id: +_id.substr(_id.indexOf(' ') + 1),
        name: _name.substr(0, _name.lastIndexOf(' '))
    };
  }
}

describe('Proyecto base', () => {

  beforeAll(() => browser.get(''));

  function getPageElts() {
    let navElts = element.all(by.css('app-root nav a'));

    return {
      navElts: navElts,

      appDashboardHref: navElts.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      topHeroes: element.all(by.css('app-root app-dashboard > div h4')),

      appHeroesHref: navElts.get(1),
      appHeroes: element(by.css('app-root app-heroes')),
      allHeroes: element.all(by.css('app-root app-heroes li')),
      selectedHeroSubview: element(by.css('app-root app-heroes > div:last-child')),

      heroDetail: element(by.css('app-root app-hero-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li'))
    };
  }

  describe('Initial page', () => {

    it(`has title '${expectedTitle}'`, () => {
      expect(browser.getTitle()).toEqual(expectedTitle);
    });

    it(`has h1 '${expectedH1}'`, () => {
        expectHeading(1, expectedH1);
    });

    const expectedViewNames = ['Dashboard', 'Heroes'];
    it(`has views ${expectedViewNames}`, () => {
      let viewNames = getPageElts().navElts.map((el: ElementFinder) => el.getText());
      expect(viewNames).toEqual(expectedViewNames);
    });

    it('has dashboard as the active view', () => {
      let page = getPageElts();
      expect(page.appDashboard.isPresent()).toBeTruthy();
    });

    it(`has a hero called ${targetHero.name}`, () => {
      element(by.css('a[href="/heroes"]')).click();
      let _allHeroes = getPageElts().allHeroes.map((el: ElementFinder) => Hero.fromLi(el));
      expect(_allHeroes).toContain(targetHero);
    });

    it(`Heroe ${targetHero.name} encontrado`, () => {
      element(by.css('a[href="/dashboard"]')).click();
      let _searchBox = getPageElts().searchBox;
      _searchBox.sendKeys(targetHero.name);
      let _searchResults = getPageElts().searchResults;
      _searchResults.get(0).click();
      expectHeading(2, targetHero.name.toUpperCase() + ' Details');
    });

    it(`Editar`, () => {
      element(by.css('a[href="/dashboard"]')).click();
      element.all(by.css('app-root app-dashboard > div a')).get(0).click();

      addToHeroName('Test');
      element(by.id('btnSave')).click();
      element(by.css('a[href="/heroes"]')).click();

      let testHero = { id: 12, name: 'Test' };
      let _allHeroes = getPageElts().allHeroes.map((el: ElementFinder) => Hero.fromLi(el));
      expect(_allHeroes).toContain(testHero);
    });

    it(`Navegar desde dashboard`, () => {
      element(by.css('a[href="/dashboard"]')).click();

      element.all(by.css('a[href^="/detail/"]')).filter(function(elem, index) {
        return elem.getText().then(function(text) {
          return text === 'Test';
        });
      }).first().click();

      expect(element(by.css('h2')).getText()).toContain('TEST Details');
    });
  });

  it(`Navegar desde una lista`, () => {
    element(by.css('a[href="/heroes"]')).click();

    element.all(by.css('li>a')).filter(function(elem, index) {
      return elem.getText().then(function(text) {
        return text === '12 Test';
      });
    }).first().click();

    expect(element(by.css('h2')).getText()).toContain('TEST Details');
  });

  it(`Eliminar`, () => {
    element(by.css('a[href="/heroes"]')).click();

    element(by.css('li>a[ng-reflect-router-link="/detail/12"]+button')).click();

    let _allHeroes = getPageElts().allHeroes.map((el: ElementFinder) => Hero.fromLi(el));
    expect(_allHeroes).not.toContain({ id: 12, name: 'Test' });
  });

});

function addToHeroName(text: string): promise.Promise<void> {
  let input = element(by.css('app-hero-detail input'));
  input.clear();
  return input.sendKeys(text);
}

function expectHeading(hLevel: number, expectedText: string): void {
    let hTag = `h${hLevel}`;
    let hText = element(by.css(hTag)).getText();
    expect(hText).toEqual(expectedText, hTag);
};

function getHeroLiEltById(id: number): ElementFinder {
    let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
    return spanForId.element(by.xpath('../..'));
}

function getHeroAEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

async function toHeroArray(allHeroes: ElementArrayFinder): Promise<Hero[]> {
  let promisedHeroes = await allHeroes.map(Hero.fromLi);
  // The cast is necessary to get around issuing with the signature of Promise.all()
  return <Promise<any>> Promise.all(promisedHeroes);
}
