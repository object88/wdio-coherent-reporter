# wdio-coherent-reporter
A WebdriverIO plugin.  Outputs success and failure information for suites and tests, which may be running in parallel, on a per-suite basis, at the completion of the suite.

`wdio-coherent-reporter` is compatible with WDIO v4.

`wdio-coherent-reporter` builds on top of functionality presented in the standard `wdio-spec-reporter` plugin, by also allowing a test writer to write messages which will be written to the console inline with suite and test progress messages.  The test writer can send an object with a property `event` set to `coherent:message`, with a property `message`, and this will be reported after the test name, and before the completion message.

```
describe('Magic number computer')
  it('can add two numbers', function() {
    const a = 3;
    const b = 4;
    process.send({ event: 'coherent:message', message: 'About to add two numbers...' });
    expect(computer.add(a, b)).toBe(7);
  });
```

```
Magic number computer, running on chrome
  About to add two numbers...
  ✓ can add two numbers (10ms)
```
