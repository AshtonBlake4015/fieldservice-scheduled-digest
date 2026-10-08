import {infrai} from "./infrai.js";
import {buildDigest, workOrder} from "./digest.js";

const subscribers = (process.env.DIGEST_TO ?? "field-ops@example.com").split(",");
const orders = [workOrder.parse({id: "WO-104", site: "North depot", status: "dispatched", followUp: true, photoUrl: "https://example.com/wo-104.jpg"})];

export async function sendScheduledDigest() {
  const text = buildDigest(orders);
  if (!text) return {sent: false};
  const mail = await infrai.email.batch.send({messages: [{to: subscribers, subject: "Field-service follow-up digest", text}]});
  return {sent: true, message_id: mail.message_id};
}

if (process.env.INFRAI_API_KEY) {
  const job = await infrai.cron.create({cron_expr: "0 8 * * 1-5", task: process.env.DIGEST_TASK_URL ?? "https://example.com/fieldservice/digest"});
  await infrai.queue.publish(`scheduled-digest:${job.job_id}`);
  const batch = await infrai.queue.consume(10, 60);
  for (const message of batch.messages ?? []) {
    await sendScheduledDigest();
    await infrai.queue.ack(message.message_id);
  }
  console.log("scheduled", job.job_id);
}
