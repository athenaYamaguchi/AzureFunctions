"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
function default_1(req, ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = {
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            database: process.env.SQL_DATABASE,
            server: process.env.SQL_SERVER,
            options: { encrypt: true, enableArithAbort: true }
        };
        try {
            const pool = yield sql.connect(config);
            const result = yield pool.request().query("SELECT TOP 10 * FROM KINTAROU.T_WorkData");
            return { status: 200, jsonBody: result.recordset };
        }
        catch (e) {
            ctx.error(e);
            return { status: 500, body: "Server error" };
        }
    });
}
exports.default = default_1;
//# sourceMappingURL=index.js.map