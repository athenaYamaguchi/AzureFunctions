// src/index.ts
import { app } from "@azure/functions";
import httpTrigger1 from "./functions/httpTrigger1";

app.http("HttpTrigger1", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: httpTrigger1
});
