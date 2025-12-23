// src/index.ts
import { app } from "@azure/functions";
import HttpTrigger from "./functions/HttpTrigger";
import HttpTrigger2 from "./functions/HttpTrigger2";

app.http("HttpTrigger", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: HttpTrigger
});

app.http("HttpTrigger2", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: HttpTrigger2
});

