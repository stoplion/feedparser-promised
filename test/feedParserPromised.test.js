import faker from 'faker';
import nock from 'nock';
import fs from 'fs';
import _ from 'lodash';

import FeedParserPromised from '../src/feedParserPromised';

describe('FeedparserPromised', () => {
  describe('.parse', () => {
    const aHost = faker.internet.url();
    const aPath = '/rss';
    const someUrl = `${aHost}${aPath}`;
    const rssFile = fs.readFileSync(
      `${__dirname}/feeds/rss2sample.xml`,
      'utf-8'
    )
    const expectedItems = [
      { title: 'Star City' },
      { title: 'The Engine That Does More' },
      { title: 'Astronauts Dirty Laundry' }
    ];

    describe('on success', () => {
      it('parses rss items', (done) => {
        nock(aHost).get(aPath).reply(200, rssFile);

        const promise = FeedParserPromised.parse(someUrl);

        promise.then( (items) => {
          assert.equal(expectedItems.length, items.length);

          _.zip(expectedItems, items).forEach( (zippedItems) => {
            assert.equal(zippedItems[0].title, zippedItems[1].title);
          });

          done();
        }).catch( (err) => {
          done(err);
        });
      });
    });

    describe('on feedparse error', () => {
      it('handles error on socket timeout error', (done) => {
        nock(aHost).get(aPath).socketDelay(2).reply(408, 'ESOCKETTIMEDOUT');

        const promise = FeedParserPromised.parse(
          { uri: someUrl, timeout: 1 }
        );

        promise.catch( (error) => {
          assert.deepEqual({ code: 'ESOCKETTIMEDOUT', connect: false }, error);

          done();
        }).catch( (err) => {
          done(err);
        });
      });

      it('handles error on timeout error', (done) => {
        nock(aHost).get(aPath).delayConnection(2).reply(408, 'ETIMEDOUT');

        const promise = FeedParserPromised.parse(
          { uri: someUrl, timeout: 1 }
        );

        promise.catch( (error) => {
          assert.deepEqual({ code: 'ETIMEDOUT', connect: false }, error);

          done();
        }).catch( (err) => {
          done(err);
        });
      });

      it('parses rss items', (done) => {
        const invalidUrl = 'invalid url';
        const promise = FeedParserPromised.parse(invalidUrl);

        const errorInvalidURI = new Error('Invalid URI "invalid%20url"');
        promise.catch( (error) => {
          assert.deepEqual(errorInvalidURI, error);

          done();
        }).catch( (err) => {
          done(err);
        });
      });
    });
  });
});
