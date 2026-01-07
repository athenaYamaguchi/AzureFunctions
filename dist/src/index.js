"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const HttpTrigger_1 = require("./functions/HttpTrigger");
const getM_Users_1 = require("./functions/getM_Users");
functions_1.app.http("HttpTrigger", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: HttpTrigger_1.default
});
functions_1.app.http("getM_Users", {
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: getM_Users_1.default
});
//# sourceMappingURL=index.js.map