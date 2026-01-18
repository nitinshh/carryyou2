let adminSockets = []; // store connected admin sessions
let driverSockets = [];
const Models = require("../models/index");

module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    // Admin login → store socket
    socket.on("register-admin", (adminId) => {
      adminSockets.push({ adminId: String(adminId), socketId: socket.id });
      console.log("👤 Admin Registered:", adminId, "| Socket:", socket.id);
    });
    // =========================
    // DRIVER REGISTER
    // =========================
    socket.on("register-driver", (driverId) => {
      driverSockets.push({ driverId: String(driverId), socketId: socket.id });
    });

    // =========================
    // DRIVER LOCATION UPDATE
    // =========================
    socket.on("driver:location", async ({ driverId, lat, lng, orderId }) => {

      // 1️⃣ Save latest location in USERS table
      await Models.userModel.update(
        { latitude: lat, longitude: lng },
        { where: { id: driverId } }
      );

      // 2️⃣ Broadcast ONLY to admins tracking this order
      io.emit(`track-order-${orderId}`, {
        driverId,
        lat,
        lng,
      });
    });


    // Remove on disconnect
    socket.on("disconnect", () => {
      adminSockets = adminSockets.filter(s => s.socketId !== socket.id);
      driverSockets = driverSockets.filter(s => s.socketId !== socket.id);
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  // Make accessible in controllers
  global.forceLogoutAdmin = (adminId) => {
    adminSockets.filter((s) => s.adminId === String(adminId))
      .forEach((s) => {
        io.to(s.socketId).emit("force-logout");
      });
  };

  global.broadcastCodStatus = (status) => {
    io.emit("cod-status-changed", { status }); // all connected clients
  };

};
