import events from 'events';

/**
 * Initialize a new `Coherent` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
class CoherentReporter extends events.EventEmitter {
  constructor (baseReporter, config, options = {}) {
    super();

    this.baseReporter = baseReporter;

    this.failSymbol = this.baseReporter.color('fail', this.baseReporter.symbols.err);
    this.okSymbol = this.baseReporter.color('checkmark', this.baseReporter.symbols.ok);

    const { epilogue } = this.baseReporter;

    if (config && config.coherentReporterOpts) {
      this.formatMessage = config.coherentReporterOpts.formatMessage || this._format;
    }

    this.outOfBandMessages = {};

    this.on('coherent:message', function() {
      const event = arguments[0];
      const { currentSuite, currentTest } = event;

      const msg = this.formatMessage(event);

      if (!!currentSuite) {
        const suiteId = currentSuite.cid;
        const suiteMessages = this.outOfBandMessages[suiteId];

        if (!!currentTest) {
          suiteMessages.testsStarted = true;
          let testMessages = suiteMessages.testMessages[currentTest.title];
          if (!testMessages) {
            testMessages = [];
            suiteMessages.testMessages[currentTest.title] = testMessages;
          }
          testMessages.push(msg);
        } else {
          if (suiteMessages.testsStarted) {
            // No tests have been started...
            suiteMessages.beforeMessages.push(msg);
          } else {
            // There is no current test, and they had already started, so
            suiteMessages.afterMessages.push(msg);
          }
        }
      }
    });

    this.on('suite:start', function (suite) {
      this.outOfBandMessages[suite.cid] = {
        beforeMessages: [],
        testMessages: {},
        testsStarted: false,
        afterMessages: []
      };
    });

    this.on('suite:end', function (suite) {
      this._reportSuite(suite.cid);
    });
  }

  _format(event) {
    return event.message;
  }

  _color(colorName, s) {
    return this.baseReporter.color(colorName, s);
  }

  _reportSuite(suiteId) {
    const stats = this.baseReporter.stats;

    const runner = stats.runners[suiteId];
    const { capabilities, specs } = runner;

    const browserName = this._color('bright yellow', capabilities.browserName);

    if (specs === undefined) {
      console.log(`No specs for runner on ${browserName}`);
      console.log();
      return;
    }

    for (let spec of this._hashIterate(specs)) {
      const { suites } = spec;
      if (suites === undefined || 0 === suites.length) {
        continue;
      }

      for (let suite of this._hashIterate(suites)) {
        const { cid, tests, title } = suite;
        const suiteTitle = this._color('suite', title);

        if (tests === undefined || tests.length === 0) {
          console.log(`${suiteTitle}, running on ${browserName} has no tests.`);
          continue;
        }

        const suiteMessages = this.outOfBandMessages[cid];
        if (suiteMessages && suiteMessages.beforeMessages) {
          for (let msg in suiteMessages.beforeMessages) {
            console.log(msg);
          }
        }

        console.log(`${suiteTitle}, running on ${browserName}.`);
        for (let test of this._hashIterate(tests)) {
          const testMessages = suiteMessages && suiteMessages.testMessages[test.title] || [];
          for (let msg in testMessages) {
            console.log(msg);
          }

          switch (test.state) {
            case 'fail':
              console.log(this._color('fail', `  ${this.baseReporter.symbols.err} ${test.title} (${stats._duration}ms)`));
              console.log(this._color('error stack', `  ${test.error.stack}`));
              break;
            // case 'success':
            //
            //   break;
            case '':
            case 'pending':
              // There is no state -- this test is probably pending.
              console.log(this._color('pending', `  - ${test.title}`));
              break;
            default:
              console.log(`Unknown state '${test.state}'; test: ${JSON.stringify(test)}`);
              break;
          }
        }

        if (suiteMessages && suiteMessages.afterMessages) {
          for (let msg in suiteMessages.afterMessages) {
            console.log(msg);
          }
        }

        console.log();
      }
    }
  }

  *_hashIterate(hash) {
    for (let key of Object.keys(hash)) {
      yield hash[key];
    }
  }
}

export default CoherentReporter
