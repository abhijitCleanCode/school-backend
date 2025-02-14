// We’ll create a middleware that checks the user’s role and allows access based on the following rules:

// Principal: Can access all routes (student, teacher, and principal routes).

// Teacher: Can access teacher and student routes.

// Student: Can only access student routes.

export function authorize(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user.role || req.role;

    // Principal has access to everything
    if (userRole === "principal") {
      return next();
    }

    // Check if the user's role is allowed
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Deny access if the role is not allowed
    return res.status(403).json({ message: "Access denied" });
  };
}
