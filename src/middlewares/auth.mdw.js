export function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        req.session.returnUrl = req.originalUrl;
        res.redirect('/account/signin');
    }
}

export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session.authUser) {
            return res.redirect('/account/signin');
        }

        const hasRole = allowedRoles.includes(req.session.authUser.role);
        if (hasRole) {
            next();
        } else {
            res.render('403');
        }
    }
}