import { AiHistoryType } from ".";
import {
  filterProps,
  filterResultProps,
} from "../../communs/ui/bible_component/livre";

export type Notes = {
  id: string;
  body: string;
  creator: string;
  pinned: 0 | 1;
  archived: 0 | 1;
  grouped: string | null;
  html: string;
  created: Date;
  modified: Date;
  clientversion: number;
  lastSyncUpdate: string | Date;
  version: number;
  publishId: string | null;
  lastSyncedAt: string; // Dernier timestamp de sync
  deviceId: string;      // Device qui a fait la dernière modif
  version: number;
};

export type User = {
  id: string;
  name: string;
  first_name: string;
  email: string;
  church_status: "Pastor" | "Elder" | "Deacon" | "Leader" | "Member";
  association: string | null;
  biography: string;
  country: string | null;
  photo: string;
  created: string;
  modified: string;
  lastlogin: string;
  lastlogout: string;

};

export type Groups = {
  id: string;
  name: string;
  userid: string;
  created: Date;
  modified: Date;
  lastSyncUpdate: string | Date;
  version: number;
  lastSyncedAt: string; // Dernier timestamp de sync
  deviceId: string;      // Device qui a fait la dernière modif
  version: number;
};

export interface ArticlesType {
  id?: string;
  imageurl: string;
  userid: string;
  noteid: string;
  body: string;
  description: string;
  topic: string;
  title: string;
  appreciation: string;
  createdAt: string;
  updatedAt: string;
  version: number | 1;
}

export interface Comments {
  id: string;
  articleId: string;
  creator: string;
  content: string;
  notes: number;
  upvotes: string; // JSON array of userids
  signals: string; // JSON array of userids
  created: string;
  modified: string;
}

export interface Appreciations {
  id: string;
  articleId: string;
  userid: string;
}

export interface SyncEvent {
  id: string;
  userId: string;
  deviceId: string;
  entityType: 'note' | 'group';
  entityId: string;
  action: 'created' | 'updated' | 'deleted';
  data: string; // JSON de l'entité
  timestamp: string; // ISO timestamp
  synced: number; // 0 = pas sync, 1 = syncé
  created: string;
}

export interface SyncChange {
  entityType: 'note' | 'group';
  entityId: string;
  action: 'created' | 'updated' | 'deleted';
  data?: any;
  timestamp: string;
  deviceId: string;
}
export interface SyncRequest {
  userId: string;
  deviceId: string;
  lastSyncTimestamp?: string;
  changes: SyncChange[];
}
export interface SyncResponse {
  success: boolean;
  timestamp: string;
  changes: SyncChange[];
  conflicts: SyncConflict[];
}
export interface SyncConflict {
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  resolution: 'server_wins' | 'client_wins' | 'merged';
}

export interface Devices {
  id: string;
  userid: string;
  devicename: string;
  devicecharac: string;
  created: string;
}

/* 
CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        created ,
        modified INTEGER
    );
*/

export type Session = {
  id: string;
  iduser: string;
  name?: string;
  email?: string;
};

export type UserInput = {
  name: string;
  email: string;
  lastlogin: string;
  lastlogout: string;
};

export type DeletedNote = {
  id: string;
};

export type ModifiedNote = {
  id: string;
  body: string;
  modified: number;
};

export type ArchivedNote = {
  id: string;
  archived: boolean;
};

export type GroupedLink = {
  id: string;
  grouped: string;
};

export type PinningNote = {
  id: string;
  pinned: boolean;
};

export type usersession = {
  id: string;
  iduser: string;
  name: string;
  email: string;
};

export interface ImagesType {
  id: string;
  userid: string;
  name: string;
  url: string;
  mineType: string;
  size: number;
  created: Date | string;
  modified: Date | string;
}

export interface Country {
  id: string;
  name: string;
  code_2: string;
  code_3: string;
  phoneCode: string;
}

export interface TokenBlacklist {
  id: string;
  token: string;
  userId: string;
  revokedAt: string;
  expiresAt: string;
}


export interface SyncStateRow {
  table_name: string;
  element_id: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  deleted: 0 | 1;
}

export interface HistoryType {
  id: string;
  articleid: string;
  articleImage: string
  articleTitle: string
  articleCreatedAt: string | Date
  userid: string;
  lastReading: string;
}

export interface PushToken {
  id: string;
  userid: string;
  token: string;
  platform: "ios" | "android" | "web";
  deviceId: string;
  created: string;
  modified: string;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack: string | null;
  level: "fatal" | "error" | "warning";
  source: "client" | "server";
  platform: "ios" | "android" | "web" | "unknown";
  appVersion: string | null;
  environment: "development" | "production";
  userId: string | null;
  screen: string | null;
  extra: string | null; // JSON stringifié
  resolved: 0 | 1;
  created: string;
}

// --- vms-counter : Patron multi-établissement (indépendant du reste de ce fichier) ---

export type Patron = {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
};

export type EtablissementRow = {
  id: string;
  patron_id: string;
  nom: string;
  type: string;
  pairing_code: string | null;
  pairing_code_expires_at: string | null;
  device_token_hash: string | null;
  paired_at: string | null;
  created_at: string;
};

export type EtablissementDeviceRow = {
  id: string;
  etablissement_id: string;
  device_token_hash: string;
  paired_at: string;
  created_at: string;
};

export type RapportRow = {
  id: string; // `${etablissement_id}_${session_caisse_id}` — clé synthétique pour upsert idempotent
  etablissement_id: string;
  session_caisse_id: string;
  local_rapport_id: string;
  date_generation: string;
  total_entrees: number;
  total_sorties: number;
  montant_reappro: number;
  nombre_reappro: number;
  nombre_commandes: number;
  montant_commandes: number;
  quantite_perdue: number;
  nombre_ecarts_inventaire: number;
  session_date_ouverture: string;
  session_date_fermeture: string | null;
  montant_ouverture: number;
  montant_fermeture: number | null;
  ecart: number | null;
  synced_at: string;
};

export type EmployeRow = {
  id: string;
  etablissement_id: string;
  nom: string;
  telephone: string;
  password_hash: string;
  password_salt: string;
  role: "gerant" | "serveur" | "caissier";
  password_updated_at: string;
  created_at: string;
};

export type PatronPushTokenRow = {
  id: string;
  patron_id: string;
  token: string;
  platform: "ios" | "android";
  created_at: string;
};