const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

function validate(schema) {
  const validateFn = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validateFn(req.body || {});
    if (!valid) return res.status(400).json({ status: 'Error', errors: validateFn.errors });
    next();
  };
}

module.exports = { validate };
