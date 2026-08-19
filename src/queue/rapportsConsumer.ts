import { EtablissementsTable, PatronPushTokensTable, RapportsTable } from "../../utils/tables";
import { envoyerPushExpo } from "../lib/expoPush";

export type RapportQueueMessage = { etablissementId: string; sessionCaisseId: string };

export async function traiterRapportsQueue(
  batch: MessageBatch<RapportQueueMessage>,
  env: CloudflareBindings
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const { etablissementId, sessionCaisseId } = message.body;

      const etab = await EtablissementsTable(env).findOne({ where: { id: etablissementId } });
      if (!etab) {
        message.ack();
        continue;
      }

      const tokens = await PatronPushTokensTable(env).findAll({ where: { patron_id: etab.patron_id } });
      if (tokens.length === 0) {
        message.ack();
        continue;
      }

      const rapport = await RapportsTable(env).findOne({ where: { id: `${etablissementId}_${sessionCaisseId}` } });
      const body =
        rapport?.ecart != null && rapport.ecart !== 0
          ? `Écart de caisse : ${rapport.ecart.toFixed(2)}`
          : "Session de caisse clôturée.";

      await envoyerPushExpo(
        tokens.map((t) => ({
          to: t.token,
          title: `Nouveau rapport — ${etab.nom}`,
          body,
          data: { etablissementId, sessionCaisseId },
        }))
      );

      message.ack();
    } catch (e) {
      console.error("[rapportsConsumer] échec du traitement du message", e);
      message.retry();
    }
  }
}
