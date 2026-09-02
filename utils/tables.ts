import db from "./function";
import {
  User as UserType,
  Notes as NotesType,
  ArticlesType,
  Comments as CommentType,
  Appreciations as AppreciationType,
  Devices as DeviceType,
  SyncEvent as SyncEventType,
  Groups as GroupTable,
  ImagesType,
  Country,
  TokenBlacklist as TokenBlacklistType,
  SyncEvent,
  HistoryType,
  SyncStateRow,
  PushToken,
  ErrorLog,
  Patron,
  EtablissementRow,
  EtablissementDeviceRow,
  RapportRow,
  EmployeRow,
  CategorieRow,
  ProduitRow,
  PatronPushTokenRow,
} from "./db";

export type ENV = Partial<CloudflareBindings>;

export const UsersAccount = (env: ENV) => {
  const users = db(env).createModel<UserType>("users", {
    id: "TEXT PRIMARY KEY NOT NULL",
    name: "TEXT NOT NULL",
    email: "TEXT NOT NULL UNIQUE",
    first_name: "TEXT NOT NULL",
    // @ts-ignore
    church_status: "TEXT NOT NULL DEFAULT Member",
    association: "TEXT NULL",
    biography: "TEXT NULL",
    photo: "TEXT NULL",
    lastlogin: "TEXT NULL",
    lastlogout: "TEXT NULL",
    created: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    country: "TEXT NULL",
  });

  (async () => await users.createTable())();
  return users;
};

export const Notes = (env: ENV) => {
  const userNotes = db(env).createModel<NotesType>(`notes`, {
    id: "TEXT PRIMARY KEY",
    body: "TEXT",
    creator: "TEXT",
    pinned: "INTEGER",
    archived: "INTEGER",
    grouped: "TEXT NULL",
    created: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    lastSyncUpdate: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    html: "TEXT NULL",
    publishId: "TEXT NULL", // le texte qui entre dans cet element c'est l'Id de la publication, la date de la dernier mise a jour et le la version de la publication.
    // @ts-ignore
    clientversion: "INTEGER NOT NULL DEFAULT 0",
    lastSyncedAt: "TEXT", // NOUVEAU
    deviceId: "TEXT",     // NOUVEAU
    version: "INTEGER NOT NULL DEFAULT 1", // NOUVEAU
  });

  (async () => await userNotes.createTable())();

  return userNotes;
};
export const Publish = (env: ENV) => {
  const userNotes = db(env).createModel<ArticlesType>(`publish`, {
    id: "TEXT PRIMARY KEY",
    userid: "TEXT",
    body: "TEXT",
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    updatedAt: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    title: "TEXT NULL",
    appreciation: "TEXT NULL",
    imageurl: "TEXT NULL",
    noteid: "TEXT NULL",
    topic: "TEXT NULL",
    description: "TEXT NULL",
    // @ts-ignore
    version: "INT NOT NULL DEFAULT 1",
  });

  (async () => await userNotes.createTable())();

  return userNotes;
};

export const Articles = (env: ENV) => {
  const articles = db(env).createModel<ArticlesType>("articles", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userid: "TEXT NOT NULL",
    imageurl: "TEXT",
    noteid: "TEXT NOT NULL",
    body: "TEXT NOT NULL",
    description: "TEXT NOT NULL",
    title: "TEXT NOT NULL",
    topic: "TEXT",
    appreciation: "TEXT NOT NULL UNIQUE",
    createdAt: "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updatedAt: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    // @ts-ignore
    version: "INT NOT NULL DEFAULT 1",
  });

  (async () => await articles.createTable())();
  return articles;
};

export const Comments = (env: ENV) => {
  const comments = db(env).createModel<CommentType>("comments", {
    id: "TEXT PRIMARY KEY NOT NULL",
    articleId: "TEXT NOT NULL",
    content: "TEXT NOT NULL",
    // @ts-ignore
    notes: "INTEGER NOT NULL DEFAULT 0",
    creator: "TEXT NOT NULL",
    // @ts-ignore
    upvotes: "TEXT NOT NULL DEFAULT '[]'", // JSON array of userids who upvoted
    // @ts-ignore
    signals: "TEXT NOT NULL DEFAULT '[]'", // JSON array of userids who reported
    created: "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await comments.createTable())();
  return comments;
};

export const GroupsTable = (env: ENV) => {
  const grouped = db(env).createModel<GroupTable>("groupes", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userid: "TEXT NOT NULL",
    name: "TEXT NOT NULL",
    lastSyncUpdate: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    lastSyncedAt: "TEXT", // NOUVEAU
    deviceId: "TEXT",     // NOUVEAU
    // @ts-ignore
    version: "INT NOT NULL DEFAULT 1",
    created: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await grouped.createTable())();
  return grouped;
};
export const ImagesTable = (env: ENV) => {
  const Images = db(env).createModel<ImagesType>("images", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userid: "TEXT NOT NULL",
    name: "TEXT NOT NULL",
    mineType: "TEXT NOT NULL",
    url: "TEXT NOT NULL",
    size: "INTEGER NOT NULL",
    created: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await Images.createTable())();
  return Images;
};

export const Appreciations = (env: ENV) => {
  const appreciations = db(env).createModel<AppreciationType>("appreciations", {
    id: "TEXT PRIMARY KEY NOT NULL",
    articleId: "TEXT NOT NULL",
    userid: "TEXT NOT NULL",
  });

  (async () => await appreciations.createTable())();
  return appreciations;
};

export const UserDevice = (env: ENV) => {
  const device = db(env).createModel<DeviceType>("devices", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userid: "TEXT NOT NULL",
    devicename: "TEXT NOT NULL",
    devicecharac: "TEXT NOT NULL",
    created: "TEXT",
  });

  (async () => await device.createTable())();
  return device;
};

export const SyncEventsTable = (env: ENV) => {
  const syncEvents = db(env).createModel<SyncEvent>("sync_events", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userId: "TEXT NOT NULL",
    deviceId: "TEXT NOT NULL",
    entityType: "TEXT NOT NULL",
    entityId: "TEXT NOT NULL",
    action: "TEXT NOT NULL",
    data: "TEXT NOT NULL",
    timestamp: "TEXT NOT NULL",
    synced: "INTEGER NOT NULL DEFAULT 0",
    created: "TEXT NOT NULL",
  });
  (async () => await syncEvents.createTable())();
  return syncEvents;
};

export const CountryTable = (env: ENV) => {
  const countryTable = db(env).createModel<Country>("countries", {
    id: "TEXT PRIMARY KEY NOT NULL",
    name: "TEXT NOT NULL",
    code_2: "TEXT NOT NULL",
    code_3: "TEXT NOT NULL",
    phoneCode: "TEXT NOT NULL",
  });

  (async () => await countryTable.createTable())();
  return countryTable;
};

export const TokenBlacklistTable = (env: ENV) => {
  const tokenBlacklist = db(env).createModel<TokenBlacklistType>("token_blacklist", {
    id: "TEXT PRIMARY KEY NOT NULL",
    token: "TEXT NOT NULL UNIQUE",
    userId: "TEXT NOT NULL",
    revokedAt: "TEXT NOT NULL",
    expiresAt: "TEXT NOT NULL",
  });

  (async () => await tokenBlacklist.createTable())();
  return tokenBlacklist;
};

export const SyncStateTable = (env: ENV) => {
  const syncState = db(env).createModel<SyncStateRow>("sync_state", {
    // @ts-ignore — composite PK enforced manually below
    table_name: "TEXT NOT NULL",
    element_id: "TEXT NOT NULL",
    // @ts-ignore
    version: "INTEGER NOT NULL DEFAULT 1",
    updatedAt: "TEXT NOT NULL",
    updatedBy: "TEXT NOT NULL",
    // @ts-ignore
    deleted: "INTEGER NOT NULL DEFAULT 0",
  });

  (async () => {
    const D1 = (env as any).DB as D1Database | undefined;
    if (!D1) return;
    try {
      await D1.exec(
        "CREATE TABLE IF NOT EXISTS sync_state (table_name TEXT NOT NULL, element_id TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updatedAt TEXT NOT NULL, updatedBy TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (table_name, element_id))"
      );
      await D1.exec("CREATE INDEX IF NOT EXISTS idx_sync_state_version ON sync_state(version)");
      await D1.exec("CREATE INDEX IF NOT EXISTS idx_sync_state_table ON sync_state(table_name)");
    } catch (e) {
      console.log("[sync_state] table init error:", e);
    }
  })();

  return syncState;
};

export const PushTokensTable = (env: ENV) => {
  const pushTokens = db(env).createModel<PushToken>("push_tokens", {
    id: "TEXT PRIMARY KEY NOT NULL",
    userid: "TEXT NOT NULL",
    token: "TEXT NOT NULL UNIQUE",
    platform: "TEXT NOT NULL",
    deviceId: "TEXT NOT NULL",
    created: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    modified: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await pushTokens.createTable())();
  return pushTokens;
};

export const ErrorLogsTable = (env: ENV) => {
  const errorLogs = db(env).createModel<ErrorLog>("error_logs", {
    id: "TEXT PRIMARY KEY NOT NULL",
    message: "TEXT NOT NULL",
    stack: "TEXT NULL",
    level: "TEXT NOT NULL",
    source: "TEXT NOT NULL",
    platform: "TEXT NOT NULL",
    appVersion: "TEXT NULL",
    environment: "TEXT NOT NULL",
    userId: "TEXT NULL",
    screen: "TEXT NULL",
    extra: "TEXT NULL",
    // @ts-ignore
    resolved: "INTEGER NOT NULL DEFAULT 0",
    created: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await errorLogs.createTable())();
  return errorLogs;
};

export const HistoryTable = (env: ENV) => {
  const historyTable = db(env).createModel<HistoryType>("history", {
    id: "TEXT PRIMARY KEY NOT NULL",
    articleid: "TEXT NOT NULL",
    articleImage: "TEXT NOT NULL",
    articleTitle: "TEXT NOT NULL",
    articleCreatedAt: "TEXT NOT NULL",
    userid: "TEXT NOT NULL",
    lastReading: "TEXT NOT NULL",
  });

  (async () => await historyTable.createTable())();
  return historyTable;
};

// --- vms-counter : Patron multi-établissement ---

export const PatronsTable = (env: ENV) => {
  const patrons = db(env).createUUIDModel<Patron>("patrons", {
    id: "TEXT PRIMARY KEY",
    email: "TEXT NOT NULL UNIQUE",
    password_hash: "TEXT NOT NULL",
    password_salt: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await patrons.createTable())();
  return patrons;
};

export const EtablissementsTable = (env: ENV) => {
  const etablissements = db(env).createUUIDModel<EtablissementRow>("etablissements", {
    id: "TEXT PRIMARY KEY",
    patron_id: "TEXT NOT NULL",
    nom: "TEXT NOT NULL",
    type: "TEXT NOT NULL",
    pairing_code: "TEXT NULL",
    pairing_code_expires_at: "TEXT NULL",
    device_token_hash: "TEXT NULL",
    paired_at: "TEXT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await etablissements.createTable())();
  return etablissements;
};

export const EtablissementDevicesTable = (env: ENV) => {
  const appareils = db(env).createUUIDModel<EtablissementDeviceRow>("etablissement_devices", {
    id: "TEXT PRIMARY KEY",
    etablissement_id: "TEXT NOT NULL",
    device_token_hash: "TEXT NOT NULL",
    device_identifiant: "TEXT NULL",
    paired_at: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => {
    await appareils.createTable();
    try {
      await appareils.orm.run("ALTER TABLE etablissement_devices ADD COLUMN device_identifiant TEXT");
    } catch {
      // colonne déjà présente
    }
  })();
  return appareils;
};

export const RapportsTable = (env: ENV) => {
  // id composite (etablissement_id + session_caisse_id) : upsert() fait un INSERT OR REPLACE keyed by id,
  // donc un second push pour la même session met juste à jour la ligne au lieu de dupliquer.
  const rapports = db(env).createModel<RapportRow>("rapports", {
    id: "TEXT PRIMARY KEY",
    etablissement_id: "TEXT NOT NULL",
    session_caisse_id: "TEXT NOT NULL",
    local_rapport_id: "TEXT NOT NULL",
    date_generation: "TEXT NOT NULL",
    total_entrees: "REAL NOT NULL",
    total_sorties: "REAL NOT NULL",
    montant_reappro: "REAL NOT NULL",
    nombre_reappro: "INTEGER NOT NULL",
    nombre_commandes: "INTEGER NOT NULL",
    montant_commandes: "REAL NOT NULL",
    quantite_perdue: "REAL NOT NULL",
    nombre_ecarts_inventaire: "INTEGER NOT NULL",
    details: "TEXT NULL",
    session_date_ouverture: "TEXT NOT NULL",
    session_date_fermeture: "TEXT NULL",
    montant_ouverture: "REAL NOT NULL",
    montant_fermeture: "REAL NULL",
    ecart: "REAL NULL",
    synced_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => {
    await rapports.createTable();
    try {
      await rapports.orm.run("ALTER TABLE rapports ADD COLUMN details TEXT");
    } catch {
      // colonne déjà présente
    }
  })();
  return rapports;
};

export const EmployesTable = (env: ENV) => {
  const employes = db(env).createUUIDModel<EmployeRow>("employes", {
    id: "TEXT PRIMARY KEY",
    etablissement_id: "TEXT NOT NULL",
    nom: "TEXT NOT NULL",
    telephone: "TEXT NOT NULL",
    password_hash: "TEXT NOT NULL",
    password_salt: "TEXT NOT NULL",
    role: "TEXT NOT NULL",
    password_updated_at: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await employes.createTable())();
  return employes;
};

export const CategoriesTable = (env: ENV) => {
  const categories = db(env).createUUIDModel<CategorieRow>("categories", {
    id: "TEXT PRIMARY KEY",
    etablissement_id: "TEXT NOT NULL",
    nom: "TEXT NOT NULL",
    type: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await categories.createTable())();
  return categories;
};

export const ProduitsTable = (env: ENV) => {
  const produits = db(env).createUUIDModel<ProduitRow>("produits", {
    id: "TEXT PRIMARY KEY",
    etablissement_id: "TEXT NOT NULL",
    categorie_id: "TEXT NOT NULL",
    nom: "TEXT NOT NULL",
    prix: "REAL NOT NULL",
    quantite_par_lot: "INTEGER",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await produits.createTable())();
  return produits;
};

export const PatronPushTokensTable = (env: ENV) => {
  const tokens = db(env).createUUIDModel<PatronPushTokenRow>("patron_push_tokens", {
    id: "TEXT PRIMARY KEY",
    patron_id: "TEXT NOT NULL",
    token: "TEXT NOT NULL UNIQUE",
    platform: "TEXT NOT NULL",
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
  });

  (async () => await tokens.createTable())();
  return tokens;
};