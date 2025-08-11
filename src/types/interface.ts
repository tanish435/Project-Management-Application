import { LiveList, LiveObject, Lson } from "@liveblocks/node";

export interface User {
    _id: string,
    fullName: string,
    username: string;
    email: string;
    avatar: string;
    initials: string
}

export interface Card {
    _id: string;
    name: string;
    description: string;
    slug: string;
    list: string
    position: number;
    dueDate: string;
    members: User[]
    comments: number;
    checklists: number;
    attachments: number;
}

export interface List {
    _id: string;
    name: string;
    position: number;
    board: string;
    createdAt: string;
    updatedAt: string;
    createdBy: User[];
    cards: Card[];
}

export interface Attachment {
  _id: string;
  name: string;
  url: string;
  card: string
  isWebsiteLink: number;
  createdAt: string;
  updatedAt: string;
  attachedBy: User[]
}

export interface Todo {
    _id: string;
    content: string;
    complete: boolean;
    pos: number;
    checklist: string;
    assignedTo: User[];
    createdBy: User;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    _id: string
    content: string
    owner: User
    card: string
    createdAt: string
    updatedAt: string
}

export interface Checklist {
    _id: string;
    name: string;
    createdBy: User
    card: string
    todos: Todo[]
    createdAt: string;
    updatedAt: string
}

export interface Board {
    _id: string
    name: string
    bgColor: string
    url: string
    admin: User[]
    members: User[]
    lists: List[]
    createdAt: string;
    updatedAt: string;
}

export interface UserLson {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    avatar: string;
    initials: string;
    [key: string]: Lson;
}

export interface CardLson {
    _id: string;
    name: string;
    description: string;
    slug: string;
    list: string;
    position: number;
    dueDate: string;
    members: LiveList<LiveObject<UserLson>>;
    comments: number;
    checklists: number;
    attachments: number;
    [key: string]: Lson;
}

export interface ListLson {
  _id: string;
  name: string;
  position: number;
  board: string;
  createdAt: string;
  updatedAt: string;
  createdBy: LiveList<LiveObject<UserLson>>;
  cards: LiveList<LiveObject<CardLson>>;
  [key: string]: any;
}