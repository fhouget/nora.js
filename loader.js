var fs = require('fs-extra');
var path = require('path');
var console = require('better-console');

/**
  Traitement chargement de propriété
  */
var loader = function doStepLoadProperties(runningTestStep) {
  console.log("* " + runningTestStep.teststep.stepID  + " - " + runningTestStep.teststep.stepName);
  runningTestStep.teststep.stepOptions.forEach(function(stepOption){
    if (stepOption.filename === null
      && stepOption.generator === null) {
      console.error("Error parsing " + runningTestStep.teststep.stepID + " options.\n filename or generator, is mandatory.\nPlease correct your json testcase before relaunch nora.js.");
      console.dir(runningTestStep.teststep);
      throw new Error("Malformated loadProperty test step");
    }

    if (stepOption.filename != null) {
      var filename = runningTestStep.dir + path.sep + stepOption.filename;
      console.log("  * Loading properties " + filename);

      try {
        if (!fs.existsSync(filename)) {
          console.error("  * %j is not a file", filename);
          throw new Error('this is not a file');
        }
        JSON.parse(fs.readFileSync(filename, 'utf8'))
          .forEach(function(value) {
            runningTestStep.properties.push(value);
        });
      } catch (err) {
        console.error("  * Error while parsing %j", filename);
        throw err;
      }
    } else if (stepOption.generator != null) {
      var filename = runningTestStep.dir + path.sep + stepOption.generator;
      console.log("  * Loading properties generator " + filename);
      if (!fs.existsSync(filename)) {
        console.error("  * Cannot find generator %j", filename);
        throw new Error('Cannot find generator');
      }
      var generator = require(filename, 'utf8');
      generator().forEach(function(value) {
            runningTestStep.properties.push(value);
        });

    }
  });
  return "Passed";
}

module.exports = loader;