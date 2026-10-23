export function notFound(req, res) { res.status(404).json({ error: 'That route could not be found.' }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(err.message || err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message });
}
