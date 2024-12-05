const { storeMessage } = require("../controller/messageController")

module.exports = (io, socket) => {

    // socket.on("start_typing", ({ from, to }) => {
    //     console.log(from + " is started typing for " + to);
    //     io.emit(`typing_for_${to}`, ({ from, to }));
    // })

    // socket.on("stop_typing", ({ from, to }) => {
    //     console.log(from + " is stoped typing for " + to);
    //     io.emit(`stops_typing_for_${to}`, ({ from, to }));
    // });

    // store user online 
    // socket.on("online", (user_id) => {
    //     onlineUsers.set(user_id, socket.id);
    //     console.log("User " + user_id + " is online.");
    //     io.emit("userOnline", user_id);  // send online event to frontend
    //     setOnline(user_id);             // store online status to db
    // })

    // listen messages
    socket.on("message", ({ sender_id, receiver_id, text }) => {
        // console.table({ sender_id, receiver_id, text });
        // console.log(`Message (${text}) ` + "received from: " + sender_id + ", to: " + receiver_id);
        // console.log("\nMessage recived \n" + text)

        // send to receiver only
        io.emit(`message_${receiver_id}`, { sender_id, receiver_id, text });
        storeMessage(sender_id, receiver_id, text);
    });
};
