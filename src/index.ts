// src/index.ts
import { app } from "@azure/functions";
import HttpTrigger from "./functions/HttpTrigger";

app.http("HttpTrigger", {
  methods: ["GET", "POST"],
  authLevel: "function",
  handler: HttpTrigger
});
