import { EtablissementRow } from "../../utils/db";
import { ENV, EtablissementDevicesTable } from "../../utils/tables";

export const MAX_APPAREILS = 2;

export async function compterAppareils(env: ENV, etab: EtablissementRow): Promise<number> {
  const appareils = await EtablissementDevicesTable(env).findAll({ where: { etablissement_id: etab.id } });
  return appareils.length + (etab.device_token_hash ? 1 : 0);
}
