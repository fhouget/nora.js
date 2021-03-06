var console = require('better-console');
var moment = require('moment');
var shelljs = require('shelljs');
var path = require('path');

var loader = require("./loader");
var requestMaker = require("./request-generator");
var requestSender = require("./request-sender");
var restSender = require("./rest-sender");
var payloadChecker = require("./payload-checker");
var jsonChecker = require("./json-checker");
var checker = require("./value-checker");
var waitNext = require("./wait-next");


var runnerFunc = function run(runningTestStep, executionReport, debug) {
	var status;
    var nbAttempt = 1;
    var retry = true;
    var startChrono = new moment();
    while (status != "Passed" && retry) {
        switch (runningTestStep.teststep.stepAction) {
            case "loadProperties" :
                status = loader(runningTestStep);
                if (debug) console.dir(runningTestStep.properties);
                break;
            case "makeRequest" :
                status = requestMaker(runningTestStep);
                break;
            case "sendRequest" :
                status = requestSender(runningTestStep);
                break;
            case "sendRest" :
                status = restSender(runningTestStep);
                break;
            case "checkXML" :
                status = payloadChecker(runningTestStep, "xml");
                break;
            case "checkTXT" :
                status = payloadChecker(runningTestStep, "txt");
                break;
            case "checkJSON" :
                status = jsonChecker(runningTestStep);
                break;
            case "waitNext" :
                status = waitNext(runningTestStep);
                break;
            case "call" :
                var testcaseCall = require('./nora-runner');
                try {
                    var testcase = testcaseCall(
                        runningTestStep.dir + path.sep + runningTestStep.teststep.stepOptions.testcase,
                        runningTestStep.runDir,
                        runningTestStep.debug,
                        executionReport,
                        runningTestStep.properties
                    )
                    status = testcase.hasFailure ? "Failed" : "Passed";
                } catch (error) {
                    console.error("Error with called testcase");
                    console.dir(error);
                    status = "Failed";
                }
                break;
            case "check" :
                status = checker(runningTestStep);
                break;
            default:
                console.error("* Unrecognize stepAction %j", runningTestStep.teststep.stepAction);
                console.dir(runningTestStep);
                status = "Failed";
        }
        runningTestStep.status = status;
        if (status != "Passed" && runningTestStep.teststep.stepReplayOnFailure) {
            nbAttempt++;
            if (nbAttempt <= runningTestStep.teststep.stepReplayOnFailure) {
                console.warn(" * Last step is failed. Retry");
                if (runningTestStep.teststep.stepWaitBeforeReplay) {
                    shelljs.exec("python " + __dirname + path.sep + "sleep.py " + runningTestStep.teststep.stepWaitBeforeReplay);
                }
                retry = true;
            } else {
                retry = false;
            }
        } else {
            retry = false;
        }
    }
    var endChrono = new moment();

    runningTestStep.result = status;
    runningTestStep.time = (endChrono.valueOf() - startChrono.valueOf())/1000;

};

module.exports = runnerFunc;
