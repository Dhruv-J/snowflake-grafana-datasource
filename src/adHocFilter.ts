import { getTable } from "ast";

export default class AdHocFilter {
  private _targetTable = '';

  setTargetTable(table: string) {
    this._targetTable = table;
  }

  setTargetTableFromQuery(query: string) {
    this._targetTable = getTable(query);
    if (this._targetTable === '') {
      console.error('Failed to get table from adhoc query.');
      throw new Error('Failed to get table from adhoc query.');
    }
  }

  apply(sql: string, adHocFilters: AdHocVariableFilter[]): string {
    if (this._targetTable === '' || sql === '' || !adHocFilters || adHocFilters.length === 0) {
      return sql;
    }
    const filter = adHocFilters[0];
    if (filter.key.includes('.')) {
      this._targetTable = filter.key.split('.')[0];
    }
    if (this._targetTable === '' || !sql.match(new RegExp(`.*\\b${this._targetTable}\\b.*`, 'gi'))) {
      return sql;
    }
    let filters = adHocFilters.map((f, i) => {
      const key = f.key.includes('.') ? f.key.split('.')[1] : f.key;
      const value = isNaN(Number(f.value)) ? `\\'${f.value}\\'` : Number(f.value);
      const condition = i !== adHocFilters.length - 1 ? (f.condition ? f.condition : 'AND') : '';
      return ` ${key} ${f.operator} ${value} ${condition}`;
    }).join('');
    sql = sql.replace(';', '');
    return `${sql} settings additional_table_filters={'${this._targetTable}' : '${filters}'}`;
  }
}

export type AdHocVariableFilter = {
  key: string;
  operator: string;
  value: string;
  condition: string;
};
