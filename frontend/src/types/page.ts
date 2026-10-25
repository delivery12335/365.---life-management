import type { AppData, Editor, Page } from './index';

export interface PageProps {
  data: AppData;
  today: string;
  edit: (editor: Editor) => void;
  update: (fn: (data: AppData) => AppData) => void;
  toggleTask: (id: string) => void;
  toggleHabit: (id: string, day: string) => void;
  remove: (kind: 'tasks' | 'habits' | 'goals', id: string) => void;
  navigate: (page: Page) => void;
}
