import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as sql from "mssql";

// HTTP トリガー関数の本体
async function httpTrigger(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Application Settings から接続情報を取得
    const config: sql.config = {
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DATABASE,
        server: process.env.SQL_SERVER,
        options: {
            encrypt: true,       // Azure SQL 必須
            enableArithAbort: true
        }
    };

    try {
        context.log("Connecting to SQL...");

        // SQL Server 接続
        const pool = await sql.connect(config);

        // SELECT 実行（例: YourTable の先頭10件取得）
        const result = await pool.request().query("SELECT TOP 10 * FROM YourTable");

        return {
            status: 200,
            body: result.recordset
        };
    } catch (err: any) {
        context.log("SQL Error:", err);
        return {
            status: 500,
            body: err.message
        };
    } finally {
        await sql.close();
    }
}

// 関数を登録
app.http('httpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger
});
