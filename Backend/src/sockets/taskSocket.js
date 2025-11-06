export const initTaskSocket = (io) => {
  io.on("connection", (socket) => {
    const user = socket.user;
    if (user && user._id) {
      socket.join(`user:${user._id}`);
    }

    socket.on("join:task", (taskId) => {
      if (!taskId) return;
      socket.join(`task:${taskId}`);
    });

    socket.on("leave:task", (taskId) => {
      if (!taskId) return;
      socket.leave(`task:${taskId}`);
    });

    socket.on("disconnect", () => {});
  });
};
