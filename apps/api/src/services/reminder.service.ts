import cron from "node-cron";
import { pool } from "../config/db.js";
import { notifyUser } from "./notification.service.js";

export function startReminderJobs() {
  cron.schedule("0 9 * * *", async () => {
    const [rentals] = await pool.query<any[]>(
      `SELECT r.id, r.customer_id, r.end_date,
        DATEDIFF(r.end_date, CURRENT_DATE()) AS days_until_return
       FROM rentals r
       WHERE r.status = 'active'
       AND DATEDIFF(r.end_date, CURRENT_DATE()) IN (3, 1, 0, -1)`
    );

    await Promise.all(
      rentals.map((rental) =>
        notifyUser(
          rental.customer_id,
          rental.days_until_return < 0 ? "Rental overdue" : "Return reminder",
          `Rental #${rental.id} return date: ${rental.end_date}`,
          "email"
        )
      )
    );
  });
}
