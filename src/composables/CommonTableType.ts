/**
 * 項目種別
 */
export const COLTYPE = {
  NUM:            0,  // 数値
  FREESTRINGUM:   1,  // 自由入力文字列
  SELECTLIST:     2,  // 選択式
  DATE:           3,  // 日付
}

/**
 * 項目情報
 */
export type ColumnInfo = {
  columnTitle:    string;           // 項目名(表示用)
  columnName:     string;           // 項目名
  columnType:     number;           // 項目種別
  viewFlg:        boolean;          // 項目表示フラグ
  isBulkEditable: boolean;          // 一括編集可能フラグ
  selectOptions?: any[];            // 選択肢 (項目種別によっては不要)
};

/**
 * 検索テンプレート情報
 */
export type SearchTemplateInfo = {
  templateLabel:  string;           // テンプレートラベル
  searchWords:    any[];            // 検索情報
};

/**
 * テーブルの検索結果 1 行分
 * - JSONの各行を「列名→値」の形で保持
 */
export type Item = Record<string, unknown>;

/**
 * 共通テーブル情報
 */
export type CommonTableInfo = {
  key:              string;                 // 内部キー
  tabLabel:         string;                 // タブ表示文字列
  columns:          ColumnInfo[];           // 項目情報
  searchTemplates:  SearchTemplateInfo[];   // 検索テンプレート情報
  fnSearch?: (searchWords: Record<string, any | null>) 
    => Promise<Item[]>;                     // 検索メソッド
  fnUpdate?: (baseDatas: any[], newDatas: any[]) 
    => Promise<any>;                        // 編集メソッド
  fnInsert?: (newDatas: any[]) 
    => Promise<any>;                        // 新規登録メソッド
  fnDelete?: (targetDatas: any[]) 
    => Promise<any>;                        // 削除メソッド
};
