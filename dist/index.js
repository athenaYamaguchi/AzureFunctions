"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const functions_1 = require("@azure/functions");
const httpTrigger1_1 = require("./functions/httpTrigger1");
functions_1.app.http("httpTrigger1", {
    methods: ["GET", "POST"],
    authLevel: "function",
    handler: httpTrigger1_1.default
});
//# sourceMappingURL=index.js.map