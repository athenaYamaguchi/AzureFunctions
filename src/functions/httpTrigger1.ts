
import { HttpRequest, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

export default async function (req: HttpRequest, ctx: InvocationContext) {
  const config: sql.config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER,
    options: { encrypt: true, enableArithAbort: true }
  };

  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TOP 1 * FROM KINTAROU.T_WorkData");
    return { status: 200, jsonBody: result.recordset };
  } catch (e) {
    ctx.error(e);
    return { status: 500, body: "Server errorr" };
  }
}
