# wdio-coherent-reporter
A WebdriverIO plugin.  Outputs success and failure information for suites and tests, which may be running in parallel, on a per-suite basis, at the completion of the suite.

`wdio-coherent-reporter` is compatible with WDIO v4.

`wdio-coherent-reporter` builds on top of functionality presented in the standard `wdio-spec-reporter` plugin, by also allowing a test writer to write messages which will be written to the console inline with suite and test progress messages.  The test writer can send an object with a property `event` set to `coherent:message`, with a property `message`, and this will be reported after the test name, and before the completion message.

```
describe('Magic number computer')
  it('can add two numbers', function() {
    const a = 3;
    const b = 4;
    process.send({ event: 'coherent:message', message: 'About to add two numbers...', currentSuite, currentTest });
    expect(computer.add(a, b)).toBe(7);
  });
```

```
Magic number computer, running on chrome
  About to add two numbers...
  ✓ can add two numbers (10ms)
```

The `currentSuite` and `currentTest` objects must be provided in order for `wdio-coherent-reporter` to know which suite and test to write the message to.  These objects are broadcast by the `wdio-jasmine-framework` via the `suite:start`, `test:start` events; the `suite:end` and `test:end` events can be used to know when these are completed.  The test writer may listen for these events:

```
process.on('suite:start', function(suite) {
  currentSuite = suite[0];
});

process.on('test:start', function(test) {
  currentTest = test[0];
});

process.on('test:end', function(test) {
  currentTest = null;
});

process.on('suite:end', function(runner) {
  currentSuite = null;
});
```

The `wdio-coherent-reporter` can be configured with a custom formatter method, to augment the output.  The method must be supplied in a `coherentReporterOpts` object in `wdio.conf.js`:

```
exports.config = {
  // ...

  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'jasmine',

  //
  // Test reporter for stdout.
  // The following are supported: dot (default), spec, and xunit
  // see also: http://webdriver.io/guide/testrunner/reporters.html
  reporters: ['coherent'],

  //
  // Options to be pass to wdio-coherent-reporter.
  coherentReporterOpts: {
    formatMessage: function(event) {
      return `${event.datestamp} ${event.level}: ${event.message}`;
    }
  },

  // ...
};
```

When the `formatMessage` method is provided, the call to `process.send` may include other properties, which can be used in the method body to create a custom log string:

```
describe('Magic number computer')
  it('can add two numbers', function() {
    const a = 3;
    const b = 4;
    process.send({ event: 'coherent:message', message: 'About to add two numbers...', currentSuite, currentTest, datastamp: (new Date()).toISOString(), level: 'info' });
    expect(computer.add(a, b)).toBe(7);
  });
```

```
Magic number computer, running on chrome
  2016-07-05T19:03:51.321Z info: About to add two numbers...
  ✓ can add two numbers (10ms)
```

This rapidly becomes unweildy for common use across tests, so a logging class might be introduced for some of the heavy lifting:

```
import { red, yellow, cyan, bold } from 'chalk';

let currentSuite = null,
  currentTest = null;

process.on('suite:start', (suite) => {
  currentSuite = suite[0];
});

process.on('test:start', (test) => {
  currentTest = test[0];
});

process.on('test:end', (test) => {
  currentTest = null;
});

process.on('suite:end', (runner) => {
  currentSuite = null;
});

export function info(message) {
  logAtLevel('info', message);
}

export function failure(message) {
  logAtLevel('error', message);
}

function logAtLevel(level, args) {
  const m = {
    event: 'coherent:message',
    datestamp: new Date().toTimeString(),
    currentSuite,
    currentTest,
    level,
    message
  };
  process.send(m);
}
```

```
import { info } from 'logger.js';

describe('Magic number computer')
  it('can add two numbers', function() {
    const a = 3;
    const b = 4;
    info('About to add two numbers...');
    expect(computer.add(a, b)).toBe(7);
  });
```
