#!/usr/bin/python

from requests import Request, Session
from requests.auth import HTTPBasicAuth
import sys
import json
import requests

def zeroArgs(_args):
    print("You need at least one arguments !")

def jsonRequest(_args):
    jsonArg = json.loads(_args[1].replace("'","\""))
    verifyArgs(jsonArg)
    resp = sendHttpRequest(jsonArg)
    return resp

def fileInputRequest(_args):
    jsonArg = json.loads(_args[1].replace("'","\""))
    verifyArgs(jsonArg)
    filePath = _args[2]
    jsonArg["data"] = open(filePath, 'r').read()
    resp = sendHttpRequest(jsonArg)
    return resp

def fileOutputRequest(_args):
    jsonArg = json.loads(_args[1].replace("'","\""))
    verifyArgs(jsonArg)
    inputFilePath = _args[2]
    jsonArg["data"] = open(inputFilePath, 'r').read()
    resp = sendHttpRequest(jsonArg)

    outputFilePath = _args[3]
    with open(outputFilePath, "w") as response:
        response.write(resp.text)

    return resp


def verifyArgs(_args):
    valid = True
    if _args is not None:
        url = _args.get("url")
        host = _args.get("host")
        port = _args.get("port")
        path = _args.get("path")
        protocol = _args.get("protocol")
        method = _args.get("method")
        required = [host,port,path,protocol,method]
        required_url = [url,method]		
        valid = (None in required)  or  (None in required_url)
    else :
        valid = False
    if not valid:
        raise Exception("Json arg is not valid : (host, port, path, protocol) or url and method are required !")

def makeURL(_args):
    if (_args.get("url") is None):
        return _args.get("protocol") + "://" + _args.get("host") + ":" + _args.get("port") + _args.get("path")
    else:
        return _args.get("url")

def sendHttpRequest(_args):
    s = Session()
    url = makeURL(_args)
    req = Request(_args.get("method"), url)
    if (_args.get("headers") is not None) : req.headers = _args.get("headers")
    if (_args.get("auth") is not None) : req.auth = HTTPBasicAuth(_args.get("auth")[0], _args.get("auth")[1])
    if (_args.get("params") is not None) : req.params = _args.get("params")
    if (_args.get("cookies") is not None) : req.cookies = _args.get("cookies")
    if (_args.get("data") is not None) : req.data = _args.get("data")

    prepped = req.prepare()
    if (_args.get("body") is not None) : prepped.body = _args.get("body")

    # do something with prepped.body
    # do something with prepped.headers

    resp = s.send(prepped,timeout=_args.get("timeout"), proxies=_args.get("proxies"))
    return resp

options = {
    1 : zeroArgs,
    2 : jsonRequest,
    3 : fileInputRequest,
    4 : fileOutputRequest,
    }

nbArgs = len(sys.argv)
if nbArgs > 4 :
    print("Too many arguments !")
    print("usages : python httpRequests.py json [inputFilePath, outputFilePath]")
else :
    try:
        res = options[nbArgs](sys.argv)
        output = { 'code' : res.status_code, 'text' : res.text}
    except:
        output = { 'code' : "unknown", 'text' : "Unexpected error : " + str(sys.exc_info()[0])}
    sys.stdout.write(json.dumps(output))
    sys.stdout.flush()
    sys.exit(0)

