import { expect } from 'chai';
import jsdom from 'jsdom';
import fs from 'fs';

import { timeStampScale } from '../src/getInitialSettings.js';
import { version } from '../package.json';

describe('getInitialSettings', () => {
  describe('timeStampScale', () => {
    it('no event.timestamp', () => {
      const e = {};
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).to.be.closeTo(Date.now(), 50);
    });

    it('zero', () => {
      const e = { timeStamp : 0 };
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).to.be.closeTo(Date.now(), 50);
    });

    it('epoch milliseconds', () => {
      const e = { timeStamp : 1451606400000 };
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).to.equal(1451606400000);
    });

    it('epoch microseconds', () => {
      const e = { timeStamp : 1451606400000000 };
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).to.equal(1451606400000);
    });

    // Currently unsupported in jsdom
    // Chrome specific -- manual testing is clear;
    it('performance navigation time', (done) => {
      const terriblePolyfill = { timing: { navigationStart: Date.now() } };
      const originalPerformance = global.performance;
      global.performance = global.performance === undefined
        ? terriblePolyfill
        : originalPerformance;
      const e = { timeStamp: 1 };
      const ts = timeStampScale(e);
      expect(ts(e.timeStamp)).to.equal(performance.timing.navigationStart + e.timeStamp);
      global.performance = originalPerformance;
      done();
    });
  });

  describe('getInitialSettings', () => {
    it('fetches all settings from a script tag', (done) => {
      const html = fs.readFileSync(__dirname + '/getInitialSettings_fetchAll.html');

      jsdom.env({
        html : html,
        url : 'file://' + __dirname + '/getInitialSettings_fetchAll.html',
        features : {
          FetchExternalResources : ['script'],
          ProcessExternalResources : ['script']
        },
        done : (err, window) => {
          const config = window.userale.options();
          expect(config).to.have.property('autostart', true);
          expect(config).to.have.property('url', 'http://test.com');
          expect(config).to.have.property('transmitInterval', 100);
          expect(config).to.have.property('logCountThreshold', 10);
          expect(config).to.have.property('userId', 'testuser');
          expect(config).to.have.property('version', '1.0.0');
          expect(config).to.have.property('logDetails', false);
          expect(config).to.have.property('resolution', 100);
          expect(config).to.have.property('toolName', 'testtool');
          window.close();
          done();
        }
      });
    });

    it('grabs user id from params', (done) => {
      const html = fs.readFileSync(__dirname + '/getInitialSettings_userParam.html');

      jsdom.env({
        html : html,
        url : 'file://' + __dirname + '/getInitialSettings_userParam.html?user=testuser',
        features : {
          FetchExternalResources : ['script'],
          ProcessExternalResources : ['script']
        },
        done : (err, window) => {
          const config = window.userale.options();
          expect(config.userId).to.equal('testuser');
          window.close();
          done();
        }
      });
    });
  });
});
