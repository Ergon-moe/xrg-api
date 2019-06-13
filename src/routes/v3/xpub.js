/*
  xpub route
*/

"use strict"

const express = require("express")
const requestUtils = require("./services/requestUtils")
const axios = require("axios")
const logger = require("./logging.js")
const routeUtils = require("./route-utils")
const wlogger = require("../../util/winston-logging")

//const router = express.Router()
const router = express.Router()

// Used for processing error messages before sending them to the user.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BITBOXJS = require("@chris.troutner/bitbox-js")
const BITBOX = new BITBOXJS()

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/fromXPub/:xpub", fromXPubSingle)

// Root API endpoint. Simply acknowledges that it exists.
function root(req, res, next) {
  return res.json({ status: "address" })
}

async function fromXPubSingle(req, res, next) {
  try {
    const xpub = req.params.xpub
    const hdPath = req.query.hdPath ? req.query.hdPath : "0"

    if (!xpub || xpub === "") {
      res.status(400)
      return res.json({ error: "xpub can not be empty" })
    }

    // Reject if xpub is an array.
    if (Array.isArray(xpub)) {
      res.status(400)
      return res.json({
        error: "xpub can not be an array. Use POST for bulk upload."
      })
    }

    logger.debug(`Executing address/fromXPub with this xpub: `, xpub)
    wlogger.debug(`Executing address/fromXPub with this xpub: `, xpub)

    const cashAddr = BITBOX.Address.fromXPub(xpub, hdPath)
    const legacyAddr = BITBOX.Address.toLegacyAddress(cashAddr)
    res.status(200)
    return res.json({
      cashAddress: cashAddr,
      legacyAddress: legacyAddr
    })
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in rawtransactions/decodeRawTransaction: `, err)
    wlogger.error(`Error in address.ts/fromXPubSingle().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    fromXPubSingle
  }
}
