const asyncHandler = (fn) => (req, res, next) => {
    console.log(fn)
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;