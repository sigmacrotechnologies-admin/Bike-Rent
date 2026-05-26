import AuditLog from '../models/AuditLog.js';

export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        AuditLog.create({
          user: req.user?._id,
          action,
          resource,
          resourceId: req.params.id || body?.data?._id,
          changes: req.body,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};
