const { addNotification } = require("../controller/notification")


module.exports = (io, socket) => {


    // Follow event
    socket.on("follow", async ({ user_id, type, source_id, target_user }) => {
        console.log(`✉️ : ${target_user} followed ${user_id}`);

        io.emit(`notification-${user_id}`, {
            user_id,
            type: "follow",
            source_id,
            target_user
        });

        // user_id, type, source_id, target_user
        await addNotification(user_id, type, source_id, target_user);  // storing notification to db
    });

    // Like event
    socket.on("like", async ({ user_id, type, source_id, target_user }) => {
        console.log(`✉️ : ${target_user} liked post ${source_id}`);

        io.emit(`notification-${user_id}`, {
            user_id,
            type: "like",
            source_id,
            target_user
        });

        // user_id, type, source_id, target_user
        await addNotification(user_id, type, source_id, target_user);  // storing notification to db
    });


    socket.on("comment", async ({ user_id, type, source_id, target_user }) => {
        console.log(`✉️ : user ${target_user} commented on your post ${source_id}`);

        io.emit(`notification-${user_id}`, {
            user_id,
            type: "comment",
            source_id,
            target_user
        });

        // user_id, type, source_id, target_user
        await addNotification(user_id, type, source_id, target_user);  // storing notification to db

    });


};
