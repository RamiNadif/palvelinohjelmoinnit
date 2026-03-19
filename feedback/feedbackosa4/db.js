const requireLogin = (req, res, next) => {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect("/login");
  }
  next();
};
export default requireLogin;
