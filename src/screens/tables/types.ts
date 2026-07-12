// Types mirror the RestoQuick API contract (see RESTOQUICK_DOC.md → Tables).
export interface TableSession {
  id: string;
  openedAt: string;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  sessions?: TableSession[];
}

export interface TableInput {
  number: string;
  capacity: number;
}

export interface TableUpdateInput {
  capacity: number;
}
