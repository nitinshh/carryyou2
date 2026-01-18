const Models = require("../models/index");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on("connect_user", async function (data) {
      try {
        console.log("data", data);
        if (!data.userId) {
          error_message = {
            error_message: "please enter user id first",
          };
          socket.emit("connect_user_listener", error_message);
          return;
        }
        const socketId = socket.id;

        await Models.userModel.update(
          { isOnline: 1, socketId: socketId },
          {
            where: { id: data.userId },
          },
        );
        let success_msg = {
          success_msg: "connected successfully",
        };
        socket.emit("connect_user_listener", success_msg);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
  });
};
