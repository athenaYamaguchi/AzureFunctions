// src/index.ts
import { app } from "@azure/functions";
import HttpTrigger from "./functions/HttpTrigger";
import getM_Users from "./functions/getM_Users";

app.http("HttpTrigger", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: HttpTrigger
});

app.http("getM_Users", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: getM_Users
});

