const { AdminLog } = require("../../model");

const adminLogger = async (req, res, next) => {
    const originalSend = res.send;
    let status_code;
    let response_body;

    res.send = function (body) {
        status_code = res.statusCode;
        originalSend.apply(res, arguments);
        response_body = body;
    };

    try {
        res.on('finish', async () => {
            try {
                await AdminLog.create({
                    admin_id: req.user?.user_id,
                    route: req.originalUrl,
                    method: req.method,
                    ip_address: req.ip || req.connection.remoteAddress,
                    user_agent: req.headers['user-agent'],
                    request_body: JSON.stringify(req.body),
                    status_code,
                    response_body
                });
            } catch (error) {
                console.error('Error logging admin action:', error);
                console.log("\nError in logging :: Route :: \n" + req.originalUrl);
            }
        }); 

        next();
    } catch (error) {
        console.error('Error in admin logger middleware:', error);
        next();
    }
};

module.exports = adminLogger;