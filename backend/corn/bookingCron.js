const cron = require("node-cron");
const { Op, Sequelize } = require("sequelize");
const Models = require("../models");

async function checkScheduledBookings(io) {
  try {
    console.log("⏰ Cron running: checking scheduled bookings...");

    const bookings = await Models.bookingModel.findAll({
      where: {
        status: 0,
        driverId: null,
        paymentStatus: 1,
        [Op.or]: [
          { scheduleType: 1 },
          Sequelize.literal(`
            scheduleType = 2
            AND CONVERT_TZ(NOW(), '+00:00', '+05:30')
              >= TIMESTAMP(bookingDate, bookingTime) - INTERVAL 30 MINUTE
          `),
        ],
      },
    });
     
    if (bookings?.length) {
      const drivers = await Models.userModel.findAll({
        where: {
          role: 2,
          isOnline: 1,
          socketId: { [Op.ne]: null },
        },
      });

      drivers.forEach((driver) => {
        io.to(driver.socketId).emit("createBooking");
      });
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
}

module.exports.startBookingCron = (io) => {
  // run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    await checkScheduledBookings(io);
  });

  // optional: run once on startup
  checkScheduledBookings(io);
};
