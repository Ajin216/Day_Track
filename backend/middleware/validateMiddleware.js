/**
 * Express middleware higher-order function that applies a validator function to req.body.
 */
export const validate = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req.body)
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: result.message,
    })
  }
  next()
}

/**
 * Express middleware higher-order function that applies a validator function to req.query.
 */
export const validateQuery = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req.query)
  if (!result.isValid) {
    return res.status(400).json({
      success: false,
      message: result.message,
    })
  }
  next()
}

