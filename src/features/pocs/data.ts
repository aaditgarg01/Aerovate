export interface Poc {
  id: string;
  name: string;
  role: string;
  year: number;
  photo?: string;
  profileUrl?: string;
}
// Member 6 adds approved historical POC records. No invented names or years.
export const pocs: Poc[] = [];
