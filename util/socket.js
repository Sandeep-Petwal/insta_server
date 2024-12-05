let io;

module.exports = {
    init: (socketIo) => {        
        io = socketIo;
        console.log("\nSocket.io initialized!\n");
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};