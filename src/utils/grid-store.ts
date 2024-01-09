type RowId = string;
type ColId = string;

type CellLocation = {
  rowId: RowId;
  colId: ColId;
};

type Cell<T = unknown> = CellLocation & {
  value: T;
};

type SparseGrid<T = unknown> = Record<RowId, Record<ColId, T>>;

export class GridStore<TValue = any> {
  #grid: SparseGrid<TValue> = {};

  getCell(cell: CellLocation): TValue | undefined;
  getCell(rowId: RowId, colId: ColId): TValue | undefined;
  getCell(
    cellOrRowId: RowId | CellLocation,
    colId?: ColId,
  ): TValue | undefined {
    if (typeof cellOrRowId === "string") {
      if (!colId) {
        throw Error("Missing colId");
      }
      return this.#grid[cellOrRowId]?.[colId];
    }

    return this.#grid[cellOrRowId.rowId]?.[cellOrRowId.colId];
  }

  getCells(opts: { rowId: RowId } | { colId: ColId }): Cell<TValue>[] {
    if ("rowId" in opts && opts.rowId) {
      return Object.entries(this.#grid[opts.rowId] || {}).map(
        ([colId, value]) => ({ rowId: opts.rowId!, colId, value }),
      );
    }

    if ("colId" in opts && opts.colId) {
      return Object.entries(this.#grid)
        .filter(([_, row]) => row[opts.colId!])
        .map(([rowId, row]) => ({
          rowId,
          colId: opts.colId!,
          value: row[opts.colId!]!,
        }));
    }

    return [];
  }

  setCell(cell: Cell<TValue>): void;
  setCell(rowId: RowId, colId: ColId, value: TValue): void;
  setCell(
    cellOrRowId: RowId | Cell<TValue>,
    maybeColId?: ColId,
    maybeValue?: TValue,
  ): void {
    if (typeof cellOrRowId === "string") {
      if (!maybeColId || !maybeValue) {
        throw Error("Missing colId or value");
      }

      return this.setCell({
        rowId: cellOrRowId,
        colId: maybeColId,
        value: maybeValue,
      });
    }

    const { rowId, colId, value } = cellOrRowId;

    if (!this.#grid[rowId]) {
      this.#grid[rowId] = {};
    }

    this.#grid[rowId]![colId] = value;
  }

  setCells(cells: Cell<TValue>[]): void {
    cells.forEach(cell => this.setCell(cell));
  }

  get value(): SparseGrid<TValue> {
    return structuredClone(this.#grid);
  }

  clear(): void {
    this.#grid = {};
  }
}
