// functions/HttpTrigger2.ts
import { HttpRequest, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

import { COLTYPE } from "../composables/CommonTableType.js";
import { columnData, COL_USER_ID} from "../composables/TableInfo_M_User.js";

export default async function (
  req: HttpRequest, 
  ctx: InvocationContext
) {
  // 1) JSON ボディの受け取り
  let payload: { 
    userName?: string; 
    searchWords?: Record<string, any | null> 
  } = {};

  try {
    if (req.method === 'POST') {
      payload = await req.json(); // ← JSON をパース
    } else {
      // GET の場合はクエリから受けてもOK（互換用）
      payload = {
        userName: req.query['userName'] || undefined,        
        searchWords: req.query["searchWords"] 
          ? JSON.parse(req.query["searchWords"] as string)
          : undefined,
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
    // SQLを準備
    pool = await sql.connect(config);
    const request = pool.request();

    // 検索条件を定義
    const whereClauses: string[] = [];

    if ((payload.searchWords != null) && 
        (typeof payload.searchWords === "object")) {
      // 引数有り

      // カラム分繰り返す
      for (const item of columnData) {
        let serchWord = payload.searchWords[item.columnName];

        if ((serchWord !== undefined) && 
            (serchWord !== null) && 
            (serchWord !== "")) {
          
          if (item.columnType === COLTYPE.FREESTRINGUM) {
            // 自由入力

            // WHERE 句に条件を追加
            whereClauses.push(`${item.columnName} = @${item.columnName}`);
            request.input(item.columnName, sql.NVarChar, String(serchWord));
          }
        }
      }
    }
    
    // if ((payload.searchWords != null) && 
    //     (typeof payload.searchWords === "object")) {
    //   const userId = payload.searchWords[COL_USER_ID.columnName];

    //   if ((userId !== undefined) && 
    //       (userId !== null) && 
    //       (userId !== "")) {
    //     // WHERE 句に条件を追加
    //     whereClauses.push(`${COL_USER_ID.columnName} = @${COL_USER_ID.columnName}`);
    //     request.input(COL_USER_ID.columnName, sql.NVarChar, String(userId));
    //   }
    // }

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
    return {
      status: 500,
      jsonBody: {
        error: "Server error",
        message: e?.message ?? String(e),
        // 開発時はスタックを出してもOK（本番は外す）
        stack: e?.stack
      },
    };
  } finally {
    // 5) 接続後始末（プールを閉じたい場合）
    try {
      if (pool) await pool.close();
    } catch {}
  }
}
