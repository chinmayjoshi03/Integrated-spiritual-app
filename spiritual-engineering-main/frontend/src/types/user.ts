import type { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES } from "react";

export type UserRole = 'user' | 'mentor' | 'admin';

export interface User {
  id: DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES;
  name: string;
  email: string;
  role: UserRole;
}