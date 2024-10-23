export class Session {
  startDate: number;
  endDate: number;
  kwh: number;
  cost?: number;
  id?: number;
  constructor(
    startDate: number,
    endDate: number,
    kwh: number,
    cost?: number,
    id?: number,
  ) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.kwh = kwh;
    this.cost = cost;
    this.id = id;
  }
}
