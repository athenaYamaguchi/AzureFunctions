// functions/HttpTrigger2.ts
import { HttpRequest, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

import { COLTYPE } from "../composables/CommonTableType";
import { columnData } from "../composables/TableInfo_M_User";

function splitCommaSeparated(str: string): string[] {
  if (!str) return []; // 空文字なら空配列
  return str
    .split(",")        // カンマで分割
    .map(s => s.trim()) // 前後の空白を除去
    .filter(s => s !== ""); // 空要素を除外
}


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
        const whereClausesOR: string[] = [];
        let serchRowWord = payload.searchWords[item.columnName];
        ctx.log(`Payload: ${item}`);

        if ((serchRowWord !== undefined) && 
            (serchRowWord !== null) && 
            (serchRowWord !== "")) {
          // 有効データ
          ctx.log(`文字：${serchRowWord}`);

          // 複数選択されている場合があるためリストに変換する
          const serchWords = splitCommaSeparated(serchRowWord);

          if ((item.columnType === COLTYPE.FREESTRINGUM) ||
              (item.columnType === COLTYPE.SELECTLIST) ||
              (item.columnType === COLTYPE.NUM)) {
            // 自由入力 or 選択式 or 数値
            
            // 複数検索対象が存在する場合はorで結合する
            for (let wordIndex = 0; wordIndex < serchWords.length; wordIndex += 1) {
              const prmName = item.columnName + "_" + String(wordIndex);
              whereClausesOR.push(`${item.columnName} = @${prmName}`);
              if (item.columnType === COLTYPE.NUM) {
                // 数値 (数値として扱う)
                request.input(prmName, sql.Int, Math.trunc(Number(serchWords[wordIndex])));
              }
              else {
                // 数値以外 (文字として扱う)
                request.input(prmName, sql.NVarChar, String(serchWords[wordIndex])); 
              }
            }

            // WHERE 句に条件を追加
            if (whereClausesOR.length > 0) {
              whereClauses.push(`(${whereClausesOR.join(' OR ')})`);
            }
          }
          else if (item.columnType === COLTYPE.DATE) {
            // 日付入力
            ctx.log(`日付：${serchRowWord}`);
            
            // 開始と終了で必ず日付は登録されているため、条件をbetweenで作成する
            const prmNameSta = item.columnName + "_" + "STA"
            const prmNameEnd = item.columnName + "_" + "END"
            const setBetween = `${item.columnName} BETWEEN @${prmNameSta} AND @${prmNameEnd}`
            // 条件に追加
            whereClauses.push(setBetween);
            request.input(prmNameSta, sql.NVarChar, String(serchWords[0])); 
            request.input(prmNameEnd, sql.NVarChar, String(serchWords[1])); 
          }
          else {
            // ありえない

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
