"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const functions_1 = require("@azure/functions");
const HttpTrigger_1 = require("./functions/HttpTrigger");
functions_1.app.http("HttpTrigger", {
    methods: ["GET", "POST"],
    authLevel: "function",
    handler: HttpTrigger_1.default
});
//# sourceMappingURL=index.js.map