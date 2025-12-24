
// import { HttpRequest, InvocationContext } from "@azure/functions";
// import * as sql from "mssql";

// export default async function (req: HttpRequest, ctx: InvocationContext) {
//   const config: sql.config = {
//     user: process.env.SQL_USER,
//     password: process.env.SQL_PASSWORD,
//     database: process.env.SQL_DATABASE,
//     server: process.env.SQL_SERVER,
//     options: { encrypt: true, enableArithAbort: true }
//   };

//   try {
//     const pool = await sql.connect(config);
//     const result = await pool.request().query("SELECT * FROM ATHENA_WEB.M_Users");
//     return { status: 200, jsonBody: result.recordset };
//   } catch (e) {
//     ctx.error(e);
//     return { status: 500, body: "Server errorr" };
//   }
// }

// functions/HttpTrigger2.ts
import { HttpRequest, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

export default async function (req: HttpRequest, ctx: InvocationContext) {
  // 1) JSON ボディの受け取り
  let payload: { name?: string; isActive?: boolean } = {};
  try {
    if (req.method === 'POST') {
      payload = await req.json(); // ← JSON をパース
    } else {
      // GET の場合はクエリから受けてもOK（互換用）
      payload = {
        name: req.query.get('name') || undefined,
        isActive: req.query.get('isActive') ? req.query.get('isActive') === 'true' : undefined,
      };
    }
  } catch (parseErr) {
    // JSON でない場合など
    ctx.error(`Invalid JSON: ${String(parseErr)}`);
    return { status: 400, body: "Invalid JSON body." };
  }

  // 2) DB 接続情報
  const config: sql.config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER,
    options: { encrypt: true, enableArithAbort: true }
  };

  let pool: sql.ConnectionPool | null = null;

  try {
    pool = await sql.connect(config);

    // 3) パラメータ化クエリを構築（必要な条件だけ追加）
    const request = pool.request();

    const whereClauses: string[] = [];
    if (payload.name) {
      // 部分一致検索（例）
      request.input('name', sql.NVarChar, `%${payload.name}%`);
      whereClauses.push('LAST_NAME LIKE @name'); // 例: 列名は実テーブルのカラムに合わせて
    }
    if (typeof payload.isActive === 'boolean') {
      request.input('isActive', sql.Bit, payload.isActive);
      whereClauses.push('IsActive = @isActive'); // 例: 列名は実テーブルに合わせて
    }

    const baseSql = 'SELECT * FROM ATHENA_WEB.M_Users';
    const sqlText =
      whereClauses.length > 0
        ? `${baseSql} WHERE ${whereClauses.join(' AND ')}`
        : baseSql;

    const result = await request.query(sqlText);

    // 4) レスポンス
    return {
      status: 200,
      jsonBody: {
        count: result.recordset.length,
        items: result.recordset,
        filters: payload,
      }
    };
  } catch (e) {
    ctx.error(e);
    return { status: 500, body: "Server error" };
  } finally {
    // 5) 接続後始末（プールを閉じたい場合）
    try {
      if (pool) await pool.close();
    } catch {}
  }
}
